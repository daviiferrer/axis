const BroadcastNode = require('../../../../../src/core/engines/workflow/nodes/BroadcastNode');

describe('BroadcastNode', () => {
    let nodeExecutor;
    let mockWahaClient;
    let mockSupabase;

    beforeEach(() => {
        mockWahaClient = {
            sendText: jest.fn().mockResolvedValue({ id: 'msg-123' })
        };
        mockSupabase = {
            from: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: { id: 1 } }), // chat id
            insert: jest.fn().mockReturnThis()
        };

        nodeExecutor = new BroadcastNode({
            wahaClient: mockWahaClient,
            supabase: mockSupabase
        });
    });

    it('should process spintax and replace variables', async () => {
        const lead = { id: 1, phone: '5511999999999', name: 'João' };
        const campaign = { session_name: 'test-session' };
        const nodeConfig = {
            id: 'node-1',
            data: {
                messageTemplate: "{Olá|Oi} {{name}}!",
                spintaxEnabled: true
            }
        };

        await nodeExecutor.execute(lead, campaign, nodeConfig);

        expect(mockWahaClient.sendText).toHaveBeenCalled();
        const sentMessage = mockWahaClient.sendText.mock.calls[0][2];
        console.log('DEBUG MSG:', sentMessage);

        // Check spintax resolution (either 'Olá' or 'Oi')
        expect(sentMessage).toMatch(/Olá|Oi/);
        // Check variable replacement
        expect(sentMessage).toContain('João');
    });

    it('should insert message log into supabase', async () => {
        const lead = { id: 1, phone: '5511999999999' };
        const campaign = { session_name: 'test' };
        const nodeConfig = { data: { messageTemplate: "Test" } };

        await nodeExecutor.execute(lead, campaign, nodeConfig);

        expect(mockSupabase.from).toHaveBeenCalledWith('messages');
        expect(mockSupabase.insert).toHaveBeenCalledWith(expect.objectContaining({
            message_id: 'msg-123',
            from_me: true
        }));
    });
});
