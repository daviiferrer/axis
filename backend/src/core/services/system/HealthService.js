class HealthService {
    constructor() {
        this.startTime = Date.now();
    }

    async getStatus() {
        const uptime = (Date.now() - this.startTime) / 1000;
        const memory = process.memoryUsage();

        return {
            status: 'healthy',
            uptime: `${uptime.toFixed(2)}s`,
            memory: {
                heapUsed: `${(memory.heapUsed / 1024 / 1024).toFixed(2)} MB`,
                heapTotal: `${(memory.heapTotal / 1024 / 1024).toFixed(2)} MB`,
                rss: `${(memory.rss / 1024 / 1024).toFixed(2)} MB`
            },
            timestamp: new Date().toISOString()
        };
    }
}

module.exports = HealthService;
