const HistoryService = require('../../../../src/core/services/chat/HistoryService');

describe('HistoryService', () => {
    let historyService;
    let mockSupabase;

    beforeEach(() => {
        mockSupabase = {
            from: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            insert: jest.fn().mockReturnThis(),
            single: jest.fn(),
            maybeSingle: jest.fn()
        };
        historyService = new HistoryService(mockSupabase);
    });

    test('getChatHistory should return formatted messages for Gemini', async () => {
        const mockMessages = [
            { body: 'Hello', from_me: false, is_ai: false, timestamp: 100 },
            { body: 'Hi', from_me: true, is_ai: true, timestamp: 200 }
        ];

        // Final link in chain is .limit()
        mockSupabase.limit.mockResolvedValue({ data: mockMessages, error: null });

        const result = await historyService.getChatHistory('chat_1', 2);

        expect(mockSupabase.from).toHaveBeenCalledWith('messages');
        expect(mockSupabase.eq).toHaveBeenCalledWith('chat_id', 'chat_1');
        expect(mockSupabase.order).toHaveBeenCalledWith('created_at', { ascending: false });

        // Result should be reversed: [assistant: Hi, user: Hello]
        expect(result).toEqual([
            { role: 'assistant', content: 'Hi' },
            { role: 'user', content: 'Hello' }
        ]);
    });

    test('getFormattedHistoryForHint should return human friendly text', async () => {
        const mockMessages = [
            { body: 'Hello', from_me: false, is_ai: false, timestamp: 100 }
        ];
        mockSupabase.limit.mockResolvedValue({ data: mockMessages, error: null });

        const result = await historyService.getFormattedHistoryForHint('chat_1');

        expect(result).toContain('Cliente: Hello');
    });

    test('getFormattedHistoryForHint should handle empty history', async () => {
        mockSupabase.limit.mockResolvedValue({ data: [], error: null });

        const result = await historyService.getFormattedHistoryForHint('chat_1');

        expect(result).toBe('Novo lead - inicie a conversa!');
    });
});
