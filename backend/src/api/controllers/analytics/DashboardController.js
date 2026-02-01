/**
 * DashboardController.js
 * Controller for the Executive Dashboard
 */
class DashboardController {
    constructor({ dashboardService }) {
        this.dashboardService = dashboardService;
    }

    async getOverview(req, res) {
        try {
            const companyId = req.user?.id;
            const data = await this.dashboardService.getOverview(companyId);
            return res.json(data);
        } catch (error) {
            console.error('[DashboardController] getOverview error:', error);
            return res.status(500).json({ error: 'Failed to fetch overview' });
        }
    }

    async getTemporalPatterns(req, res) {
        try {
            const companyId = req.user?.id;
            const days = parseInt(req.query.days || '7');
            const data = await this.dashboardService.getTemporalPatterns(companyId, days);
            return res.json(data);
        } catch (error) {
            console.error('[DashboardController] getTemporalPatterns error:', error);
            return res.status(500).json({ error: 'Failed to fetch temporal data' });
        }
    }

    async getRecentActivity(req, res) {
        try {
            const companyId = req.user?.id;
            const limit = parseInt(req.query.limit || '10');
            const data = await this.dashboardService.getRecentActivity(companyId, limit);
            return res.json(data);
        } catch (error) {
            console.error('[DashboardController] getRecentActivity error:', error);
            return res.status(500).json({ error: 'Failed to fetch activity' });
        }
    }

    async getCampaignMetrics(req, res) {
        try {
            const companyId = req.user?.id;
            const data = await this.dashboardService.getCampaignMetrics(companyId);
            return res.json(data);
        } catch (error) {
            console.error('[DashboardController] getCampaignMetrics error:', error);
            return res.status(500).json({ error: 'Failed to fetch campaign metrics' });
        }
    }

    async getLeadsBySource(req, res) {
        try {
            const companyId = req.user?.id;
            const data = await this.dashboardService.getLeadsBySource(companyId);
            return res.json(data);
        } catch (error) {
            console.error('[DashboardController] getLeadsBySource error:', error);
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
