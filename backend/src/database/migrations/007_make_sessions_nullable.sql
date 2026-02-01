-- Migration: Make session columns nullable for flexible campaign routing
-- Description: Decouples campaigns from strict session binding to allow Node-based routing
-- Date: 2026-01-30

-- 1. Make session_id nullable
ALTER TABLE campaigns 
ALTER COLUMN session_id DROP NOT NULL;

-- 2. Make waha_session_name nullable (if not already, just to be safe)
ALTER TABLE campaigns 
ALTER COLUMN waha_session_name DROP NOT NULL;

-- 3. Add comment specifically about the new flexible behavior
COMMENT ON COLUMN campaigns.session_id IS 'DEPRECATED strict binding. If NULL, routing is determined by TriggerNodes in the graph.';
COMMENT ON COLUMN campaigns.waha_session_name IS 'DEPRECATED strict binding. If NULL, routing is determined by TriggerNodes in the graph.';

-- 4. Unified Graph Column - Ensure 'graph' is the source of truth
-- (Optional: copy strategy_graph to graph if graph is empty, but user mentioned "tem dois graph")
-- We will assume 'graph' is the standardized column moving forward.
COMMENT ON COLUMN campaigns.graph IS 'Primary storage for Campaign Logic Graph (Nodes & Edges)';
COMMENT ON COLUMN campaigns.strategy_graph IS 'DEPRECATED - Legacy column. Use graph instead.';
