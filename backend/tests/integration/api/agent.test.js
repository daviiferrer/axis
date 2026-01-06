const request = require('supertest');
const express = require('express');
const createRouter = require('../../../src/api/router');

describe('Agent API Integration', () => {
    let app;

    beforeAll(() => {
        app = express();
        app.use(express.json());

        const controllers = {
            agentController: {
                listAgents: (req, res) => res.json([{ id: 'agent1', role: 'sales' }]),
                createAgent: (req, res) => res.status(201).json({ id: 'agent-new', ...req.body })
            },
            wahaSessionController: {},
            wahaAuthController: {},
            wahaProfileController: {},
            wahaChattingController: {},
            wahaPresenceController: {},
            wahaMediaController: {},
            wahaObservabilityController: {},
            wahaScreenshotController: {},
            authMiddleware: (req, res, next) => { req.user = { id: 'test-user' }; next(); },
            riskMiddleware: (req, res, next) => next()
        };

        const router = createRouter(controllers);
        app.use('/api', router);
    });

    test('GET /api/v1/agents should return list', async () => {
        const res = await request(app)
            .get('/api/v1/agents')
            .set('Authorization', 'Bearer test-token');
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });

    test('POST /api/v1/agents should create agent', async () => {
        const res = await request(app)
            .post('/api/v1/agents')
            .set('Authorization', 'Bearer test-token')
            .send({ role: 'support', name: 'Bot' });
        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('role', 'support');
    });
});
