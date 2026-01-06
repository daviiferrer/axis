const request = require('supertest');
const express = require('express');
const createRouter = require('../../../src/api/router');

describe('Webhook API Integration', () => {
    let app;

    beforeAll(() => {
        app = express();
        app.use(express.json());

        const controllers = {
            webhookController: {
                handleIncoming: (req, res) => res.json({ received: true, body: req.body })
            },
            wahaSessionController: {},
            wahaAuthController: {},
            wahaProfileController: {},
            wahaChattingController: {},
            wahaPresenceController: {},
            wahaMediaController: {},
            wahaObservabilityController: {},
            wahaScreenshotController: {},
            authMiddleware: (req, res, next) => next(),
            riskMiddleware: (req, res, next) => next()
        };

        const router = createRouter(controllers);
        app.use('/api', router);
    });

    test('POST /api/v1/webhook should accept payload', async () => {
        const res = await request(app)
            .post('/api/v1/webhook')
            .send({ event: 'message.received', data: {} });

        expect(res.status).toBe(200);
        expect(res.body.received).toBe(true);
    });

    test('POST /api/v1/webhook should handle empty body', async () => {
        const res = await request(app)
            .post('/api/v1/webhook')
            .send({});

        expect(res.status).toBe(200);
    });
});
