const request = require('supertest');
const express = require('express');
const createRouter = require('../../../src/api/router');

describe('Lead API Integration', () => {
    let app;
    let mockLeadService;
    let mockWorkflowEngine;

    beforeAll(() => {
        app = express();
        app.use(express.json());

        mockLeadService = {
            importLeads: jest.fn().mockResolvedValue({ count: 10 }),
            updateLead: jest.fn().mockResolvedValue({ id: 'lead1', status: 'stopped' }),
            getLead: jest.fn().mockResolvedValue({ id: 'lead1', phone: '123' })
        };

        mockWorkflowEngine = {
            processLead: jest.fn().mockResolvedValue({}),
            socketService: { emit: jest.fn() }
        };

        const controllers = {
            leadController: {
                importLeads: (req, res) => mockLeadService.importLeads().then(d => res.json({ success: true, imported: d.count })),
                stopLead: (req, res) => mockLeadService.updateLead().then(d => res.json({ success: true, lead: d })),
                triggerAi: async (req, res) => {
                    const lead = await mockLeadService.getLead();
                    await mockWorkflowEngine.processLead(lead);
                    res.json({ success: true, message: 'AI Triggered' });
                }
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

    test('POST /api/v1/leads/import should return count', async () => {
        const res = await request(app)
            .post('/api/v1/leads/import')
            .send({ campaignId: 'c1', leads: [] });
        expect(res.status).toBe(200);
        expect(res.body.imported).toBe(10);
    });

    test('PATCH /api/v1/leads/:id/stop should stop lead', async () => {
        const res = await request(app).patch('/api/v1/leads/lead1/stop');
        expect(res.status).toBe(200);
        expect(res.body.lead.status).toBe('stopped');
    });

    test('POST /api/v1/leads/:id/trigger should trigger AI', async () => {
        const res = await request(app).post('/api/v1/leads/lead1/trigger');
        expect(res.status).toBe(200);
        expect(res.body.message).toBe('AI Triggered');
    });
});
