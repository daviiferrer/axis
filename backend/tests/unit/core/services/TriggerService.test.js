const TriggerService = require('../../../../src/core/services/automation/TriggerService');

describe('TriggerService', () => {
    beforeEach(() => {
        mockWorkflowEngine = {
            processLead: jest.fn()
        };
        mockSupabase = {
            from: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            or: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn()
        };
        triggerService = new TriggerService(mockSupabase, mockWorkflowEngine);
    });

    test('handlePresenceUpdate should debounce and call triggerAiForLead', (done) => {
        jest.useFakeTimers();
        const spy = jest.spyOn(triggerService, 'triggerAiForLead').mockResolvedValue();

        triggerService.handlePresenceUpdate('session_1', '123456@s.whatsapp.net', 'online');

        expect(spy).not.toHaveBeenCalled();

        jest.advanceTimersByTime(3000); // Default debounce

        expect(spy).toHaveBeenCalledWith('123456', 'session_1');
        jest.useRealTimers();
        done();
    });

    test('triggerAiForLead should fetch lead and call workflow engine', async () => {
        const mockLead = { id: 1, phone: '123456', status: 'new' };
        mockSupabase.single.mockResolvedValue({ data: mockLead, error: null });

        await triggerService.triggerAiForLead('123456', 'session_1');

        expect(mockSupabase.from).toHaveBeenCalledWith('campaign_leads');
        expect(mockWorkflowEngine.processLead).toHaveBeenCalledWith(mockLead);
    });
});
