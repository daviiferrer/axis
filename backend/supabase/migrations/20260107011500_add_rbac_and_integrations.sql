-- Migration: Add Teams (RBAC), Invites, and Integrations (OAuth)
-- Respecting existing 'companies' and 'profiles' tables

-- 1. Update Profiles Role Check (if needed)
-- Note: Existing check is role = ANY (ARRAY['owner', 'admin', 'editor', 'viewer', 'member'])
-- We will use 'member' as 'agent' equivalent, or we can drop the constraint to add 'agent'.
-- For now, let's treat 'member' as the basic agent role.

-- 2. Create Invites Table
CREATE TABLE IF NOT EXISTS public.invites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'editor', 'member')), -- 'member' = Agent
    token TEXT NOT NULL UNIQUE, -- Magic Link Token
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create Integrations Table (For Meta OAuth Tokens)
CREATE TABLE IF NOT EXISTS public.integrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE, -- Linked to Company
    provider TEXT NOT NULL CHECK (provider IN ('facebook', 'google')),
    access_token TEXT NOT NULL, -- Encrypted app-side or via pgsodium
    refresh_token TEXT,
    token_expires_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'::jsonb, -- Store ad_account_ids, page_ids
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(company_id, provider) -- One active connection per provider per company
);

-- 4. Update Campaign Leads for Handoff
ALTER TABLE public.campaign_leads 
ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 5. Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_invites_token ON public.invites(token);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON public.campaign_leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_integrations_company ON public.integrations(company_id);

-- 6. RLS Policies
ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;

-- Policy: Invites visible to company admins/owners
CREATE POLICY "Admins can manage invites" 
ON public.invites FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND company_id = invites.company_id 
        AND role IN ('owner', 'admin')
    )
);

-- Policy: Integrations visible to company admins/owners
CREATE POLICY "Admins can manage integrations" 
ON public.integrations FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND company_id = integrations.company_id 
        AND role IN ('owner', 'admin')
    )
);

-- Enable Realtime for Handoff
alter publication supabase_realtime add table public.campaign_leads;
