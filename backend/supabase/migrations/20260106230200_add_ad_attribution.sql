-- Migration: Add detailed ad attribution columns to campaign_leads
-- Description: Adds first-class support for Meta Ads attribution instead of using JSONB custom_fields.

ALTER TABLE campaign_leads 
ADD COLUMN IF NOT EXISTS ad_source_id TEXT, -- Facebook Ad ID (e.g. 123456789)
ADD COLUMN IF NOT EXISTS ad_headline TEXT,  -- Ad Headline (e.g. "Promoção de Verão")
ADD COLUMN IF NOT EXISTS ad_body TEXT,      -- Ad Body Text
ADD COLUMN IF NOT EXISTS ad_media_type TEXT, -- image/video
ADD COLUMN IF NOT EXISTS ad_source_url TEXT; -- Facebook Deep Link

-- Indexing for fast ROI reports
CREATE INDEX IF NOT EXISTS idx_campaign_leads_ad_source_id ON campaign_leads(ad_source_id);
