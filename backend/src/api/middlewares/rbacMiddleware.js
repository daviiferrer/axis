const { hasPermission } = require('../../core/config/rbacConfig');

/**
 * RBAC Middleware
 * Checks if the authenticated user has permission for a specific resource and action.
 * 
 * Usage: router.post('/campaigns', auth, rbac(Resources.CAMPAIGN, Actions.CREATE), controller)
 * 
 * @param {string} resource - The resource being accessed (from rbacConfig)
 * @param {string} action - The action being performed (from rbacConfig)
 */
const rbac = (resource, action) => (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Auth context missing. RBAC requires auth middleware.' });
        }

        // 1. Resolve Role
        const rawRole = req.user.profile?.role || req.user.app_metadata?.role || req.user.user_metadata?.role || 'VIEWER';
        const role = rawRole.toUpperCase();

        // FORÇA BRUTA: Bypass total em DEV
        if (process.env.NODE_ENV === 'development') {
            console.log(`🔓 [RBAC] BYPASS ATIVO: Permitindo ${role} acessar ${resource}:${action}`);
            return next();
        }

        console.log(`🔐 [RBAC] Checking: ${role} on ${resource}:${action}`);
        const allowed = hasPermission(role, resource, action);

        if (!allowed) {
            console.warn(`🚫 [RBAC] NEGADO: ${role} em ${resource}:${action}`);
            return res.status(403).json({
                error: 'Permission Denied',
                message: `Cuidado: Seu cargo (${role}) não tem permissão para ${action} em ${resource}`
            });
        }

        next();
    } catch (err) {
        console.error('[RBAC] Middleware error:', err);
        res.status(500).json({ error: 'Internal Authorization Error' });
    }
};

module.exports = rbac;
