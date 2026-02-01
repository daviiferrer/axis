-- Migration: Add WAHA session linking to campaigns
-- Description: Links campaigns to specific WAHA WhatsApp sessions for multi-tenancy routing
-- Date: 2026-01-28

-- Add waha_session_name column to campaigns table
ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS waha_session_name TEXT;

-- Add index for fast session-based lookups (used in webhook routing)
CREATE INDEX IF NOT EXISTS idx_campaigns_waha_session 
ON campaigns(waha_session_name) 
WHERE waha_session_name IS NOT NULL;

-- Add comment explaining the column
COMMENT ON COLUMN campaigns.waha_session_name IS 'WAHA WhatsApp session name - links incoming messages to specific campaigns for multi-tenant routing';
