require('dotenv').config();
const { configureContainer } = require('../src/container');
const logger = require('../src/shared/Logger').createModuleLogger('diagnose');

async function runDiagnosis() {
    console.log('🔍 Starting Comprehensive Agent Flow Diagnosis...');

    // 1. Initialize Container
    const container = configureContainer();
    const campaignService = container.resolve('campaignService');
    const leadService = container.resolve('leadService');
    const agentService = container.resolve('agentService');
    const promptService = container.resolve('promptService');
    const supabase = container.resolve('supabaseClient');

    // TARGETS
    const CAMPAIGN_ID = 'a09407d1-203a-485b-b4b4-5ec31cc80cd0';
    // const LEAD_ID = '96c81091-8395-43e9-aafb-d3a69f2b4285'; // Use latest from logs if possible, or fetch one

    try {
        // 2. Fetch Campaign & Graph
        console.log(`\n📂 Fetching Campaign: ${CAMPAIGN_ID}`);
        const campaign = await campaignService.getCampaign(CAMPAIGN_ID);

        if (!campaign) {
            console.error('❌ Campaign NOT FOUND');
            return;
        }
        console.log(`✅ Campaign Found: "${campaign.name}" (Status: ${campaign.status})`);

        const graph = campaign.graph || campaign.strategy_graph;
        if (!graph || !graph.nodes) {
            console.error('❌ Graph is EMPTY or INVALID');
            console.log('Graph Value:', JSON.stringify(graph, null, 2));
            return;
        }
        console.log(`✅ Graph Loaded: ${graph.nodes.length} nodes, ${graph.edges.length} edges`);

        // 3. Analyze Graph Connectivity (Trigger -> Agent)
        const triggerNode = graph.nodes.find(n => n.type === 'trigger');
        if (!triggerNode) {
            console.error('❌ No TRIGGER node found');
            return;
        }
        console.log(`✅ Trigger Node: ${triggerNode.id} (${triggerNode.data.label})`);

        const edgeToNext = graph.edges.find(e => e.source === triggerNode.id);
        if (!edgeToNext) {
            console.error(`❌ NO EDGE outgoing from Trigger ${triggerNode.id}`);
            console.log('Edges:', graph.edges);
            return;
        }

        const nextNode = graph.nodes.find(n => n.id === edgeToNext.target);
        if (!nextNode) {
            console.error(`❌ Edge points to missing node: ${edgeToNext.target}`);
            return;
        }
        console.log(`✅ Next Node found: "${nextNode.data.label}" (Type: ${nextNode.type}, ID: ${nextNode.id})`);

        if (nextNode.type !== 'agentic') {
            console.warn(`⚠️ Next node is NOT an agent. It is: ${nextNode.type}. Diagnosis continues...`);
        }

        // 4. Validate Agent Configuration (The likely culprit)
        console.log('\n🤖 Validating Agent Configuration...');
        const agentId = nextNode.data.agentId || nextNode.data.agent_id || campaign.agent_id;

        if (!agentId) {
            console.error('❌ No Agent ID configured in Node or Campaign');
            console.log('Node Data:', nextNode.data);
            return;
        }
        console.log(`🔹 Target Agent ID: ${agentId}`);

        const agent = await agentService.getAgent(agentId);
        if (!agent) {
            console.error(`❌ Agent ${agentId} does NOT exist in DB`);
            return;
        }
        console.log(`✅ Agent Found: "${agent.name}"`);

        // 4.1 Check DNA
        if (!agent.dna_config || Object.keys(agent.dna_config).length === 0) {
            console.error('❌ Agent has NO DNA Config (Empty)');
            console.log('Agent Record:', agent);
            return;
        }
        console.log('✅ Agent DNA Config present');

        // 4.2 Check Model
        const model = nextNode.data.model || agent.model;
        if (!model) {
            console.error('❌ No AI Model configured (neither in Node nor Agent)');
            return;
        }
        console.log(`✅ AI Model: ${model}`);

        // 5. Simulate Lead Context (Validation Only)
        // Find a lead to test with
        console.log('\n👤 Fetching Test Lead...');
        const { data: leads } = await supabase.from('leads').select('*').eq('campaign_id', CAMPAIGN_ID).limit(1);
        const lead = leads?.[0] || { id: 'mock-lead', name: 'Tester', phone: '555555555' };

        console.log(`✅ Using Lead: ${lead.id} (${lead.name})`);

        // 6. Test Prompt Building (Sandwich Pattern Check)
        console.log('\n🧩 Testing Prompt Construction...');
        try {
            const contextData = {
                agent: agent,
                campaign: campaign,
                lead: lead,
                chatHistory: [],
                nodeDirective: nextNode.data.instruction_override,
                product: nextNode.data.product,
                dna: agent.dna_config, // raw dna config
                nodeConfig: nextNode
            };

            const prompt = await promptService.buildStitchedPrompt(contextData);
            console.log('✅ Prompt Built Successfully!');
            console.log('--- Prompt Preview (First 500 chars) ---');
            console.log(prompt.substring(0, 500) + '...');
        } catch (err) {
            console.error('❌ Prompt Construction Failed:', err.message);
            console.error(err);
        }

        console.log('\n🏁 diagnosis complete.');

    } catch (error) {
        console.error('💥 Fatal Diagnostic Error:', error);
    }
}

runDiagnosis();
