const express = require('express');
const adminAuth = require('../../../middlewares/adminAuth');

function createAdminRouter(adminController, authMiddleware) {
    const router = express.Router();

    if (!authMiddleware) {
        throw new Error('AdminRoutes requires authMiddleware');
    }

    router.use(authMiddleware);
    router.use(adminAuth);

    router.get('/stats', (req, res) => adminController.getStats(req, res));
    router.get('/users', (req, res) => adminController.listUsers(req, res));
    router.put('/users/:id/role', (req, res) => adminController.updateUserRole(req, res));
    router.post('/sessions/stop-all', (req, res) => adminController.stopAllSessions(req, res));

    return router;
}

module.exports = createAdminRouter;
