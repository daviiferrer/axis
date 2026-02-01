/**
 * Dashboard Routes
 * API routes for the executive dashboard
 */
const express = require('express');

module.exports = function (dashboardController, authMiddleware) {
    const router = express.Router();

    // All dashboard routes require authentication
    router.use(authMiddleware);

    // GET /api/v1/dashboard/overview - Complete dashboard (TIER 1)
    router.get('/overview', (req, res) => dashboardController.getOverview(req, res));

    // GET /api/v1/dashboard/health - System health status
    router.get('/health', (req, res) => dashboardController.getHealth(req, res));

    // GET /api/v1/dashboard/costs - AI costs
    router.get('/costs', (req, res) => dashboardController.getCosts(req, res));

    // GET /api/v1/dashboard/leads - Lead metrics
    router.get('/leads', (req, res) => dashboardController.getLeadMetrics(req, res));

    // GET /api/v1/dashboard/temporal - Temporal patterns
    router.get('/temporal', (req, res) => dashboardController.getTemporalPatterns(req, res));

    // GET /api/v1/dashboard/ai-metrics - AI token usage
    router.get('/ai-metrics', (req, res) => dashboardController.getAiMetrics(req, res));

    // GET /api/v1/dashboard/activity - Recent activity feed
    router.get('/activity', (req, res) => dashboardController.getRecentActivity(req, res));

    // GET /api/v1/dashboard/security - Security events summary
    router.get('/security', (req, res) => dashboardController.getSecuritySummary(req, res));

    // GET /api/v1/dashboard/campaigns - Campaign metrics
    router.get('/campaigns', (req, res) => dashboardController.getCampaignMetrics(req, res));

    // GET /api/v1/dashboard/leads-by-source - Leads split by source
    router.get('/leads-by-source', (req, res) => dashboardController.getLeadsBySource(req, res));

    return router;
};
