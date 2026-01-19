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
            console.log('🔴 [Auth] Missing Authorization Header');
            return res.status(401).json({ error: 'Missing Authorization Header' });
        }

        const token = authHeader.replace('Bearer ', '');
        console.log('🔵 [Auth] Token received (first 20 chars):', token.slice(0, 20) + '...');

        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            console.error('🔴 [Auth] Token validation FAILED:', error?.message || 'User not found');
            console.error('🔴 [Auth] Error details:', JSON.stringify(error, null, 2));
            return res.status(401).json({ error: 'Invalid or Expired Token', details: error?.message });
        }

        console.log('✅ [Auth] Token valid for user:', user.email);

        // Attach user to request
        req.user = user;

        // Fetch user profile
        let { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role, company_id, is_super_admin')
            .eq('id', user.id)
            .single();

        // FORÇA BRUTA: Em desenvolvimento, todo mundo é OWNER e tem acesso à empresa 1 por padrão se não tiver uma
        if (process.env.NODE_ENV === 'development') {
            profile = profile || {};
            profile.role = 'OWNER';
            // Se não tiver empresa, tenta pegar a primeira existente para não quebrar queries de tenant
            if (!profile.company_id) {
                const { data: firstCompany } = await supabase.from('companies').select('id').limit(1).single();
                profile.company_id = firstCompany?.id || null;
            }
        }

        // 3. Attach profile context
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
