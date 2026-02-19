/**
 * AnalyticsController.js
 */
const logger = require('../../../shared/Logger').createModuleLogger('analytics');

class AnalyticsController {
    constructor({ analyticsService }) {
        this.analyticsService = analyticsService;
    }

    async getDashboardStats(req, res) {
        try {
            // req.user / req.companyId should be populated by authMiddleware
            const companyId = req.user?.company_id;

            const stats = await this.analyticsService.getDashboardStats(companyId);
            const activity = await this.analyticsService.getRecentActivity(10);

            return res.json({
                stats,
                recent_activity: activity
            });
        } catch (error) {
            logger.error({ err: error }, 'Error fetching dashboard stats');
            return res.status(500).json({ error: 'Failed to fetch dashboard stats' });
        }
    }
}

module.exports = AnalyticsController;
