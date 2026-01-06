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

describe('Integration: Credit Consumption in Chat', () => {
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

        // ChatService needs chat lookup first
        mockSupabase.single.mockResolvedValueOnce({ data: { id: 'chat_test' }, error: null });

        // 1. Mock Balance Check (Sufficient) - BillingService.getBalance()
        mockSupabase.eq.mockResolvedValueOnce({ data: [{ amount: 100 }], error: null });

        // 2. Mock Ledger Insert (Deduct)
        mockSupabase.insert.mockResolvedValueOnce({ error: null });

        // 3. Mock WAHA Send
        mockWahaClient.sendText.mockResolvedValueOnce({ id: 'msg_123' });

        // 4. Mock Message Save
        mockSupabase.upsert.mockResolvedValueOnce({ error: null });

        await chatService.sendMessage('session1', '5511999999999', 'Hello', userId);

        // Verify Deduction
        expect(mockSupabase.from).toHaveBeenCalledWith('billing_ledger');
        expect(mockSupabase.insert).toHaveBeenCalledWith(expect.objectContaining({
            user_id: userId,
            amount: -1,
            type: 'message_sent'
        }));

        // Verify Send
        expect(mockWahaClient.sendText).toHaveBeenCalledWith('session1', '5511999999999', 'Hello');

        // Verify Save
        expect(mockSupabase.from).toHaveBeenCalledWith('messages');
    });

    it('should FAIL to send message calling Waha if credits are insufficient (Feature Flag ON)', async () => {
        const userId = 'user_poor';

        // 0. Mock Settings (Enable)
        mockSettingsService.getSettings.mockResolvedValue({ enable_credit_deduction: true });

        // ChatService needs chat lookup
        mockSupabase.single.mockResolvedValueOnce({ data: { id: 'chat_test' }, error: null });

        // 1. Mock Balance Check (Insufficient)
        mockSupabase.eq.mockResolvedValueOnce({ data: [{ amount: 0 }], error: null });

        await expect(chatService.sendMessage('session1', '5511999999999', 'Hello', userId))
            .rejects.toThrow('Insufficient credits');

        // Verify NO WAHA Call
        expect(mockWahaClient.sendText).not.toHaveBeenCalled();
        // Verify NO DB Save
        expect(mockSupabase.from).not.toHaveBeenCalledWith('messages');
    });

    it('should SEND message WITHOUT deducting if Feature Flag is OFF', async () => {
        const userId = 'user_vip';

        // 0. Mock Settings (Disable)
        mockSettingsService.getSettings.mockResolvedValue({ enable_credit_deduction: false });

        // ChatService needs chat lookup
        mockSupabase.single.mockResolvedValueOnce({ data: { id: 'chat_test' }, error: null });

        // 1. Mock WAHA Send
        mockWahaClient.sendText.mockResolvedValueOnce({ id: 'msg_vip' });

        // 2. Mock Message Save
        mockSupabase.upsert.mockResolvedValueOnce({ error: null });

        await chatService.sendMessage('session1', '5511999999999', 'Hello VIP', userId);

        // Verify NO Ledger Insert
        expect(mockSupabase.from).not.toHaveBeenCalledWith('billing_ledger');

        // Verify Send Happened
        expect(mockWahaClient.sendText).toHaveBeenCalledWith('session1', '5511999999999', 'Hello VIP');
    });
});
