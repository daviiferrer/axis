const request = require('supertest');
const express = require('express');
const HealthController = require('../../../src/api/controllers/system/HealthController');
const createHealthRouter = require('../../../src/api/routes/v1/system/health.routes');
const HealthService = require('../../../src/core/services/system/HealthService');

describe('Health API Integration', () => {
    let app;

    beforeAll(() => {
        app = express();
        app.use(express.json());

        const healthService = new HealthService();
        const healthController = new HealthController(healthService);
        const healthRouter = createHealthRouter(healthController);

        app.use('/api/v1/health', healthRouter);
    });

    test('GET /api/v1/health should return 200 and healthy status', async () => {
        const response = await request(app).get('/api/v1/health');

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('status', 'healthy');
        expect(response.body).toHaveProperty('uptime');
    });
});
