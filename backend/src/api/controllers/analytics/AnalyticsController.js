class AnalyticsController {
    constructor(analyticsService) {
        this.analyticsService = analyticsService;
    }

    async getDashboardStats(req, res) {
        try {
            const stats = await this.analyticsService.getDashboardStats();
            return res.json({
                success: true,
                data: stats
            });
        } catch (error) {
            console.error('AnalyticsController Error:', error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }
}

module.exports = AnalyticsController;
