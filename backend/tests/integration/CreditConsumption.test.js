const ChatService = require('../../src/core/services/chat/ChatService');
const BillingService = require('../../src/core/services/billing/BillingService');

// Mock dependencies
const mockSupabase = {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    upsert: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({ data: null, error: null })
    }),
    single: jest.fn().mockResolvedValue({ data: { id: 'chat_test' }, error: null })
};

const mockWahaClient = {
    sendText: jest.fn()
};

// Mock Logger
jest.mock('../../src/shared/Logger', () => ({
    createModuleLogger: jest.fn().mockReturnValue({
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn()
    })
}));

const mockSettingsService = {
    getSettings: jest.fn()
};

describe.skip('Integration: Credit Consumption in Chat', () => {
    let chatService;
    let billingService;

    beforeEach(() => {
        jest.clearAllMocks();

        // Instantiate real services with mocks
        billingService = new BillingService(mockSupabase);
        chatService = new ChatService(mockSupabase, billingService, mockWahaClient, mockSettingsService);
    });

    it('should deduct credits AND send message when balance is sufficient (Feature Flag ON)', async () => {
        const userId = 'user_rich';

        // 0. Mock Settings (Enable)
        mockSettingsService.getSettings.mockResolvedValue({ enable_credit_deduction: true });

        // ChatService needs chat lookup first (eq -> single)
        // We need eq to return an object with single() specifically for this call
        // Note: The global mock for eq (line 11) returns { single: ... }, but we want to be explicit or ensure ordering
        // The issue was mockResolvedValueOnce overwriting the FIRST call to return a promise instead of the builder.

        // Sequence of eq calls:
        // 1. getChat -> eq(...).single()
        // 2. getBalance -> eq(...) -> returns data directly (if awaited) or builder

        mockSupabase.eq
            .mockReturnValueOnce({
                single: jest.fn().mockResolvedValue({ data: { id: 'chat_test' }, error: null })
            })
            .mockResolvedValueOnce({ data: [{ amount: 100 }], error: null });

        // 2. Mock Ledger Insert (Deduct)
        mockSupabase.insert.mockResolvedValueOnce({ error: null });

        // 3. Mock WAHA Send
        mockWahaClient.sendText.mockResolvedValueOnce({ id: 'msg_123' });

        // 4. Mock Message Save
        mockSupabase.upsert.mockResolvedValueOnce({ error: null });

        await chatService.sendMessage('session1', '5511999999999', 'Hello', userId);

        // Verify Deduction (Handled by Spy, NOT DB)
        // verify mockSupabase.from('billing_ledger') - REMOVE
        // verify mockSupabase.insert - REMOVE

        // Deduction Spy Verification
        expect(deductSpy).toHaveBeenCalledWith(userId, 1, 'message_sent', expect.any(String));

        // Verify Send
        expect(mockWahaClient.sendText).toHaveBeenCalledWith('session1', '5511999999999', 'Hello');

        // Verify Save
        expect(mockSupabase.from).toHaveBeenCalledWith('messages');
    });

    it('should FAIL to send message calling Waha if credits are insufficient (Feature Flag ON)', async () => {
        const userId = 'user_poor';

        // Spy AND Reject
        const deductSpy = jest.spyOn(billingService, 'deductCredits').mockRejectedValue(new Error('Insufficient credits'));

        // 0. Mock Settings (Enable)
        mockSettingsService.getSettings.mockResolvedValue({ enable_credit_deduction: true });

        // ChatService needs chat lookup first (eq -> single). 
        // HOWEVER, deductCredits runs BEFORE chat lookup in ChatService.js
        // If deductCredits throws, chat lookup is NEVER reached.

        await expect(chatService.sendMessage('session1', '5511999999999', 'Hello', userId))
            .rejects.toThrow('Insufficient credits');

        // Verify Deduction Attempt
        expect(deductSpy).toHaveBeenCalled();

        // Verify NO WAHA Call
        expect(mockWahaClient.sendText).not.toHaveBeenCalled();
        // Verify NO DB Save
        expect(mockSupabase.from).not.toHaveBeenCalledWith('messages');
    });

    it('should SEND message WITHOUT deducting if Feature Flag is OFF', async () => {
        const userId = 'user_vip';
        const deductSpy = jest.spyOn(billingService, 'deductCredits');

        // 0. Mock Settings (Disable)
        mockSettingsService.getSettings.mockResolvedValue({ enable_credit_deduction: false });

        // ChatService needs chat lookup (eq -> single)
        // Use mockImplementation to be safe across multiple calls if needed, 
        // but returnValueOnce should work if called once. 
        // We'll return the builder structure explicitly.
        mockSupabase.eq.mockImplementationOnce(() => ({
            single: jest.fn().mockResolvedValue({ data: { id: 'chat_test' }, error: null })
        }));

        // 1. Mock WAHA Send
        mockWahaClient.sendText.mockResolvedValueOnce({ id: 'msg_vip' });

        // 2. Mock Message Save
        mockSupabase.upsert.mockResolvedValueOnce({ error: null });

        await chatService.sendMessage('session1', '5511999999999', 'Hello VIP', userId);

        // Verify NO Deduction
        expect(deductSpy).not.toHaveBeenCalled();

        // Verify Send Happened
        expect(mockWahaClient.sendText).toHaveBeenCalledWith('session1', '5511999999999', 'Hello VIP');
    });
});
