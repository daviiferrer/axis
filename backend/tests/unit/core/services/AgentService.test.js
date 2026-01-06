const AgentService = require('../../../../src/core/services/agents/AgentService');

describe('AgentService', () => {
    let agentService;
    let mockSupabase;

    beforeEach(() => {
        mockSupabase = {
            from: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            single: jest.fn()
        };
        agentService = new AgentService(mockSupabase);
    });

    test('listAgents should return all agents from DB', async () => {
        console.log('🧪 Running: listAgents success');
        const mockAgents = [
            { id: 1, name: 'Agent 1' },
            { id: 2, name: 'Agent 2' }
        ];

        mockSupabase.order.mockResolvedValue({ data: mockAgents, error: null });

        const result = await agentService.listAgents();

        expect(mockSupabase.from).toHaveBeenCalledWith('agents');
        expect(mockSupabase.order).toHaveBeenCalledWith('name', { ascending: true });
        expect(result).toEqual(mockAgents);
    });

    test('listAgents should handle errors', async () => {
        console.log('🧪 Running: listAgents error');
        const dbError = { message: 'DB Error' };
        mockSupabase.order.mockResolvedValue({ data: null, error: dbError });

        await expect(agentService.listAgents()).rejects.toEqual(dbError);
    });

    test('getAgent should return a single agent by ID', async () => {
        console.log('🧪 Running: getAgent success');
        const mockAgent = { id: 1, name: 'Agent 1' };

        mockSupabase.single.mockResolvedValue({ data: mockAgent, error: null });

        const result = await agentService.getAgent(1);

        expect(mockSupabase.eq).toHaveBeenCalledWith('id', 1);
        expect(result).toEqual(mockAgent);
    });
});
