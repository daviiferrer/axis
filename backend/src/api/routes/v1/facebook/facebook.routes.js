const express = require('express');
const router = express.Router();
const authMiddleware = require('../../../middlewares/authMiddleware');

module.exports = (facebookAdsController) => {
    // Public Webhook Routes (Must be validated by FB)
    router.get('/webhook', (req, res) => facebookAdsController.verifyWebhook(req, res));
    router.post('/webhook', (req, res) => facebookAdsController.handleWebhook(req, res));

    // Protected Routes
    router.get('/login', authMiddleware, (req, res) => facebookAdsController.getLoginUrl(req, res));
    router.post('/callback', authMiddleware, (req, res) => facebookAdsController.handleCallback(req, res));
    router.get('/pages', authMiddleware, (req, res) => facebookAdsController.getPages(req, res));
    router.post('/pages/:id/subscribe', authMiddleware, (req, res) => facebookAdsController.subscribePage(req, res));

    return router;
};
