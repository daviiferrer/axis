/**
 * Admin Scope Middleware
 * Registers the 'supabaseAdmin' client as the 'supabaseClient' in the current scope.
 * Use this for routes that operate with System Privileges (Webhooks, Cron).
 */
const adminScopeMiddleware = (req, res, next) => {
    try {
        const { asValue } = require('awilix');
        const adminClient = req.container.resolve('supabaseAdmin');

        // Override 'supabaseClient' with the Admin Client for this request scope
        req.container.register({
            supabaseClient: asValue(adminClient)
        });

        console.log('🛡️ [Middleware] Admin Scope Activated for:', req.originalUrl);
        next();
    } catch (err) {
        console.error('Failed to activate Admin Scope:', err);
        res.status(500).json({ error: 'System Context Error' });
    }
};

module.exports = adminScopeMiddleware;
