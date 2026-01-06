const request = require('supertest');
const express = require('express');
const createRouter = require('../../../src/api/router');

describe('Chat API Integration', () => {
    let app;
    let mockWaha;
    let mockChatService;
    let mockGemini;
    let mockHistory;

    beforeAll(() => {
        app = express();
        app.use(express.json());

        mockWaha = {
            getSessions: jest.fn().mockResolvedValue([{ name: 'default' }]),
            sendText: jest.fn().mockResolvedValue({ id: 'msg1' })
        };
        mockChatService = {
            saveSentMessage: jest.fn().mockResolvedValue({})
        };
        mockGemini = {
            generateSimpleText: jest.fn().mockResolvedValue('Go for the close!')
        };
        mockHistory = {
            getFormattedHistoryForHint: jest.fn().mockResolvedValue('Chat History')
        };

        const controllers = {
            chatController: {
                getSessions: (req, res) => mockWaha.getSessions().then(d => res.json(d)),
                sendMessage: (req, res) => mockWaha.sendText().then(d => {
                    mockChatService.saveSentMessage().then(() => res.json(d));
                }),
                getOracleHint: (req, res) => mockGemini.generateSimpleText().then(d => res.json({ hint: d })),
                getPresence: (req, res) => res.json({ status: 'online' })
            },
            // Mock WAHA interactions for router initialization
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

    test('GET /api/v1/chats/sessions should return sessions', async () => {
        const res = await request(app).get('/api/v1/chats/sessions');
        expect(res.status).toBe(200);
        expect(res.body[0]).toHaveProperty('name', 'default');
    });

    test('POST /api/v1/chats/send should send message', async () => {
        const res = await request(app)
            .post('/api/v1/chats/send')
            .send({ session: 'default', chatId: '123', text: 'hello' });
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('id', 'msg1');
    });

    test('POST /api/v1/chats/oracle-hint should return hint', async () => {
        const res = await request(app)
            .post('/api/v1/chats/oracle-hint')
            .send({ chatId: '123' });
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('hint', 'Go for the close!');
    });
});
