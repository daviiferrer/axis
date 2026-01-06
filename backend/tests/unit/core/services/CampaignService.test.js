const CampaignService = require('../../../../src/core/services/campaign/CampaignService');

describe('CampaignService', () => {
    let campaignService;
    let mockSupabase;

    beforeEach(() => {
        mockSupabase = {
            from: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            insert: jest.fn().mockReturnThis(),
            update: jest.fn().mockReturnThis(),
            delete: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            mockResolvedValue: jest.fn() // Helper but not really how it works
        };
        // Re-defining properly for chains
        mockSupabase.from = jest.fn().mockReturnThis();
        mockSupabase.select = jest.fn().mockReturnThis();
        mockSupabase.eq = jest.fn().mockReturnThis();
        mockSupabase.order = jest.fn().mockReturnThis();
        mockSupabase.insert = jest.fn().mockReturnThis();
        mockSupabase.update = jest.fn().mockReturnThis();
        mockSupabase.delete = jest.fn().mockReturnThis();

        campaignService = new CampaignService(mockSupabase);
    });

    test('getCampaign should return a single campaign with agents', async () => {
        const mockCampaign = { id: 1, name: 'C1', agents: [] };
        mockSupabase.single = jest.fn().mockResolvedValue({ data: mockCampaign, error: null });

        const result = await campaignService.getCampaign(1);

        expect(mockSupabase.from).toHaveBeenCalledWith('campaigns');
        expect(mockSupabase.select).toHaveBeenCalledWith('*, agents(*)');
        expect(mockSupabase.eq).toHaveBeenCalledWith('id', 1);
        expect(result).toEqual(mockCampaign);
    });

    test('updateCampaignStatus should update status and return campaign', async () => {
        const campaignId = 1;
        const newStatus = 'active';
        const mockCampaign = { id: campaignId, status: newStatus };

        mockSupabase.single = jest.fn().mockResolvedValue({ data: mockCampaign, error: null });

        const result = await campaignService.updateCampaignStatus(campaignId, newStatus);

        expect(mockSupabase.update).toHaveBeenCalledWith(expect.objectContaining({ status: newStatus }));
        expect(mockSupabase.eq).toHaveBeenCalledWith('id', campaignId);
        expect(result).toEqual(mockCampaign);
    });

    test('getCampaignStats should calculate stats from leads', async () => {
        const campaignId = 1;
        const mockLeads = [
            { status: 'active' },
            { status: 'responded' },
            { status: 'converted' }
        ];

        mockSupabase.order = null; // reset if needed
        mockSupabase.select = jest.fn().mockReturnThis();
        mockSupabase.eq = jest.fn().mockResolvedValue({ data: mockLeads, error: null });

        const result = await campaignService.getCampaignStats(campaignId);

        expect(mockSupabase.from).toHaveBeenCalledWith('campaign_leads');
        expect(result).toEqual({
            total: 3,
            active: 1,
            responded: 1,
            converted: 1
        });
    });
});
