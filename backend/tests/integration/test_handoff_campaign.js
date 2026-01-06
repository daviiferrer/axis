const WorkflowEngine = require('../../src/core/engines/workflow/WorkflowEngine');
const LeadService = require('../../src/core/services/campaign/LeadService');
const CampaignService = require('../../src/core/services/campaign/CampaignService');
const HandoffNode = require('../../src/core/engines/workflow/nodes/HandoffNode');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const leadService = new LeadService(supabase);
const campaignService = new CampaignService(supabase);
const mockNodeFactory = {}; // Not used directly in this micro-test, we invoke executor manually
const workflowEngine = new WorkflowEngine({
    nodeFactory: mockNodeFactory,
    leadService,
    campaignService,
    supabase
});

async function testHandoff() {
    console.log('🧪 Starting Handoff Campaign Test...');

    // 1. Create Target Campaign (Where lead should go)
    const { data: targetCamp, error: err1 } = await supabase
        .from('campaigns')
        .insert({
            name: 'Target Campaign ' + Date.now(),
            status: 'active',
            strategy_graph: { nodes: [{ id: 'target-entry', type: 'leadEntry' }], edges: [] }
        })
        .select()
        .single();
    if (err1) throw err1;
    console.log('✅ Target Campaign Created:', targetCamp.id);

    // 2. Create Source Campaign (Where lead starts)
    const { data: sourceCamp, error: err2 } = await supabase
        .from('campaigns')
        .insert({
            name: 'Source Campaign ' + Date.now(),
            status: 'active',
            strategy_graph: { nodes: [], edges: [] }
        })
        .select()
        .single();
    if (err2) throw err2;
    console.log('✅ Source Campaign Created:', sourceCamp.id);

    // 3. Create Lead in Source Campaign
    const phone = '551198888' + Math.floor(Math.random() * 1000);
    const { data: lead } = await supabase
        .from('campaign_leads')
        .insert({
            campaign_id: sourceCamp.id,
            phone: phone,
            name: 'Handoff Traveler',
            status: 'new',
            source: 'inbound',
            current_node_id: 'node-handoff'
        })
        .select()
        .single();
    console.log(`✅ Lead Created in Source. Campaign ID: ${lead.campaign_id}`);

    // 4. Execute Handoff Node Logic manually (since we want to isolate node logic + service side effect)
    // Actually, checking HandoffNode AND WorkflowEngine integration is better.
    // Let's use HandoffNode executor directly but it relies on 'leadService' to do DB updates?
    // Wait, HandoffNode usually just returns action='transfer' and metadata. WorkflowEngine orchestrates the DB update?
    // Let's check HandoffNode.js to see if it updates DB or if it asks Engine to do it.

    // Assumption: HandoffNode performs the update or returns distinct status.
    // I will read HandoffNode.js content to be sure.
    // But for now, let's assume I instantiate it.

    const HandoffNodeExecutor = require('../../src/core/engines/workflow/nodes/HandoffNode');
    const executor = new HandoffNodeExecutor({ leadService }); // It likely uses leadService

    console.log('🔄 Executing Handoff Node...');
    const result = await executor.execute(
        lead,
        sourceCamp,
        {
            id: 'node-handoff',
            data: { target: 'campaign', targetCampaignId: targetCamp.id, reason: 'Test Transfer' }
        },
        {}
    );

    console.log('Executor Result:', result);

    // 5. Verify Database State
    const { data: leadAfter } = await supabase
        .from('campaign_leads')
        .select('*')
        .eq('id', lead.id)
        .single();

    console.log(`\n🔍 Verification:`);
    console.log(`Original Campaign: ${sourceCamp.id}`);
    console.log(`Target Campaign:   ${targetCamp.id}`);
    console.log(`Lead Now In:       ${leadAfter.campaign_id}`);

    if (leadAfter.campaign_id === targetCamp.id) {
        console.log('✅ PASS: Lead was successfully transferred to Target Campaign.');
    } else {
        console.log('❌ FAIL: Lead is still in old campaign or somewhere else.');
        throw new Error('Handoff failed');
    }

    // Cleanup
    await supabase.from('campaign_leads').delete().eq('id', lead.id);
    await supabase.from('campaigns').delete().eq('id', sourceCamp.id);
    await supabase.from('campaigns').delete().eq('id', targetCamp.id);
}

testHandoff()
    .then(() => console.log('\n🎉 Test Finished'))
    .catch(e => {
        console.error('Test Failed:', e);
        process.exit(1);
    });
