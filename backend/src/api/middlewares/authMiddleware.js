/**
 * Authentication Middleware
 */
const logger = require('../../shared/Logger').createModuleLogger('auth');

const createAuthMiddleware = () => async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({ error: 'Missing Authorization Header' });
        }

        const token = authHeader.replace(/^Bearer\s+/i, '');
        // console.log('[Auth] Token received ending in:', token.slice(-5)); // Debugging log

        // 1. Resolve Factory from Container (Scope)
        const factory = req.container.resolve('supabaseClientFactory');

        // 2. Create Scoped Client
        const supabase = factory.createClientForUser(token);

        // 3. Verify Token & Get User
        // We use the scoped client to verify. If token is invalid, this returns error.
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user) {
            logger.warn({ error: error?.message }, 'Invalid token');
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
        // [FIX] Use ADMIN client to fetch profile to bypass ANY RLS issues.
        const adminSupabase = factory.createAdminClient();

        logger.info({
            userId: user.id,
            supabaseUrl: factory.supabaseUrl,
            adminKeyPresent: !!factory.adminKey
        }, '🔍 Attempting to fetch profile with Admin Client');

        const { data: profile, error: profileError } = await adminSupabase
            .from('profiles')
            .select('id, role') // STRICT FIX: Only select existing columns
            .eq('id', user.id)
            .single();

        if (profileError) {
            logger.error({ error: profileError, userId: user.id }, '❌ Failed to fetch profile with Admin Client');
        } else {
            logger.info({ profileId: profile?.id, role: profile?.role }, '✅ Profile found');
        }

        if (profile) {
            req.user.profile = profile;
            req.user.role = (profile.role || 'MEMBER').toUpperCase();
        } else {
            // STRICT: No profile = No Access to resource-heavy actions
            logger.warn({ userId: user.id }, 'User has no profile. Denying high-privilege operations.');
            req.user.role = 'GUEST';
        }

        logger.debug({ userId: user.id, role: req.user.role }, 'Auth successful');

        next();
    } catch (err) {
        logger.error({ error: err.message }, 'Unexpected auth error');
        res.status(500).json({ error: 'Internal Authentication Error' });
    }
};

module.exports = createAuthMiddleware;
