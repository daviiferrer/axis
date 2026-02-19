-- Migration: Add campaign settings JSONB column
-- This enables per-campaign configuration of business hours and outbound rate limiting.

ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{
    "businessHours": {
        "enabled": true,
        "start": 8,
        "end": 20,
        "timezone": "America/Sao_Paulo",
        "workDays": [1,2,3,4,5]
    },
    "outbound": {
        "delayBetweenLeads": 30,
        "batchSize": 20
    }
}'::jsonb;

-- Backfill existing campaigns that have NULL settings
UPDATE campaigns SET settings = '{
    "businessHours": {
        "enabled": true,
        "start": 8,
        "end": 20,
        "timezone": "America/Sao_Paulo",
        "workDays": [1,2,3,4,5]
    },
    "outbound": {
        "delayBetweenLeads": 30,
        "batchSize": 20
    }
}'::jsonb WHERE settings IS NULL;
