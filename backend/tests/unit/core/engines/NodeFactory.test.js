const NodeFactory = require('../../../../src/core/engines/workflow/NodeFactory');

describe('NodeFactory', () => {
    let factory;

    beforeEach(() => {
        factory = new NodeFactory({});
    });

    test('should return null for unknown node types', () => {
        const factory = new NodeFactory({});
        expect(factory.getExecutor('unknown')).toBeNull();
    });

    test('should return default executors (agent, delay, action)', () => {
        const factory = new NodeFactory({});

        expect(factory.getExecutor('agent')).toBeDefined();
        expect(factory.getExecutor('delay')).toBeDefined();
        expect(factory.getExecutor('action')).toBeDefined();
    });

    test('should handle leadEntry as null', () => {
        const factory = new NodeFactory({});
        expect(factory.getExecutor('leadEntry')).toBeNull();
    });
});
