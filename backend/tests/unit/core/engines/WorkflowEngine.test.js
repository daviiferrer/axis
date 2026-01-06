const WorkflowEngine = require('../../../../src/core/engines/workflow/WorkflowEngine');

describe('WorkflowEngine (Unit)', () => {
    let workflowEngine;
    let mockNodeFactory;
    let mockLeadService;
    let mockCampaignService;
    let mockSupabase;
    let mockCampaignSocket;

    beforeEach(() => {
        jest.useFakeTimers();
        // Set time to Monday 10:00 AM (Within business hours)
        jest.setSystemTime(new Date('2024-01-08T10:00:00Z'));

        mockNodeFactory = {
            getExecutor: jest.fn()
        };
        mockLeadService = {
            getLeadsForProcessing: jest.fn().mockResolvedValue([]),
            transitionToNode: jest.fn().mockResolvedValue({}),
            markNodeExecuted: jest.fn().mockResolvedValue({}),
            updateLeadData: jest.fn().mockResolvedValue({})
        };
        mockCampaignService = {
            getCampaign: jest.fn()
        };
        mockSupabase = {
            from: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(), // Will be overridden in specific tests
            update: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: null, error: null })
        };
        // Default Mock Behavior for 'eq' to avoid crashes in other tests
        mockSupabase.eq.mockReturnValue(mockSupabase);

        mockCampaignSocket = {
            emitLeadUpdate: jest.fn()
        };

        workflowEngine = new WorkflowEngine({
            nodeFactory: mockNodeFactory,
            leadService: mockLeadService,
            campaignService: mockCampaignService,
            supabase: mockSupabase,
            campaignSocket: mockCampaignSocket
        });
    });

    test('pulse should process all active campaigns', async () => {
        const mockCampaigns = [{ id: 1 }, { id: 2 }];
        // Override eq mock for this test
        mockSupabase.eq.mockResolvedValue({ data: mockCampaigns, error: null });

        jest.spyOn(workflowEngine, 'isBusinessHours').mockReturnValue(true);
        const spy = jest.spyOn(workflowEngine, 'processLead').mockResolvedValue();

        await workflowEngine.pulse();

        // The implementation calls this.supabase.from('campaigns').select('*').eq('status', 'active')
        // So eq must return a promise that resolves to data
        expect(mockSupabase.from).toHaveBeenCalledWith('campaigns');
        expect(mockLeadService.getLeadsForProcessing).toHaveBeenCalledTimes(2);
        expect(spy).toHaveBeenCalledTimes(0); // No leads in mock
    });

    test('jumpToFlow should transition lead to named entry point', async () => {
        const instanceId = 101;
        const flowName = 'recovery';

        const mockCampaignData = {
            id: 1,
            campaigns: { // structure returned by join
                strategy_graph: {
                    nodes: [
                        { id: 'start_inbound', type: 'entry_point', data: { flow_name: 'inbound' } },
                        { id: 'start_recovery', type: 'entry_point', data: { flow_name: 'recovery' } }
                    ],
                    edges: []
                }
            },
            context: { existing: 'data' }
        };

        // Mock Supabase Chain for jumpToFlow
        // 1. .from().select().eq(instanceId).single()
        const mockSingle = jest.fn().mockResolvedValue({ data: mockCampaignData, error: null });
        mockSupabase.eq.mockImplementation((field, val) => {
            if (field === 'id' && val === instanceId) {
                return { single: mockSingle };
            }
            return { single: jest.fn().mockResolvedValue({ data: null }) };
        });

        // 2. updateLeadData or internal transition
        // jumpToFlow calls _updateState (which likely calls supabase update directly or via service)
        // and _transitionTo (which calls leadService or recursively processLead).

        // Spy on _transitionTo if possible, or assume it works by side effects.
        // We can inspect 'mockSupabase.update' calls if _updateState uses it.
        // WorkflowEngine.js line 656: await this._updateState(...)

        // Act
        await workflowEngine.jumpToFlow(instanceId, flowName);

        // Assert
        // Verify state update (current_flow)
        // Note: WorkflowEngine._updateState calls: this.supabase.from('campaign_instances').update({...}).eq('id', id)
        expect(mockSupabase.update).toHaveBeenCalledWith(expect.objectContaining({
            context: expect.objectContaining({ current_flow: 'recovery' })
        }));
    });

    test('jumpToFlow should return false if flow name not found', async () => {
        const instanceId = 101;
        const mockCampaignData = {
            id: 101,
            campaigns: {
                strategy_graph: { nodes: [] }
            }
        };

        const mockSingle = jest.fn().mockResolvedValue({ data: mockCampaignData, error: null });
        mockSupabase.eq.mockReturnValue({ single: mockSingle });

        const result = await workflowEngine.jumpToFlow(instanceId, 'non_existent_flow');
        expect(result).toBe(false);
    });

    afterEach(() => {
        jest.useRealTimers();
    });
});
