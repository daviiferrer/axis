const express = require('express');
const adminAuth = require('../../../middlewares/adminAuth');

function createAdminRouter(adminController) {
    const router = express.Router();

    // Inject Authorization Middleware explicitly if not already global
    // But typically we want to ensure req.user is populated.
    // Assuming authMiddleware is available to be passed or required.
    // For now, let's assume the router is mounted with auth, OR we require it here.
    const authMiddleware = require('../../../middlewares/authMiddleware')(require('../../../../infra/database/supabase'));

    router.use(authMiddleware);
    router.use(adminAuth);

    router.get('/stats', (req, res) => adminController.getStats(req, res));
    router.get('/users', (req, res) => adminController.listUsers(req, res));
    router.post('/sessions/stop-all', (req, res) => adminController.stopAllSessions(req, res));

    return router;
}

module.exports = createAdminRouter;
