const ClosingNode = require('../../../../../src/core/engines/workflow/nodes/ClosingNode');

describe('ClosingNode', () => {
    let nodeExecutor;
    let mockLeadService;

    beforeEach(() => {
        mockLeadService = {
            updateLead: jest.fn().mockResolvedValue({ id: 1, status: 'lost' })
        };

        nodeExecutor = new ClosingNode({ leadService: mockLeadService });
    });

    it('should update lead status and clear variable', async () => {
        const lead = { id: 1 };
        const nodeConfig = {
            data: {
                finalStatus: 'lost', // matched code property name
                clearVariables: true
            }
        };

        const result = await nodeExecutor.execute(lead, {}, nodeConfig);

        expect(mockLeadService.updateLead).toHaveBeenCalledWith(1, expect.objectContaining({
            status: 'lost',
            node_variables: {}
        }));

        // The code returns { status: 'success', markExecuted: true }
        expect(result).toEqual({ status: 'success', markExecuted: true });
    });
});
