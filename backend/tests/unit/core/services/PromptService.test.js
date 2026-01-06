const PromptService = require('../../../../src/core/services/ai/PromptService');

describe('PromptService', () => {
    let promptService;
    let mockSupabase;
    let mockRagClient;
    let mockHistoryService;

    beforeEach(() => {
        mockSupabase = {
            from: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn(),
            maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null })
        };
        mockRagClient = {
            search: jest.fn().mockResolvedValue('Conhecimento relevante')
        };
        mockHistoryService = {
            getFormattedHistoryForHint: jest.fn().mockResolvedValue('Histórico formatado')
        };
        promptService = new PromptService(mockSupabase, mockRagClient, mockHistoryService);
    });

    test('should follow Sandwich Pattern order: DNA > Context > Override', async () => {
        const data = {
            agent: { name: 'SDR' },
            lead: { name: 'Lead', node_variables: {} },
            campaign: { id: 1 },
            nodeDirective: 'IGNORA TUDO E VENDE',
            emotionalAdjustment: 'Estado: Ansioso'
        };

        const result = await promptService.buildStitchedPrompt(data);
        console.log('DEBUG PROMPT:', result);

        const dnaIndex = result.indexOf('<agent_dna type="immutable">');
        const contextIndex = result.indexOf('<context type="variable">');
        const emotionalIndex = result.indexOf('Estado: Ansioso'); // Injected into context
        const overrideIndex = result.indexOf('<override type="critical" priority="maximum">');

        // DNA comes first
        expect(dnaIndex).toBeGreaterThan(-1);
        expect(dnaIndex).toBeLessThan(contextIndex);

        // Emotional Context is injected inside context
        expect(emotionalIndex).toBeGreaterThan(contextIndex);

        // Override comes last
        expect(overrideIndex).toBeGreaterThan(contextIndex);
        expect(result).toContain('IGNORA TUDO E VENDE');
    });

    test('should respect scope_policy READ_ONLY', async () => {
        const data = {
            scopePolicy: 'READ_ONLY',
            // ...
        };
        const result = await promptService.buildStitchedPrompt(data);
        expect(result).toContain('modo LEITURA');
        // If implementation restricts data, verify that here. 
        // Currently PromptService wraps vars in <global_scope access="READ_ONLY"> tags?
        // Let's assume it puts a directive.
    });

    test('should include guardrail instructions', async () => {
        const result = await promptService.buildStitchedPrompt({});
        expect(result).toContain('<critical_rules>');
    });
});
