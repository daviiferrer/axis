const SettingsService = require('../../../../src/core/services/system/SettingsService');

describe('SettingsService', () => {
    beforeEach(() => {
        const maybeSingleMock = jest.fn();
        mockSupabase = {
            from: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnValue({ maybeSingle: maybeSingleMock }),
            single: jest.fn(),
            maybeSingle: maybeSingleMock,
            upsert: jest.fn().mockReturnThis()
        };
        settingsService = new SettingsService(mockSupabase);
    });

    test('getSettings should return value from DB', async () => {
        const mockData = { id: 1, user_id: 'u1' };
        // SettingsService uses .limit(1).maybeSingle()
        const maybeSingleMock = mockSupabase.limit().maybeSingle;
        maybeSingleMock.mockResolvedValue({ data: mockData, error: null });

        const result = await settingsService.getSettings('u1');
        expect(result).toEqual(mockData);
    });

    test('updateSettings should upsert into DB', async () => {
        mockSupabase.single.mockResolvedValue({ data: { id: 1 }, error: null });

        await settingsService.updateSettings('u1', { theme: 'dark' });

        expect(mockSupabase.upsert).toHaveBeenCalledWith(
            expect.objectContaining({ theme: 'dark' }),
            { onConflict: 'id' }
        );
    });
});
