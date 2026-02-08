-- Add 'env' column to campaigns table to isolate Development vs Production
-- Default to 'production' so existing campaigns continue working on VPS

ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS env TEXT DEFAULT 'production';

-- Create index for faster filtering by environment
CREATE INDEX IF NOT EXISTS idx_campaigns_env ON campaigns(env);
