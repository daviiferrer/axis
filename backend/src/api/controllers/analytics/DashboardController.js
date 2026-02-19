/**
 * DashboardController.js
 * Controller for the Executive Dashboard
 */
const logger = require('../../../shared/Logger').createModuleLogger('dashboard');

class DashboardController {
    constructor({ dashboardService }) {
        this.dashboardService = dashboardService;
    }

    async getOverview(req, res) {
        try {
            const userId = req.user?.id;
            const data = await this.dashboardService.getOverview(userId);
            return res.json(data);
        } catch (error) {
            logger.error({ err: error }, 'getOverview error');
            return res.status(500).json({ error: 'Failed to fetch overview' });
        }
    }

    async getTemporalPatterns(req, res) {
        try {
            const userId = req.user?.id;
            const days = parseInt(req.query.days || '7');
            const data = await this.dashboardService.getTemporalPatterns(userId, days);
            return res.json(data);
        } catch (error) {
            logger.error({ err: error }, 'getTemporalPatterns error');
            return res.status(500).json({ error: 'Failed to fetch temporal data' });
        }
    }

    async getRecentActivity(req, res) {
        try {
            const userId = req.user?.id;
            const limit = parseInt(req.query.limit || '10');
            const data = await this.dashboardService.getRecentActivity(userId, limit);
            return res.json(data);
        } catch (error) {
            logger.error({ err: error }, 'getRecentActivity error');
            return res.status(500).json({ error: 'Failed to fetch activity' });
        }
    }

    async getCampaignMetrics(req, res) {
        try {
            const userId = req.user?.id;
            const data = await this.dashboardService.getCampaignMetrics(userId);
            return res.json(data);
        } catch (error) {
            logger.error({ err: error }, 'getCampaignMetrics error');
            return res.status(500).json({ error: 'Failed to fetch campaign metrics' });
        }
    }

    async getLeadsBySource(req, res) {
        try {
            const userId = req.user?.id;
            const data = await this.dashboardService.getLeadsBySource(userId);
            return res.json(data);
        } catch (error) {
            logger.error({ err: error }, 'getLeadsBySource error');
            return res.status(500).json({ error: 'Failed to fetch leads source' });
        }
    }

    async getHealth(req, res) {
        try {
            const status = await this.dashboardService.getSystemHealth();
            return res.json(status);
        } catch (error) {
            return res.status(500).json({ error: 'Health check failed' });
        }
    }
}

module.exports = DashboardController;
