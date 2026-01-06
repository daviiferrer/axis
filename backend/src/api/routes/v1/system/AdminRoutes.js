const express = require('express');
const adminAuth = require('../../../middlewares/adminAuth');

function createAdminRouter(adminController) {
    const router = express.Router();

    router.use(adminAuth);

    router.get('/stats', (req, res) => adminController.getStats(req, res));
    router.get('/users', (req, res) => adminController.listUsers(req, res));
    router.post('/sessions/stop-all', (req, res) => adminController.stopAllSessions(req, res));

    return router;
}

module.exports = createAdminRouter;
