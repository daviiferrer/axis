/**
 * AdminAuth Middleware - Validates Admin Secrets
 */
const adminAuth = (req, res, next) => {
    const adminSecret = req.headers['x-admin-secret'];
    const expectedSecret = process.env.ADMIN_SECRET || 'fallback-secret-change-me';

    if (!adminSecret || adminSecret !== expectedSecret) {
        console.warn(`[Auth] ❌ Unauthorized admin access attempt from ${req.ip}`);
        return res.status(401).json({ error: 'Unauthorized: Invalid Admin Secret' });
    }

    next();
};

module.exports = adminAuth;
