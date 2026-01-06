const AgenticNode = require('../../../../../src/core/engines/workflow/nodes/AgenticNode');

describe('AgenticNode', () => {
    let nodeExecutor;
    let mockDeps;

    beforeEach(() => {
        const mockPgn = { data: { id: 1 }, error: null };
        const mockSupabaseChain = {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: { id: 1 } }),
            insert: jest.fn().mockReturnThis(),
            then: jest.fn(resolve => resolve({ data: { id: 1 }, error: null }))
        };

        mockDeps = {
            wahaClient: { sendTextWithLatency: jest.fn().mockResolvedValue({ id: 'msg-123' }) },
            supabase: {
                from: jest.fn(() => mockSupabaseChain)
            },
            chatService: {
                ensureChat: jest.fn().mockResolvedValue({ id: 'chat-1' })
            },
            historyService: { getChatHistory: jest.fn().mockResolvedValue([]) },
            promptService: { buildStitchedPrompt: jest.fn().mockResolvedValue('System Prompt') },
            emotionalStateService: {
                getPadVector: jest.fn().mockResolvedValue({ pleasure: 0.5, arousal: 0.5, dominance: 0.5 }),
                getEmotionalAdjustment: jest.fn().mockReturnValue(''),
                updatePadVector: jest.fn().mockResolvedValue()
            },
            guardrailService: { process: jest.fn((resp) => resp) },
            geminiClient: {
                generateSimple: jest.fn().mockResolvedValue({
                    text: () => JSON.stringify({
                        messages: ["Hello"],
                        sentiment_score: 0.8,
                        thought: "Thinking"
                    })
                })
            },
            leadService: {},
            campaignSocket: {}
        };

        nodeExecutor = new AgenticNode(mockDeps);
    });

    it('should build prompt with DNA and context', async () => {
        const lead = { id: 1, name: 'Lead', phone: '5511999999999' };
        const campaign = { id: 'c1', agents: { role: 'sales' }, session_name: 'sess', user_id: 'u1' };
        const nodeConfig = {
            id: 'test_node',
            data: {
                systemPrompt: 'Follow logic',
                scope_policy: 'READ_ONLY',
                model: 'gemini-pro' // AgenticNode requires this
            }
        };
        const graph = { edges: [] };

        await nodeExecutor.execute(lead, campaign, nodeConfig, graph);

        expect(mockDeps.promptService.buildStitchedPrompt).toHaveBeenCalled();
        const callArgs = mockDeps.promptService.buildStitchedPrompt.mock.calls[0][0];

        expect(callArgs.agent.role).toBe('sales');
        expect(callArgs.nodeDirective).toBe('Follow logic');
        expect(callArgs.scopePolicy).toBe('READ_ONLY');
    }, 10000);

    it('should process response through guardrails', async () => {
        const lead = { id: 1, phone: '5511999999999' };
        const campaign = { id: 'c1', session_name: 'sess', user_id: 'u1' };
        const nodeConfig = { id: 'test_node_2', data: { cta: 'Buy now', model: 'gemini-pro' } };

        await nodeExecutor.execute(lead, campaign, nodeConfig, {});

        expect(mockDeps.guardrailService.process).toHaveBeenCalledWith("Hello", expect.anything());
    }, 10000);
});
