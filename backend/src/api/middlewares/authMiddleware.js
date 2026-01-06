/**
 * Authentication Middleware
 * Verifies Supabase JWT token and populates req.user
 * 
 * @param {Object} supabase - Supabase Client
 */
const createAuthMiddleware = (supabase) => async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({ error: 'Missing Authorization Header' });
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            console.debug(`[Auth] Invalid token: ${error?.message}`);
            return res.status(401).json({ error: 'Invalid or Expired Token' });
        }

        // Attach user to request
        req.user = user;

        // Fetch user profile
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role, company_id')
            .eq('id', user.id)
            .single();

        // 3. Attach profile context (Fallbacks for legacy/system users)
        req.user.profile = profile || {
            role: user.app_metadata?.role || 'VIEWER',
            company_id: user.app_metadata?.company_id || null
        };

        next();
    } catch (err) {
        console.error('[Auth] Unexpected error:', err);
        res.status(500).json({ error: 'Internal Authentication Error' });
    }
};

module.exports = createAuthMiddleware;
