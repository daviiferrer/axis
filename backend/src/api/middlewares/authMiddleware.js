/**
 * Authentication Middleware (Refactored for Clean Slate)
 * Uses SupabaseClientFactory and Memberships table.
 */
const createAuthMiddleware = () => async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({ error: 'Missing Authorization Header' });
        }

        const token = authHeader.replace('Bearer ', '');
        // console.log('[Auth] Token received ending in:', token.slice(-5)); // Debugging log

        // 1. Resolve Factory from Container (Scope)
        const factory = req.container.resolve('supabaseClientFactory');

        // 2. Create Scoped Client
        const supabase = factory.createClientForUser(token);

        // 3. Verify Token & Get User
        // We use the scoped client to verify. If token is invalid, this returns error.
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user) {
            console.warn('[Auth] Invalid Token:', error?.message);
            return res.status(401).json({ error: 'Invalid Token' });
        }

        req.user = user;
        req.supabase = supabase; // Inject scoped client for Controllers to use via req.supabase if needed
        // OR Controllers should rely on Service injection? 
        // Services are injected with a client, but which one?
        // If Services are scoped, they should get THIS client.
        // BUT Awilix resolves services at request start.
        // We might need to Register this client into the Scope?

        // CRITICAL DECOUPPLING:
        // Register the scoped client into the container so Services resolved AFTER this middleware
        // get the correct user-scoped client.
        const { asValue } = require('awilix');
        req.container.register({
            supabaseClient: asValue(supabase)
        });

        // 4. Fetch Memberships & Profile
        // We always need the Profile to know System Roles (admin/owner/member)
        const { data: profile } = await supabase
            .from('profiles')
            .select('id, role, company_id')
            .eq('id', user.id)
            .single();

        if (profile) {
            req.user.profile = profile;
        }

        // 5. Fetch Memberships (Context)
        // We expect the frontend to send 'x-company-id' header if they want a specific context.
        const targetCompanyId = req.headers['x-company-id'];

        const { data: memberships, error: memError } = await supabase
            .from('memberships')
            .select('*')
            .eq('user_id', user.id);

        if (memError) {
            console.error('[Auth] Failed to fetch memberships:', memError);
            return res.status(500).json({ error: 'Failed to load user context' });
        }

        // Determine Active Membership
        let activeMembership = null;
        if (targetCompanyId) {
            activeMembership = memberships.find(m => m.company_id === targetCompanyId);
        } else if (memberships.length > 0) {
            activeMembership = memberships[0];
        }

        // FALLBACK 1: Profile Link
        if (!activeMembership && memberships.length === 0 && profile?.company_id) {
            console.warn(`[Auth] Check 1: Profile Link found ${profile.company_id}`);
            activeMembership = {
                user_id: user.id,
                company_id: profile.company_id,
                role: profile.role || 'owner',
                status: 'active'
            };
            memberships.push(activeMembership);
        }

        // FALLBACK 2: Deep Lookup (Check if they own any company directly)
        if (!activeMembership && memberships.length === 0) {
            const { data: ownedCompany } = await supabase
                .from('companies')
                .select('id')
                .eq('owner_id', user.id)
                .limit(1)
                .single();

            if (ownedCompany) {
                console.warn(`[Auth] Check 2: Found owned company ${ownedCompany.id} (Healing Context)`);
                activeMembership = {
                    user_id: user.id,
                    company_id: ownedCompany.id,
                    role: 'owner',
                    status: 'active'
                };
                memberships.push(activeMembership);
            }
        }

        if (memberships.length > 0 && !activeMembership) {
            console.warn(`[Auth] User ${user.email} requested company ${targetCompanyId} but has no membership.`);
            // Allow Viewer access? or Denial? 
            // Ideally deny if explicit header is wrong.
            if (targetCompanyId) return res.status(403).json({ error: 'Access Denied to this Company' });
        }

        req.user.membership = activeMembership;
        req.user.allMemberships = memberships;

        console.log(`✅ [Auth] User ${user.email} | Company: ${activeMembership?.company_id || 'NONE'}`);

        next();
    } catch (err) {
        console.error('[Auth] Unexpected error:', err);
        res.status(500).json({ error: 'Internal Authentication Error' });
    }
};

module.exports = createAuthMiddleware;
