class HealthController {
    constructor(healthService) {
        this.healthService = healthService;
    }

    async getHealth(req, res) {
        try {
            const health = await this.healthService.getStatus();
            res.json(health);
        } catch (error) {
            res.status(500).json({ status: 'unhealthy', error: error.message });
        }
    }
}

module.exports = HealthController;
