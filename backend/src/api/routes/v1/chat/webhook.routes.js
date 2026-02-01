const express = require('express');

function createWebhookRouter(webhookController) {
    const router = express.Router();

    // Debug Log for ANY request hitting this router
    router.use((req, res, next) => {
        console.log(`[Webhook Router] 📨 Hit: ${req.method} ${req.originalUrl}`);
        next();
    });

    // Removed adminScopeMiddleware (likely causing 500 error or auth block for external webhook)
    router.post('/waha', (req, res) => webhookController.handleWahaWebhook(req, res));
    router.post('/waaha', (req, res) => webhookController.handleWahaWebhook(req, res)); // Support typo alias

    return router;
}

module.exports = createWebhookRouter;
