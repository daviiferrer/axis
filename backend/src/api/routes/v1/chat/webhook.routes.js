const express = require('express');

function createWebhookRouter(webhookController) {
    const router = express.Router();

    router.post('/waha', (req, res) => webhookController.handleWahaWebhook(req, res));

    return router;
}

module.exports = createWebhookRouter;
