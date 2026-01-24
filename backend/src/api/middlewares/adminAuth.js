/**
 * AdminAuth Middleware - Validates Admin Privileges based on User Role
 * NOTE: This requires 'authMiddleware' to be executed BEFORE this middleware.
 */
const adminAuth = (req, res, next) => {
    // 1. Ensure user is authenticated
    if (!req.user || !req.user.profile) {
        console.warn(`[Auth] ❌ Admin access denied: User not authenticated or profile missing`);
        return res.status(401).json({ error: 'Unauthorized: Authentication required' });
    }

    const { role } = req.user.profile;

    // 2. Check for Super Admin ONLY
    const isSystemAdmin = role === 'admin';

    if (!isSystemAdmin) {
        console.warn(`[Auth] ❌ System Admin access denied for user ${req.user.id} (Role: ${role})`);
        return res.status(403).json({ error: 'Forbidden: Requires System Administrator Privileges' });
    }

    next();
};

module.exports = adminAuth;
