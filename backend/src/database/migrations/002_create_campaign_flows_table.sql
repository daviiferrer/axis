-- Create campaign_flows table
CREATE TABLE IF NOT EXISTS campaign_flows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    flow_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    version INTEGER NOT NULL DEFAULT 1,
    is_published BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_campaign_flows_campaign_id ON campaign_flows(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_flows_published ON campaign_flows(is_published);

-- Enable RLS
ALTER TABLE campaign_flows ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Inherit from campaigns table
CREATE POLICY "Users can view flows from their company's campaigns"
    ON campaign_flows
    FOR SELECT
    USING (
        campaign_id IN (
            SELECT id FROM campaigns WHERE company_id IN (
                SELECT company_id FROM user_companies WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can create flows for their company's campaigns"
    ON campaign_flows
    FOR INSERT
    WITH CHECK (
        campaign_id IN (
            SELECT id FROM campaigns WHERE company_id IN (
                SELECT company_id FROM user_companies WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can update flows from their company's campaigns"
    ON campaign_flows
    FOR UPDATE
    USING (
        campaign_id IN (
            SELECT id FROM campaigns WHERE company_id IN (
                SELECT company_id FROM user_companies WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can delete flows from their company's campaigns"
    ON campaign_flows
    FOR DELETE
    USING (
        campaign_id IN (
            SELECT id FROM campaigns WHERE company_id IN (
                SELECT company_id FROM user_companies WHERE user_id = auth.uid()
            )
        )
    );

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_campaign_flows_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER campaign_flows_updated_at
    BEFORE UPDATE ON campaign_flows
    FOR EACH ROW
    EXECUTE FUNCTION update_campaign_flows_updated_at();

-- Auto-increment version on insert
CREATE OR REPLACE FUNCTION increment_campaign_flow_version()
RETURNS TRIGGER AS $$
BEGIN
    NEW.version = COALESCE(
        (SELECT MAX(version) FROM campaign_flows WHERE campaign_id = NEW.campaign_id),
        0
    ) + 1;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER campaign_flows_version_increment
    BEFORE INSERT ON campaign_flows
    FOR EACH ROW
    EXECUTE FUNCTION increment_campaign_flow_version();
