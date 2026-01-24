const express = require('express');
const adminAuth = require('../../../middlewares/adminAuth');

function createSettingsRouter(settingsController, authMiddleware) {
    const router = express.Router();

    if (!authMiddleware) throw new Error('SettingsRoutes missing authMiddleware');

    router.use(authMiddleware);
    router.use(adminAuth);
    router.get('/', (req, res) => settingsController.getSettings(req, res));
    router.post('/', (req, res) => settingsController.saveSettings(req, res));

    return router;
}

module.exports = createSettingsRouter;
