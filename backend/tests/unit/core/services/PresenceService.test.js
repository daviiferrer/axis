const PresenceService = require('../../../../src/core/services/automation/PresenceService');

describe('PresenceService', () => {
    let presenceService;
    let mockWaha;
    let mockSupabase;
    let mockCache;
    let mockSocket;

    beforeEach(() => {
        mockWaha = {
            subscribePresence: jest.fn().mockResolvedValue({ success: true })
        };
        mockSupabase = {
            from: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            not: jest.fn().mockResolvedValue({
                data: [{ phone: '123456', campaigns: { session_name: 'session_1' } }],
                error: null
            })
        };

        // PresenceService expects (supabaseClient, wahaClient)
        presenceService = new PresenceService(mockSupabase, mockWaha);
    });

    test('syncAllLeadsPresence should fetch from DB and subscribe in WAHA', async () => {
        await presenceService.syncAllLeadsPresence();

        expect(mockSupabase.from).toHaveBeenCalledWith('campaign_leads');
        expect(mockWaha.subscribePresence).toHaveBeenCalledWith('session_1', '123456@s.whatsapp.net');
    });

    test('startPeriodicSync and stopPeriodicSync should manage intervals', () => {
        jest.useFakeTimers();
        presenceService.startPeriodicSync();
        expect(presenceService.syncIntervalId).not.toBeNull();

        presenceService.stopPeriodicSync();
        expect(presenceService.syncIntervalId).toBeNull();
        jest.useRealTimers();
    });
});
