const HandoffNode = require('../../../../../src/core/engines/workflow/nodes/HandoffNode');

describe('HandoffNode', () => {
    let nodeExecutor;
    let mockSupabase;
    let mockSocket;

    beforeEach(() => {
        mockSupabase = {
            from: jest.fn().mockReturnThis(),
            update: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({ data: [], error: null })
        };
        mockSocket = {
            emit: jest.fn()
        };

        nodeExecutor = new HandoffNode({
            supabase: mockSupabase,
            campaignSocket: mockSocket
        });
    });

    it('should update status and emit handoff event', async () => {
        const lead = { id: 1, name: 'Lead Test', phone: '55119999' };
        const campaign = { id: 'camp-1' };
        const nodeConfig = { data: { reason: 'Sentiment Low' } };

        await nodeExecutor.execute(lead, campaign, nodeConfig);

        // Verify DB Update
        expect(mockSupabase.from).toHaveBeenCalledWith('campaign_leads');
        expect(mockSupabase.update).toHaveBeenCalledWith(expect.objectContaining({
            status: 'manual_intervention'
        }));

        // Verify Socket Emission
        expect(mockSocket.emit).toHaveBeenCalledWith('lead.handoff', expect.objectContaining({
            leadId: 1,
            leadName: 'Lead Test',
            campaignId: 'camp-1',
            reason: 'Sentiment Low'
        }));
    });
});
