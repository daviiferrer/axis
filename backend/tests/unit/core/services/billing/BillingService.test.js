const BillingService = require('../../../../../src/core/services/billing/BillingService');

// Mock Logger
jest.mock('../../../../../src/shared/Logger', () => ({
    createModuleLogger: jest.fn().mockReturnValue({
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn()
    })
}));

// Mock dependencies
const mockSupabase = {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    upsert: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn()
};

describe('BillingService', () => {
    let billingService;

    beforeEach(() => {
        jest.clearAllMocks();
        billingService = new BillingService(mockSupabase);
    });

    describe('getPlanStatus', () => {
        it('should return plan status from company', async () => {
            mockSupabase.single
                .mockResolvedValueOnce({ data: { company_id: 'comp_123' }, error: null })
                .mockResolvedValueOnce({ data: { subscription_plan: 'premium', trial_ends_at: null }, error: null });

            const result = await billingService.getPlanStatus('user_123');

            expect(result.subscription_plan).toBe('premium');
        });
    });

    describe('upgradeToPremium', () => {
        it('should upgrade user to premium', async () => {
            mockSupabase.single.mockResolvedValueOnce({ data: { company_id: 'comp_123' }, error: null });
            mockSupabase.single.mockResolvedValueOnce({ data: { id: 'comp_123' }, error: null });

            await billingService.upgradeToPremium('user_123');

            expect(mockSupabase.update).toHaveBeenCalledWith({ subscription_plan: 'premium' });
        });
    });
});
