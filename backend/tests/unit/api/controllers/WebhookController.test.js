const WebhookController = require('../../../../src/api/controllers/chat/WebhookController');

describe('WebhookController', () => {
    let controller;
    let mockServices;

    beforeEach(() => {
        mockServices = {
            chatService: { processIncomingMessage: jest.fn() },
            workflowEngine: { triggerAiForLead: jest.fn().mockResolvedValue(), handlePresenceUpdate: jest.fn().mockResolvedValue() },
            socketService: { emit: jest.fn() },
            wahaClient: {},
            supabase: {
                from: jest.fn().mockReturnThis(),
                update: jest.fn().mockReturnThis(),
                like: jest.fn().mockResolvedValue({ error: null, count: 1 })
            }
        };
        controller = new WebhookController(
            mockServices.chatService,
            mockServices.workflowEngine,
            mockServices.socketService,
            mockServices.wahaClient,
            mockServices.supabase
        );
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
            expect(mockServices.supabase.update).toHaveBeenCalledWith({ status: 'read' });
            expect(mockServices.supabase.like).toHaveBeenCalledWith('message_id', '%_ABC123');

            // Verify Socket Emission
            expect(mockServices.socketService.emit).toHaveBeenCalledWith('message.ack', {
                session: 'test-session',
                messageId: 'true_123456789@c.us_ABC123',
                messageSuffix: 'ABC123',
                status: 'read',
                ack: 3
            });

            expect(res.status).toHaveBeenCalledWith(200);
        });
    });
});
