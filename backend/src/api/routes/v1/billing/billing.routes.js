const express = require('express');

function createBillingRouter(billingController, authMiddleware) {
    const router = express.Router();

    // Create checkout session (protected by auth usually)
    router.post('/checkout/create-session', authMiddleware, (req, res) => billingController.createSession(req, res));

    // Stripe Webhook (unprotected, verified by signature)
    router.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => billingController.handleWebhook(req, res));

    return router;
}

module.exports = createBillingRouter;
