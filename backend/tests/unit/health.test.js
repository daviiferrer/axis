const HealthService = require('../../src/core/services/system/HealthService');

describe('HealthService', () => {
    let healthService;

    beforeEach(() => {
        healthService = new HealthService();
    });

    test('should return healthy status when initialized', async () => {
        const status = await healthService.getStatus();
        expect(status).toHaveProperty('status', 'healthy');
        expect(status).toHaveProperty('uptime');
    });

    test('should include memory usage in status', async () => {
        const status = await healthService.getStatus();
        expect(status).toHaveProperty('memory');
        expect(status.memory).toHaveProperty('heapUsed');
    });
});
