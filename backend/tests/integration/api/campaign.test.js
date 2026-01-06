const request = require('supertest');
const express = require('express');
const createRouter = require('../../../src/api/router');

describe('Campaign API Integration', () => {
    let app;
    let mockCampaignService;

    beforeAll(() => {
        app = express();
        app.use(express.json());

        mockCampaignService = {
            listCampaigns: jest.fn().mockResolvedValue([{ id: 'camp1', status: 'paused' }]),
            updateCampaignStatus: jest.fn().mockImplementation((id, status) => Promise.resolve({ id, status })),
            updateStrategy: jest.fn().mockResolvedValue({ id: 'camp1', strategy: {} })
        };

        const controllers = {
            campaignController: {
                listCampaigns: (req, res) => mockCampaignService.listCampaigns().then(d => res.json(d)),
                startCampaign: (req, res) => mockCampaignService.updateCampaignStatus(req.params.id, 'active').then(d => res.json({ success: true, campaign: d })),
                pauseCampaign: (req, res) => mockCampaignService.updateCampaignStatus(req.params.id, 'paused').then(d => res.json({ success: true, campaign: d })),
                saveStrategy: (req, res) => mockCampaignService.updateStrategy(req.params.id, req.body).then(d => res.json({ success: true, campaign: d })),
                updateMode: (req, res) => res.json({ success: true })
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

    test('GET /api/v1/campaigns should return list', async () => {
        const res = await request(app)
            .get('/api/v1/campaigns')
            .set('Authorization', 'Bearer test-token');
        expect(res.status).toBe(200);
        expect(res.body[0]).toHaveProperty('id', 'camp1');
    });

    test('POST /api/v1/campaigns/:id/start should update status', async () => {
        const res = await request(app)
            .post('/api/v1/campaigns/camp1/start')
            .set('Authorization', 'Bearer test-token');
        expect(res.status).toBe(200);
        expect(res.body.campaign).toHaveProperty('status', 'active');
    });

    test('POST /api/v1/campaigns/:id/strategy should save strategy', async () => {
        const res = await request(app)
            .post('/api/v1/campaigns/camp1/strategy')
            .set('Authorization', 'Bearer test-token')
            .send({ nodes: [], edges: [] });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });
});
