const path = require('path');
const WorkflowEngine = require('../src/core/engines/workflow/WorkflowEngine');

// 1. Mock Dependencies
const mockLogger = {
    info: (msg, label) => console.log(`[INFO] ${label || ''}:`, msg),
    warn: (msg, label) => console.log(`[WARN] ${label || ''}:`, msg),
    error: (msg, label) => console.error(`[ERROR] ${label || ''}:`, msg),
    debug: (msg, label) => console.log(`[DEBUG] ${label || ''}:`, msg),
};

// Mock Supabase to simulate DB state and failures
const mockSupabase = {
    from: (table) => {
        return {
            select: () => ({
                eq: (col, val) => ({
                    limit: () => ({
                        maybeSingle: async () => {
                            if (table === 'campaigns') {
                                // Simulate finding "Triagem" campaign
                                return { data: { id: 'camp_123', name: 'Triagem', status: 'active', strategy_graph: JSON.stringify({ nodes: [{ id: '1', type: 'leadEntry' }], edges: [] }) } };
                            }
                            // Simulate NO lead found initially
                            return { data: null };
                        }
                    }),
                    // For the "Robust Lookup" using limit(1) instead of maybeSingle
                    limit: async () => {
                        if (table === 'campaign_leads') {
                            // First call: Not found. Second call (after insert): Found.
                            // We'll simulate "not found" for this test to trigger Triage.
                            return { data: [] };
                        }
                    }
                }),
                or: () => ({
                    eq: () => ({
                        limit: () => ({
                            maybeSingle: async () => {
                                // Finding Inbox Campaign
                                return { data: { id: 'camp_triage_123', name: 'Triagem' } };
                            }
                        })
                    })
                })
            }),
            insert: (data) => ({
                select: () => ({
                    single: async () => {
                        console.log('   [DB] INSERTING Lead:', data);
                        // Return created lead
                        return { data: { ...data, id: 'lead_new_123' }, error: null };
                    }
                })
            })
        };
    }
};

const mockNodeFactory = {
    getExecutor: (type) => ({ execute: async () => ({ status: 'success' }) })
};

const mockLeadService = {
    transitionToNode: async () => { },
    markNodeExecuted: async () => { }
};

const mockCampaignService = {
    getCampaign: async () => ({ id: 'camp_triage_123', strategy_graph: { nodes: [{ id: 'start', type: 'leadEntry' }], edges: [] } })
};

async function runTest() {
    console.log('🚀 Starting Triage Fix Verification...\n');

    const engine = new WorkflowEngine({
        nodeFactory: mockNodeFactory,
        leadService: mockLeadService,
        campaignService: mockCampaignService,
        supabase: mockSupabase,
        campaignSocket: null,
        queueService: null
    });

    const phone = '5511999999999';

    // Test 1: Race Condition
    console.log('--- TEST 1: Race Condition Lock ---');
    console.log('Firing two requests for the same phone...');

    // We intentionally don't await the first one immediately to simulate concurrency
    const p1 = engine.triggerAiForLead(phone);
    const p2 = engine.triggerAiForLead(phone);

    await Promise.all([p1, p2]);
    console.log('-----------------------------------\n');

    // Test 2: Triage Flow (creating lead)
    console.log('--- TEST 2: Triage Creation & Graph Loading ---');
    // The previous calls should have triggered the creation logic internally.
    // Check the logs above for "[DB] INSERTING Lead".

    console.log('✅ Test Complete.');
}

runTest();
