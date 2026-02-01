require('dotenv').config();
const { createContainer, asValue, asClass, asFunction, InjectionMode } = require('awilix');
// Mocks/Stubs for missing deps if necessary, but we try to use real ones
const container = require('../container');

async function run() {
    console.log('🚀 Starting Test Data Seed...');

    // We need to setup the container explicitly because container.js exports a configure function usually?
    // Checking container.js: it exports 'container' and 'configureContainer'.
    // We need to call configureContainer maybe?

    // Let's look at server.js to see how it starts.
    const { configureContainer } = require('../container');
    const container = configureContainer();

    const supabase = container.resolve('supabaseAdmin'); // Admin access to bypass RLS for seeding

    // 1. Get a User
    const { data: users, error: userError } = await supabase
        .from('profiles')
        .select('*')
        .limit(1);

    if (userError || !users.length) {
        console.error('❌ No users found in database. Create a user first via Supabase Auth.');
        process.exit(1);
    }

    const user = users[0];
    console.log(`👤 Using User: ${user.email} (${user.id})`);

    // 2. Create Agent
    console.log('🤖 Creating Test Agent...');
    const agentService = container.resolve('agentService');
    const agentData = {
        name: 'Agente de Teste Real',
        // role, goal, personality likely belong in dna_config or separate columns not in top-level insert if catching error
        // Let's assume basic schema first
        is_active: true
    };

    // Check if agent exists to avoid dupes
    // Assuming createAgent handles it or we just create new.
    const agent = await agentService.createAgent(agentData, user.id);
    console.log(`✅ Agent Created: ${agent.name} (${agent.id})`);

    // Update DNA Config with behavioral data
    const dnaConfig = {
        identity: {
            name: 'Agente de Teste',
            role: 'Assistente Geral',
            company: 'Empresa Teste'
        },
        brand_voice: {
            tone: ['Simpático', 'Direto'],
            prohibited_words: [],
            emojis_allowed: true
        },
        compliance: {
            legal_rules: [],
            data_handling: 'secure'
        },
        behavior: {
            goal: 'Ajudar o usuário a testar o fluxo.',
            personality: 'Simpático e direto.'
        }
    };
    await agentService.updateDnaConfig(agent.id, dnaConfig);
    console.log('🧬 Agent DNA Configured');

    // 3. Create Campaign
    console.log('📢 Creating Test Campaign...');
    const campaignService = container.resolve('campaignService');
    const campaignPayload = {
        name: 'Campanha Teste Real Link',
        description: 'Campanha para testar linking de sessão.',
        session_id: 'default', // Legacy field?
        waha_session_name: 'default', // THE IMPORTANT FIELD
        type: 'inbound'
    };

    // We create it.
    let campaign = await campaignService.createCampaign(user.id, campaignPayload);
    console.log(`✅ Campaign Created: ${campaign.name} (${campaign.id})`);

    // 4. Update Flow (Graph)
    console.log('🕸️ Setting up simple Flow...');
    const flowData = {
        nodes: [
            {
                id: 'start-1',
                type: 'start',
                position: { x: 100, y: 100 },
                data: { label: 'Início' }
            },
            {
                id: 'agent-1',
                type: 'agentic', // The Agentic Node
                position: { x: 300, y: 100 },
                data: {
                    label: 'Agente Principal',
                    agentId: agent.id, // Link to our agent
                    systemPrompt: 'Você é um assistente de teste. Responda "Funciona!" se entender.',
                    model: 'gemini-1.5-flash'
                }
            }
        ],
        edges: [
            {
                id: 'e1',
                source: 'start-1',
                target: 'agent-1'
            }
        ]
    };

    await campaignService.saveFlow(campaign.id, flowData);

    // 5. Activate Campaign
    console.log('🟢 Activating Campaign...');
    await campaignService.updateCampaignStatus(campaign.id, 'active');

    // Set to LIVE mode (if supported)
    try {
        // Mock subscription check bypass might be needed or we rely on logic
        await campaignService.updateCampaignMode(campaign.id, 'live', user.id);
    } catch (e) {
        console.warn('⚠️ Could not set to LIVE mode (maybe billing check failed):', e.message);
        console.log('ℹ️ Leaving as test/sandbox mode if applicable.');
    }

    console.log('\n🎉 SETUP COMPLETE!');
    console.log(`👉 Send a WhatsApp message to the number linked to session "default".`);
    console.log(`👉 It should match Campaign: ${campaign.name}`);

    process.exit(0);
}

run().catch(err => {
    console.error('❌ Fatal Error:', err);
    process.exit(1);
});
