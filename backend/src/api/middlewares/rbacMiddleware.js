const { hasPermission } = require('../../core/config/rbacConfig');

/**
 * RBAC Middleware (Refactored for Clean Slate)
 * 
 * Checks if the authenticated user (with active membership context) 
 * has permission for a specific resource and action.
 * 
 * Usage: router.post('/campaigns', auth, rbac(Resources.CAMPAIGN, Actions.CREATE), controller)
 * 
 * @param {string} resource - The resource being accessed (from rbacConfig)
 * @param {string} action - The action being performed (from rbacConfig)
 */
const rbacMiddleware = (resource, action) => (req, res, next) => {
    try {
        if (!req.user) {
            console.warn('⛔ [RBAC] Auth context missing. RBAC requires auth middleware to run first.');
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // 1. Resolve Role from Active Membership Context
        // If no membership (e.g. system user or error), deny.
        const membership = req.user.membership;

        if (!membership) {
            // Edge case: Maybe it's a SuperAdmin without membership? 
            // For now, we enforce Company Context for all RBAC routes.
            console.warn(`⛔ [RBAC] No active membership context for user ${req.user.email}`);
            return res.status(403).json({ error: 'Forbidden: No Active Company Context' });
        }

        // Normalize Role
        const role = (membership.role || 'VIEWER').toUpperCase();

        // 2. Developer/Environment Bypass (Optional, keep strict for now)
        if (process.env.NODE_ENV === 'development' && process.env.RBAC_BYPASS === 'true') {
            console.log(`🔓 [RBAC] BYPASS: Allowing ${role} on ${resource}:${action}`);
            return next();
        }

        // 3. Check Permission
        const allowed = hasPermission(role, resource, action);

        if (!allowed) {
            console.warn(`⛔ [RBAC] DENIED: User ${req.user.email} as ${role} tried ${action} on ${resource}`);
            return res.status(403).json({
                error: 'Permission Denied',
                message: `You do not have permission to perform ${action} on ${resource}.`
            });
        }

        next();
    } catch (err) {
        console.error('[RBAC] Middleware error:', err);
        res.status(500).json({ error: 'Internal Authorization Error' });
    }
};

module.exports = rbacMiddleware;
