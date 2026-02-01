-- Migration: Add Cascade Delete for Campaign Dependencies
-- Date: 2026-01-30

-- 1. Update campaign_instances foreign key to CASCADE
ALTER TABLE campaign_instances
DROP CONSTRAINT IF EXISTS campaign_instances_campaign_id_fkey;

ALTER TABLE campaign_instances
ADD CONSTRAINT campaign_instances_campaign_id_fkey
FOREIGN KEY (campaign_id)
REFERENCES campaigns(id)
ON DELETE CASCADE;

-- 2. Ensure leads table also has CASCADE
ALTER TABLE leads
DROP CONSTRAINT IF EXISTS campaign_leads_campaign_id_fkey;

ALTER TABLE leads
ADD CONSTRAINT campaign_leads_campaign_id_fkey
FOREIGN KEY (campaign_id)
REFERENCES campaigns(id)
ON DELETE CASCADE;

-- 3. Update workflow_instances foreign key as well
ALTER TABLE workflow_instances
DROP CONSTRAINT IF EXISTS workflow_instances_campaign_id_fkey;

ALTER TABLE workflow_instances
ADD CONSTRAINT workflow_instances_campaign_id_fkey
FOREIGN KEY (campaign_id)
REFERENCES campaigns(id)
ON DELETE CASCADE;
