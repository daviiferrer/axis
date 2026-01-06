const LeadService = require('../../../../src/core/services/campaign/LeadService');

describe('LeadService', () => {
    let leadService;
    let mockSupabase;

    beforeEach(() => {
        mockSupabase = {
            from: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            update: jest.fn().mockReturnThis(),
            single: jest.fn(),
            in: jest.fn().mockReturnThis(),
            or: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis()
        };
        leadService = new LeadService(mockSupabase);
    });

    test('getLead should return a lead with campaign and agent details', async () => {
        const mockLead = { id: 1, status: 'new', campaigns: { name: 'C1' } };
        mockSupabase.single.mockResolvedValue({ data: mockLead, error: null });

        const result = await leadService.getLead(1);

        expect(mockSupabase.from).toHaveBeenCalledWith('campaign_leads');
        expect(mockSupabase.select).toHaveBeenCalledWith('*, campaigns(*, agents(*))');
        expect(result).toEqual(mockLead);
    });

    test('updateLeadStatus should update status and timestamps', async () => {
        const mockLead = { id: 1, status: 'active' };
        mockSupabase.single.mockResolvedValue({ data: mockLead, error: null });

        const result = await leadService.updateLeadStatus(1, 'active');

        expect(mockSupabase.update).toHaveBeenCalledWith(expect.objectContaining({
            status: 'active',
            updated_at: expect.any(String)
        }));
        expect(result).toEqual(mockLead);
    });

    test('transitionToNode should update current_node_id and entered_at', async () => {
        const mockLead = { id: 1, current_node_id: 'node_1' };
        mockSupabase.single.mockResolvedValue({ data: mockLead, error: null });

        const result = await leadService.transitionToNode(1, 'node_1');

        expect(mockSupabase.update).toHaveBeenCalledWith(expect.objectContaining({
            current_node_id: 'node_1',
            node_state: expect.objectContaining({ entered_at: expect.any(String) })
        }));
        expect(result).toEqual(mockLead);
    });

    test('getLeadsForProcessing should filter by status and limit results', async () => {
        const mockLeads = [{ id: 1 }, { id: 2 }];
        // For getLeadsForProcessing, the last call is .limit() which returns the promise
        mockSupabase.limit.mockResolvedValue({ data: mockLeads, error: null });

        const result = await leadService.getLeadsForProcessing(101, 10);

        expect(mockSupabase.from).toHaveBeenCalledWith('campaign_leads');
        expect(mockSupabase.eq).toHaveBeenCalledWith('campaign_id', 101);
        expect(mockSupabase.in).toHaveBeenCalledWith('status', ['new', 'pending', 'contacted', 'prospecting', 'negotiating']);
        expect(mockSupabase.limit).toHaveBeenCalledWith(10);
        expect(result).toEqual(mockLeads);
    });
});
