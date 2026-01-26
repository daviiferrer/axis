-- Migration: Create workflow_instances table for Durable Execution
-- Author: ÁXIS Team
-- Date: 2025-01-26
-- Description: Enables checkpoint-based state persistence for long-running workflows

-- ============================================================================
-- TABLE: workflow_instances
-- Purpose: Persist FSM state for durable execution (survives server restarts)
-- ============================================================================

CREATE TABLE IF NOT EXISTS workflow_instances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Correlation Keys
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    
    -- FSM State
    current_node_id TEXT NOT NULL,
    execution_state TEXT NOT NULL DEFAULT 'IDLE',
    -- Valid states: IDLE, ENTERED, PROCESSING, AWAITING_ASYNC, EXITED, FAILED, SKIPPED
    
    -- Checkpoint Data (JSONB for flexibility)
    node_state JSONB DEFAULT '{}',      -- Node-specific state (e.g., scheduled_at, retry_count)
    context JSONB DEFAULT '{}',          -- Accumulated context (lastIntent, lastSentiment, slots)
    variables JSONB DEFAULT '{}',        -- User-defined workflow variables
    
    -- Async Wait Handling
    waiting_for TEXT,                    -- 'USER_REPLY' | 'TIMER' | 'WEBHOOK' | NULL
    wait_until TIMESTAMPTZ,              -- For timer-based waits (DelayNode)
    correlation_key TEXT,                -- For webhook correlation (future use)
    
    -- Lifecycle Timestamps
    started_at TIMESTAMPTZ DEFAULT NOW(),
    last_executed_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    paused_at TIMESTAMPTZ,               -- For handoff/manual pause
    
    -- Error Tracking
    error_count INT DEFAULT 0,
    last_error TEXT,
    last_error_at TIMESTAMPTZ,
    
    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_active_lead_campaign UNIQUE (lead_id, campaign_id)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Find instances waiting for timer expiry (Timer Recovery Worker)
CREATE INDEX IF NOT EXISTS idx_instances_timer_wait 
    ON workflow_instances(waiting_for, wait_until) 
    WHERE waiting_for = 'TIMER' AND completed_at IS NULL;

-- Find instances waiting for user reply (Webhook Correlation)
CREATE INDEX IF NOT EXISTS idx_instances_user_wait 
    ON workflow_instances(waiting_for, lead_id) 
    WHERE waiting_for = 'USER_REPLY' AND completed_at IS NULL;

-- Find all active instances for a campaign (Admin/Debug)
CREATE INDEX IF NOT EXISTS idx_instances_campaign 
    ON workflow_instances(campaign_id, execution_state) 
    WHERE completed_at IS NULL;

-- Find instance by lead (Quick lookup)
CREATE INDEX IF NOT EXISTS idx_instances_lead 
    ON workflow_instances(lead_id);

-- ============================================================================
-- TRIGGER: Auto-update updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION update_workflow_instances_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_workflow_instances_updated_at ON workflow_instances;
CREATE TRIGGER trigger_workflow_instances_updated_at
    BEFORE UPDATE ON workflow_instances
    FOR EACH ROW
    EXECUTE FUNCTION update_workflow_instances_updated_at();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE workflow_instances IS 'Durable state persistence for workflow execution. Enables checkpoint-based recovery after server restarts.';
COMMENT ON COLUMN workflow_instances.execution_state IS 'FSM state: IDLE, ENTERED, PROCESSING, AWAITING_ASYNC, EXITED, FAILED, SKIPPED';
COMMENT ON COLUMN workflow_instances.waiting_for IS 'Type of async wait: USER_REPLY (webhook), TIMER (delay), WEBHOOK (external), NULL (not waiting)';
COMMENT ON COLUMN workflow_instances.node_state IS 'Node-specific checkpoint data (e.g., DelayNode scheduled_at, AgentNode retry state)';
COMMENT ON COLUMN workflow_instances.context IS 'Accumulated conversation context (lastIntent, lastSentiment, qualification_slots)';
