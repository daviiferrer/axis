const WebhookController = require('../../../../src/api/controllers/chat/WebhookController');

describe('WebhookController', () => {
    let controller;
    let mockServices;
    let mockUpdate;
    let mockLike;

    beforeEach(() => {
        mockLike = jest.fn().mockResolvedValue({ error: null, count: 1 });
        mockUpdate = jest.fn().mockReturnValue({ like: mockLike });

        mockServices = {
            chatService: { processIncomingMessage: jest.fn().mockResolvedValue({ chatId: 'chat-123' }) },
            workflowEngine: { triggerAiForLead: jest.fn().mockResolvedValue(), handlePresenceUpdate: jest.fn().mockResolvedValue() },
            socketService: { emit: jest.fn() },
            wahaClient: {},
            jidService: { normalizePayload: jest.fn((p) => p) },
            supabase: {
                from: jest.fn().mockReturnValue({
                    update: mockUpdate
                })
            }
        };

        // Use object destructuring pattern to match actual constructor
        controller = new WebhookController({
            chatService: mockServices.chatService,
            workflowEngine: mockServices.workflowEngine,
            socketService: mockServices.socketService,
            wahaClient: mockServices.wahaClient,
            supabase: mockServices.supabase,
            jidService: mockServices.jidService
        });
    });

    describe('handleWahaWebhook', () => {
        it('should handle message.ack event and update status to read', async () => {
            const req = {
                body: {
                    event: 'message.ack',
                    session: 'test-session',
                    payload: {
                        id: 'true_123456789@c.us_ABC123',
                        ack: 3 // READ
                    }
                }
            };
            const res = { status: jest.fn().mockReturnThis(), send: jest.fn() };

            await controller.handleWahaWebhook(req, res);

            // Verify Database Update
            expect(mockServices.supabase.from).toHaveBeenCalledWith('messages');
            expect(mockUpdate).toHaveBeenCalledWith({ status: 'read' });

            // Verify Socket Emission
            expect(mockServices.socketService.emit).toHaveBeenCalledWith('message.ack', expect.objectContaining({
                session: 'test-session',
                status: 'read',
                ack: 3
            }));

            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('should handle presence.update event', async () => {
            const req = {
                body: {
                    event: 'presence.update',
                    session: 'test-session',
                    payload: {
                        id: '5511999999999@c.us',
                        presences: [{ status: 'composing' }]
                    }
                }
            };
            const res = { status: jest.fn().mockReturnThis(), send: jest.fn() };

            await controller.handleWahaWebhook(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('should handle unknown events gracefully', async () => {
            const req = {
                body: {
                    event: 'unknown.event',
                    session: 'test-session',
                    payload: {}
                }
            };
            const res = { status: jest.fn().mockReturnThis(), send: jest.fn() };

            await controller.handleWahaWebhook(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
        });
    });
});

