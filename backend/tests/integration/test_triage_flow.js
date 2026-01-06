const WorkflowEngine = require('../../src/core/engines/workflow/WorkflowEngine');
const LeadService = require('../../src/core/services/campaign/LeadService');
const CampaignService = require('../../src/core/services/campaign/CampaignService');
const NodeFactory = require('../../src/core/engines/workflow/NodeFactory');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

// We need correct executors logic
const LogicNode = require('../../src/core/engines/workflow/nodes/LogicNode');
const HandoffNode = require('../../src/core/engines/workflow/nodes/HandoffNode');
// LeadEntryNode usually handled by Engine or doesn't exist as class, we mock it.

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const leadService = new LeadService(supabase);
const campaignService = new CampaignService(supabase);

// Mock DI for LogicNode (We don't need real AI for this deterministic test, we use Regex rules)
const mockDependencies = {
    geminiClient: {},
    modelService: {},
    leadService,
    campaignService,
    supabase
};

// Custom NodeFactory that returns our Real Executors with Mock Dependencies
const nodeFactory = {
    getExecutor: (type) => {
        if (type === 'logic') return new LogicNode(mockDependencies);
        if (type === 'handoff') return new HandoffNode({ leadService, supabase }); // Handoff needs leadService
        // Minimal mock for others (Agent, LeadEntry, etc)
        // LeadEntry is just a passthrough usually, or return success
        return { execute: async () => ({ status: 'success' }) };
    }
};

const workflowEngine = new WorkflowEngine({
    nodeFactory,
    leadService,
    campaignService,
    supabase
});

async function runTriageTest() {
    console.log('🏥/💻 Starting Triage Flow Test (Health vs Tech)...');

    // 1. Create Target Campaigns
    const { data: healthCamp } = await supabase.from('campaigns').insert({ name: 'CAMPANHA SAUDE', status: 'active' }).select().single();
    const { data: techCamp } = await supabase.from('campaigns').insert({ name: 'CAMPANHA TECH', status: 'active' }).select().single();

    console.log(`✅ Targets Created: Health(${healthCamp.id}), Tech(${techCamp.id})`);

    // 2. Create Triage Campaign Strategy
    // Triage Graph: Entry -> Logic -> (HealthHandoff OR TechHandoff)
    const strategy = {
        nodes: [
            { id: 'entry', type: 'leadEntry' },
            {
                id: 'router',
                type: 'logic',
                data: {
                    rules: [
                        { pattern: 'saude|medico|hospital', label: 'saude' },
                        { pattern: 'tech|software|computador', label: 'tech' }
                    ]
                }
            },
            {
                id: 'handoff-health',
                type: 'handoff',
                data: { target: 'campaign', targetCampaignId: healthCamp.id, reason: 'Interesse Saude' }
            },
            {
                id: 'handoff-tech',
                type: 'handoff',
                data: { target: 'campaign', targetCampaignId: techCamp.id, reason: 'Interesse Tech' }
            }
        ],
        edges: [
            { source: 'entry', target: 'router' },
            { source: 'router', target: 'handoff-health', label: 'saude' }, // Route A
            { source: 'router', target: 'handoff-tech', label: 'tech' }     // Route B
        ]
    };

    const { data: triageCamp } = await supabase.from('campaigns')
        .insert({ name: 'CAMPANHA TRIAGEM', status: 'active', strategy_graph: strategy })
        .select().single();

    console.log(`✅ Triage Campaign Created: ${triageCamp.id}`);

    // 3. Mock 5 Clients
    const clients = [
        { name: 'Alice', msg: 'Quero um plano de saude', expected: healthCamp.id, expectedName: 'SAUDE' },
        { name: 'Bob', msg: 'Preciso de um software novo', expected: techCamp.id, expectedName: 'TECH' },
        { name: 'Carol', msg: 'Estou no hospital', expected: healthCamp.id, expectedName: 'SAUDE' },
        { name: 'Dave', msg: 'Comprar computador', expected: techCamp.id, expectedName: 'TECH' },
        { name: 'Eve', msg: 'Medico urgente', expected: healthCamp.id, expectedName: 'SAUDE' }
    ];

    console.log('\n🚀 Processing 5 Clients...');

    for (const client of clients) {
        const phone = '55119' + Math.floor(Math.random() * 10000000);

        // Insert Lead into Triage
        let { data: lead } = await supabase.from('campaign_leads').insert({
            campaign_id: triageCamp.id,
            phone,
            name: client.name,
            status: 'new',
            source: 'inbound',
            // Simulate that they already sent a message that LogicNode will read
            last_message_at: new Date().toISOString(),
            // We need to inject the message somewhere LogicNode reads. 
            // LogicNode reads `lead.last_message_body` (custom implementation usually depends on DB join but here mock logic reads property)
            // Wait, standard LogicNode.js reads `lead.last_message_body`. 'campaign_leads' table doesn't have this column natively.
            // Usually it comes from a View or Join during runtime. 
            // Hack for test: LogicNode executor in our real code reads `lead.last_message_body`. 
            // We will manually attach it to the lead object passed to processLead, OR update DB if we can.
            // But processLead fetches lead from DB.
            // Let's modify processLead or Mock logic?
            // Actually, LogicNode.js line 17: `const lastMessage = lead.last_message_body || "";`
            // So we need `getLeadsForProcessing` (or processLead's lead fetch) to include this.
            // Standard supabase fetch `select('*')` won't have it unless it's a column.
            // Workaround: We will update `custom_fields` with the message and make LogicNode read that? No, LogicNode is hardcoded.
            // Real solution: Insert lead, then CALL `processLead(leadObject)` where leadObject HAS THE PROPERTY manually injected.
            // Validation: verify processLead doesn't re-fetch immediately ignoring our argument.
            // Checking WorkflowEngine.js: `processLead(lead, campaign)` -> executes. It passes `lead` to executor.
            // So if we pass `lead` with the property, it should work.
        }).select().single();

        // Inject message
        lead.last_message_body = client.msg;

        console.log(`\n👤 Client: ${client.name} | Msg: "${client.msg}"`);

        // Run Workflow until completion (loop)
        await workflowEngine.processLead(lead, triageCamp);

        // Verify Result
        const { data: finalLead } = await supabase.from('campaign_leads').select('*').eq('id', lead.id).single();

        const success = finalLead.campaign_id === client.expected;
        const icon = success ? '✅' : '❌';
        console.log(`${icon} Result: Ends in Campaign ${finalLead.campaign_id === healthCamp.id ? 'SAUDE' : (finalLead.campaign_id === techCamp.id ? 'TECH' : 'UNKNOWN')}`);

        if (!success) {
            console.error(`   ERROR: Expected ${client.expectedName} but got ${finalLead.campaign_id}`);
            throw new Error('Routing Mismatch');
        }
    }

    // Cleanup
    console.log('\n🧹 Cleaning up...');
    await supabase.from('campaign_leads').delete().eq('campaign_id', healthCamp.id);
    await supabase.from('campaign_leads').delete().eq('campaign_id', techCamp.id);
    await supabase.from('campaign_leads').delete().eq('campaign_id', triageCamp.id);
    await supabase.from('campaigns').delete().in('id', [healthCamp.id, techCamp.id, triageCamp.id]);
}

runTriageTest()
    .then(() => console.log('\n🌟 Triage Logic Verification Complete!'))
    .catch(e => {
        console.error('Test Failed:', e);
        process.exit(1);
    });
