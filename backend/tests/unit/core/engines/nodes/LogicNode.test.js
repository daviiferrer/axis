const LogicNode = require('../../../../../src/core/engines/workflow/nodes/LogicNode');

describe('LogicNode', () => {
    let nodeExecutor;

    beforeEach(() => {
        nodeExecutor = new LogicNode({});
    });

    it('should route based on configuration', async () => {
        const lead = { id: 1, last_message_body: 'Test' };
        const nodeConfig = {
            data: {
                rules: [],
                useAiRouting: false
            }
        };

        const result = await nodeExecutor.execute(lead, {}, nodeConfig);
        expect(result.status).toBeDefined();
        expect(result.edge || result.action).toBeDefined();
    });
});
