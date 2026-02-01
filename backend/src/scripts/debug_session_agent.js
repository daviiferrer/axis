require('dotenv').config();
const { configureContainer } = require('../container');

async function run() {
    console.log('🕵️ Debugging Session <-> Campaign <-> Agent Link...');
    const container = configureContainer(); // Initialize DI
    const supabase = container.resolve('supabaseAdmin');

    const SESSION_NAME = 'teste_axis';
    const GHOST_AGENT_ID = 'a7531b67-40dc-4e8e-aa8f-e21d852a69a3';

    // 1. Get Campaign by Session
    const { data: campaigns, error: campError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('waha_session_name', SESSION_NAME);

    if (campError) console.error(campError);
    if (!campaigns?.length) {
        console.log(`❌ No campaign found for session "${SESSION_NAME}"`);
    } else {
        campaigns.forEach(c => {
            console.log(`✅ Campaign using session "${SESSION_NAME}": ${c.name} (${c.id})`);
            console.log(`   -> Status: ${c.status}, Mode: ${c.mode}`);
        });
    }

    // 2. Inspect the Ghost Agent (Julia?)
    const { data: ghostAgent, error: ghostError } = await supabase
        .from('agents')
        .select('*')
        .eq('id', GHOST_AGENT_ID)
        .single();

    if (ghostAgent) {
        console.log(`\n👻 GHOST AGENT FOUND (${GHOST_AGENT_ID}):`);
        console.log(`   Name: ${ghostAgent.name}`);
        console.log(`   DNA Identity:`, ghostAgent.dna_config?.identity);
        console.log(`   Model: ${ghostAgent.model}`);
    } else {
        console.log(`\n❌ Ghost agent ${GHOST_AGENT_ID} not found in DB.`);
    }

    // 3. Inspect Flow Nodes for the active campaign
    if (campaigns?.length) {
        const camp = campaigns[0];
        const { data: flow } = await supabase
            .from('flows')
            .select('*')
            .eq('campaign_id', camp.id)
            .single();

        if (flow) {
            console.log(`\n🕸️ Flow Nodes for Campaign "${camp.name}":`);
            const nodes = flow.nodes || [];
            nodes.forEach(node => {
                if (node.type === 'agentic') {
                    console.log(`   - Node ${node.id} uses AgentId: ${node.data.agentId}`);
                }
            });
        }
    }

    process.exit(0);
}

run();
