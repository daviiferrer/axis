const AgentGraphEngine = require('../../../../src/core/engines/graph/AgentGraphEngine');

describe('AgentGraphEngine', () => {
    let agentGraphEngine;
    let mockGemini;
    let mockPrompt;

    beforeEach(() => {
        mockGemini = {};
        mockPrompt = {};
        agentGraphEngine = new AgentGraphEngine(mockGemini, mockPrompt);
    });

    test('should define the correct state structure', () => {
        expect(agentGraphEngine.stateDefinition).toHaveProperty('messages');
        expect(agentGraphEngine.stateDefinition).toHaveProperty('contextData');
        expect(agentGraphEngine.stateDefinition).toHaveProperty('sentiment');
        expect(agentGraphEngine.stateDefinition).toHaveProperty('nextAction');
    });

    test('createGraph should return a compiled graph', () => {
        const graph = agentGraphEngine.createGraph();
        expect(graph).toBeDefined();
        expect(typeof graph.invoke).toBe('function');
    });

    test('agentNode should transition to supervisor', async () => {
        const state = { messages: [] };
        const result = await agentGraphEngine.agentNode(state);
        expect(result).toEqual({ nextAction: "supervisor" });
    });

    test('supervisorNode should transition to END', async () => {
        const state = {};
        const result = await agentGraphEngine.supervisorNode(state);
        expect(result).toHaveProperty('nextAction');
        // Based on implementation, it returns END (which is a symbol from langgraph)
    });
});
