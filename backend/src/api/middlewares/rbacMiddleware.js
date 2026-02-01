const { hasPermission } = require('../../core/config/rbacConfig');
const logger = require('../../shared/Logger').createModuleLogger('rbac');

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
            logger.warn('Auth context missing. RBAC requires auth middleware to run first.');
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // 1. Resolve Role directly from User (set by AuthMiddleware)
        // Default to 'VIEWER' if something goes wrong, but AuthMiddleware sets 'OWNER' by default.
        const role = (req.user.role || 'VIEWER').toUpperCase();

        // 2. Developer/Environment Bypass (Optional, keep strict for now)
        if (process.env.NODE_ENV === 'development' && process.env.RBAC_BYPASS === 'true') {
            logger.debug({ role, resource, action }, 'RBAC bypass (dev mode)');
            return next();
        }

        // 3. Check Permission
        const allowed = hasPermission(role, resource, action);

        if (!allowed) {
            logger.warn({ userId: req.user.id, role, resource, action }, 'Permission denied');
            return res.status(403).json({
                error: 'Permission Denied',
                message: `You do not have permission to perform ${action} on ${resource}.`
            });
        }

        next();
    } catch (err) {
        logger.error({ error: err.message }, 'RBAC middleware error');
        res.status(500).json({ error: 'Internal Authorization Error' });
    }
};

module.exports = rbacMiddleware;

