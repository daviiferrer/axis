-- Create campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'archived')),
    session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_campaigns_company_id ON campaigns(company_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_session_id ON campaigns(session_id);

-- Enable RLS
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Users can only see campaigns from their company
CREATE POLICY "Users can view campaigns from their company"
    ON campaigns
    FOR SELECT
    USING (
        company_id IN (
            SELECT company_id FROM user_companies WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create campaigns for their company"
    ON campaigns
    FOR INSERT
    WITH CHECK (
        company_id IN (
            SELECT company_id FROM user_companies WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update campaigns from their company"
    ON campaigns
    FOR UPDATE
    USING (
        company_id IN (
            SELECT company_id FROM user_companies WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete campaigns from their company"
    ON campaigns
    FOR DELETE
    USING (
        company_id IN (
            SELECT company_id FROM user_companies WHERE user_id = auth.uid()
        )
    );

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_campaigns_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER campaigns_updated_at
    BEFORE UPDATE ON campaigns
    FOR EACH ROW
    EXECUTE FUNCTION update_campaigns_updated_at();
