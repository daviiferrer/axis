const express = require('express');

function createWebhookRouter(webhookController) {
    const router = express.Router();

    const adminScopeMiddleware = require('../../../middlewares/adminScopeMiddleware');
    router.post('/waha', adminScopeMiddleware, (req, res) => webhookController.handleWahaWebhook(req, res));

    return router;
}

module.exports = createWebhookRouter;
