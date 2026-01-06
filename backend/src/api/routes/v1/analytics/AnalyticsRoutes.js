const express = require('express');

function createAnalyticsRouter(analyticsController) {
    const router = express.Router();

    router.get('/dashboard', (req, res) => analyticsController.getDashboardStats(req, res));

    return router;
}

module.exports = createAnalyticsRouter;
