const express = require('express');
const adminAuth = require('../../../middlewares/adminAuth');

function createSettingsRouter(settingsController) {
    const router = express.Router();

    router.use(adminAuth);
    router.get('/', (req, res) => settingsController.getSettings(req, res));
    router.post('/', (req, res) => settingsController.saveSettings(req, res));

    return router;
}

module.exports = createSettingsRouter;
