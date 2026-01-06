const CampaignTemplateService = require('../../../../src/core/services/campaign/CampaignTemplateService');

describe('CampaignTemplateService (Factory)', () => {
    let templateService;
    let mockSupabase;

    beforeEach(() => {
        mockSupabase = {
            from: jest.fn().mockReturnThis(),
            insert: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: { id: 200 }, error: null })
        };

        templateService = new CampaignTemplateService(mockSupabase);
    });

    test('should initialize with GOLDEN_TRIAD_TEMPLATE', () => {
        expect(templateService).toBeDefined();
        expect(templateService.GOLDEN_TRIAD_TEMPLATE).toBeDefined();
        expect(templateService.GOLDEN_TRIAD_TEMPLATE.nodes).toBeInstanceOf(Array);
        expect(templateService.GOLDEN_TRIAD_TEMPLATE.nodes.length).toBeGreaterThan(0);
    });

    test('should have supabase client injected', () => {
        expect(templateService.supabase).toBe(mockSupabase);
    });
});
