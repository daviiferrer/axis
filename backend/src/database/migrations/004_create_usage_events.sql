-- Migration: 004_create_usage_events
-- Tracking AI costs and token usage per company

CREATE TABLE IF NOT EXISTS usage_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- AI Usage Details
    model TEXT NOT NULL,                    -- 'gemini-2.0-flash', 'gpt-4o', etc.
    provider TEXT DEFAULT 'gemini',         -- 'gemini', 'openai', 'anthropic'
    tokens_input INTEGER DEFAULT 0,
    tokens_output INTEGER DEFAULT 0,
    tokens_total INTEGER GENERATED ALWAYS AS (tokens_input + tokens_output) STORED,
    
    -- Cost (in USD for consistency, convert to BRL in app)
    cost_usd NUMERIC(10, 6) DEFAULT 0,
    
    -- Context
    purpose TEXT,                           -- 'chat_response', 'qualification', 'summarization'
    lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast aggregation
CREATE INDEX IF NOT EXISTS idx_usage_events_company ON usage_events(company_id);
CREATE INDEX IF NOT EXISTS idx_usage_events_created ON usage_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_events_model ON usage_events(model);
CREATE INDEX IF NOT EXISTS idx_usage_events_daily ON usage_events(company_id, DATE(created_at));

-- RLS
ALTER TABLE usage_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY usage_events_company_policy ON usage_events
    FOR ALL USING (
        company_id IN (
            SELECT company_id FROM company_members 
            WHERE user_id = auth.uid()
        )
    );

-- Comments
COMMENT ON TABLE usage_events IS 'Tracks AI token usage and costs per company for billing and analytics';
COMMENT ON COLUMN usage_events.cost_usd IS 'Cost in USD. Convert to BRL using current exchange rate in application';
