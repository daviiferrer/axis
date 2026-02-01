-- Migration: 002_add_hybrid_search_support
-- Description: Adds vector embeddings and full-text search capabilities for RAG
-- Date: 2026-01-27

-- =====================================================
-- STEP 1: Enable required extensions
-- =====================================================

-- pgvector for semantic search
CREATE EXTENSION IF NOT EXISTS vector;

-- pg_trgm for trigram similarity
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- =====================================================
-- STEP 2: Add embedding columns to products table
-- =====================================================

-- Add embedding column (768 dimensions for text-embedding-004)
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS embedding vector(768);

-- Add full-text search column (auto-generated)
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS fts tsvector 
GENERATED ALWAYS AS (
    setweight(to_tsvector('portuguese', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('portuguese', coalesce(description, '')), 'B') ||
    setweight(to_tsvector('portuguese', coalesce(category, '')), 'C')
) STORED;

-- =====================================================
-- STEP 3: Create FAQs table for knowledge base
-- =====================================================

CREATE TABLE IF NOT EXISTS faqs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    question text NOT NULL,
    answer text NOT NULL,
    category text,
    tags text[],
    embedding vector(768),
    fts tsvector GENERATED ALWAYS AS (
        setweight(to_tsvector('portuguese', coalesce(question, '')), 'A') ||
        setweight(to_tsvector('portuguese', coalesce(answer, '')), 'B')
    ) STORED,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- =====================================================
-- STEP 4: Create knowledge_base table for documents
-- =====================================================

CREATE TABLE IF NOT EXISTS knowledge_base (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    title text NOT NULL,
    content text NOT NULL,
    source text, -- 'manual', 'url', 'pdf'
    source_url text,
    embedding vector(768),
    fts tsvector GENERATED ALWAYS AS (
        setweight(to_tsvector('portuguese', coalesce(title, '')), 'A') ||
        setweight(to_tsvector('portuguese', coalesce(content, '')), 'B')
    ) STORED,
    metadata jsonb DEFAULT '{}',
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- =====================================================
-- STEP 5: Create indexes for efficient search
-- =====================================================

-- Vector indexes (using IVFFlat for better RLS compatibility)
-- Note: HNSW has issues with RLS partition pruning
CREATE INDEX IF NOT EXISTS idx_products_embedding 
ON products USING ivfflat (embedding vector_cosine_ops) 
WITH (lists = 100);

CREATE INDEX IF NOT EXISTS idx_faqs_embedding 
ON faqs USING ivfflat (embedding vector_cosine_ops) 
WITH (lists = 100);

CREATE INDEX IF NOT EXISTS idx_knowledge_base_embedding 
ON knowledge_base USING ivfflat (embedding vector_cosine_ops) 
WITH (lists = 100);

-- Full-text search indexes
CREATE INDEX IF NOT EXISTS idx_products_fts ON products USING GIN (fts);
CREATE INDEX IF NOT EXISTS idx_faqs_fts ON faqs USING GIN (fts);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_fts ON knowledge_base USING GIN (fts);

-- Trigram indexes for fuzzy matching
CREATE INDEX IF NOT EXISTS idx_products_name_trgm ON products USING GIN (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_faqs_question_trgm ON faqs USING GIN (question gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_title_trgm ON knowledge_base USING GIN (title gin_trgm_ops);

-- Company ID indexes for RLS (CRITICAL for performance)
CREATE INDEX IF NOT EXISTS idx_faqs_company_id ON faqs (company_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_company_id ON knowledge_base (company_id);

-- =====================================================
-- STEP 6: RLS Policies
-- =====================================================

ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;

-- FAQs policies
CREATE POLICY "faqs_select_own_company" ON faqs
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM user_companies 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "faqs_insert_own_company" ON faqs
    FOR INSERT WITH CHECK (
        company_id IN (
            SELECT company_id FROM user_companies 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "faqs_update_own_company" ON faqs
    FOR UPDATE USING (
        company_id IN (
            SELECT company_id FROM user_companies 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "faqs_delete_own_company" ON faqs
    FOR DELETE USING (
        company_id IN (
            SELECT company_id FROM user_companies 
            WHERE user_id = auth.uid()
        )
    );

-- Knowledge base policies
CREATE POLICY "kb_select_own_company" ON knowledge_base
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM user_companies 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "kb_insert_own_company" ON knowledge_base
    FOR INSERT WITH CHECK (
        company_id IN (
            SELECT company_id FROM user_companies 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "kb_update_own_company" ON knowledge_base
    FOR UPDATE USING (
        company_id IN (
            SELECT company_id FROM user_companies 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "kb_delete_own_company" ON knowledge_base
    FOR DELETE USING (
        company_id IN (
            SELECT company_id FROM user_companies 
            WHERE user_id = auth.uid()
        )
    );

-- =====================================================
-- STEP 7: Create match_documents RPC function for vector search
-- =====================================================

CREATE OR REPLACE FUNCTION match_documents(
    query_embedding vector(768),
    match_threshold float DEFAULT 0.5,
    match_count int DEFAULT 10,
    table_name text DEFAULT 'products',
    p_company_id uuid DEFAULT NULL
)
RETURNS TABLE (
    id uuid,
    title text,
    content text,
    similarity float
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF table_name = 'products' THEN
        RETURN QUERY
        SELECT 
            p.id,
            p.name as title,
            p.description as content,
            1 - (p.embedding <=> query_embedding) as similarity
        FROM products p
        WHERE 
            p.embedding IS NOT NULL
            AND (p_company_id IS NULL OR p.company_id = p_company_id)
            AND 1 - (p.embedding <=> query_embedding) > match_threshold
        ORDER BY p.embedding <=> query_embedding
        LIMIT match_count;
        
    ELSIF table_name = 'faqs' THEN
        RETURN QUERY
        SELECT 
            f.id,
            f.question as title,
            f.answer as content,
            1 - (f.embedding <=> query_embedding) as similarity
        FROM faqs f
        WHERE 
            f.embedding IS NOT NULL
            AND f.is_active = true
            AND (p_company_id IS NULL OR f.company_id = p_company_id)
            AND 1 - (f.embedding <=> query_embedding) > match_threshold
        ORDER BY f.embedding <=> query_embedding
        LIMIT match_count;
        
    ELSIF table_name = 'knowledge_base' THEN
        RETURN QUERY
        SELECT 
            kb.id,
            kb.title,
            kb.content,
            1 - (kb.embedding <=> query_embedding) as similarity
        FROM knowledge_base kb
        WHERE 
            kb.embedding IS NOT NULL
            AND kb.is_active = true
            AND (p_company_id IS NULL OR kb.company_id = p_company_id)
            AND 1 - (kb.embedding <=> query_embedding) > match_threshold
        ORDER BY kb.embedding <=> query_embedding
        LIMIT match_count;
    END IF;
END;
$$;

-- =====================================================
-- STEP 8: Add fence_token column to workflow_instances
-- for split-brain prevention
-- =====================================================

ALTER TABLE workflow_instances 
ADD COLUMN IF NOT EXISTS fence_token bigint DEFAULT 0;

-- Index for fence token queries
CREATE INDEX IF NOT EXISTS idx_workflow_instances_fence_token 
ON workflow_instances (id, fence_token);

-- =====================================================
-- STEP 9: Add turn_count to track conversation length
-- for persona refresh mechanism
-- =====================================================

ALTER TABLE chats 
ADD COLUMN IF NOT EXISTS turn_count integer DEFAULT 0;

-- =====================================================
-- STEP 10: Add canary_tokens table for security tracking
-- =====================================================

CREATE TABLE IF NOT EXISTS security_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
    event_type text NOT NULL, -- 'canary_leak', 'prompt_injection', 'toxicity'
    chat_id uuid REFERENCES chats(id) ON DELETE SET NULL,
    lead_id uuid REFERENCES leads(id) ON DELETE SET NULL,
    details jsonb DEFAULT '{}',
    blocked boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_security_events_company_id ON security_events (company_id);
CREATE INDEX IF NOT EXISTS idx_security_events_type ON security_events (event_type);
CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON security_events (created_at DESC);

-- RLS for security_events
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "security_events_select_own_company" ON security_events
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM user_companies 
            WHERE user_id = auth.uid()
        )
    );

-- =====================================================
-- STEP 11: Usage events table for token-based billing
-- =====================================================

CREATE TABLE IF NOT EXISTS usage_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    event_type text NOT NULL, -- 'llm_generation', 'embedding', 'tts', 'stt'
    model text, -- 'gemini-2.0-flash', 'text-embedding-004'
    tokens_input integer DEFAULT 0,
    tokens_output integer DEFAULT 0,
    tokens_total integer GENERATED ALWAYS AS (tokens_input + tokens_output) STORED,
    workflow_id uuid REFERENCES workflow_instances(id) ON DELETE SET NULL,
    chat_id uuid REFERENCES chats(id) ON DELETE SET NULL,
    trace_id text, -- Langfuse trace ID
    status text DEFAULT 'pending', -- 'pending', 'success', 'failed'
    cost_usd numeric(12, 8) DEFAULT 0,
    metadata jsonb DEFAULT '{}',
    created_at timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_usage_events_company_id ON usage_events (company_id);
CREATE INDEX IF NOT EXISTS idx_usage_events_status ON usage_events (status);
CREATE INDEX IF NOT EXISTS idx_usage_events_created_at ON usage_events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_events_billing ON usage_events (company_id, status, created_at);

-- RLS for usage_events
ALTER TABLE usage_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usage_events_select_own_company" ON usage_events
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM user_companies 
            WHERE user_id = auth.uid()
        )
    );

-- =====================================================
-- STEP 12: Helper function to aggregate billable usage
-- =====================================================

CREATE OR REPLACE FUNCTION get_billable_usage(
    p_company_id uuid,
    p_start_date timestamp with time zone DEFAULT date_trunc('month', now()),
    p_end_date timestamp with time zone DEFAULT now()
)
RETURNS TABLE (
    event_type text,
    model text,
    total_tokens bigint,
    total_cost numeric
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT 
        event_type,
        model,
        SUM(tokens_total)::bigint as total_tokens,
        SUM(cost_usd) as total_cost
    FROM usage_events
    WHERE 
        company_id = p_company_id
        AND status = 'success'
        AND created_at >= p_start_date
        AND created_at < p_end_date
    GROUP BY event_type, model
    ORDER BY total_tokens DESC;
$$;

-- =====================================================
-- Done! Run with: supabase db push OR directly via psql
-- =====================================================
