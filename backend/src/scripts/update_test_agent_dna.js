require('dotenv').config();
const { configureContainer } = require('../container');

async function run() {
    console.log('🧬 Updating Test Agent DNA for HUMAN Mode...');
    const container = configureContainer();
    const supabase = container.resolve('supabaseAdmin');
    const agentService = container.resolve('agentService');

    // const AGENT_NAME = 'Agente de Teste Real';
    const AGENT_ID = 'a7531b67-40dc-4e8e-aa8f-e21d852a69a3'; // The 'Julia' agent active in 'Central de Triagem'

    // 1. Find Agent
    const { data: agents, error } = await supabase
        .from('agents')
        .select('*')
        .eq('id', AGENT_ID)
        .limit(1);

    if (error || !agents.length) {
        console.error('❌ Agent not found:', error);
        process.exit(1);
    }

    const agent = agents[0];
    console.log(`✅ Found Agent: ${agent.name} (${agent.id})`);

    // 2. New DNA Config with Human SDR settings
    const currentDna = agent.dna_config || {};

    const newDna = {
        ...currentDna,
        identity: {
            ...currentDna.identity,
            role: 'SDR', // Matches Identity.Role.SDR? Or just string. Let's use string describe.
            custom_role: 'Human Sales Rep'
        },
        behavior: {
            ...currentDna.behavior,
            goal: 'Converter o lead em agendamento de forma natural.',
            personality: 'Despojado, direto, levemente informal (usa gírias leves).'
        },
        // Canonical Linguistics from AgentDNA.js
        linguistics: {
            reduction_profile: 'NATIVE', // Means: Use 'vc', 'tbm', informal grammar
            typo_injection: 'LOW',       // Means: Occasional typos (handled by Physics or Prompt)
            caps_mode: 'STANDARD'
        },
        brand_voice: {
            ...currentDna.brand_voice,
            tone: ['Conversational', 'Persuasive'],
            emojis_allowed: true,
            prohibited_words: ['Prezado', 'Senhor', 'Atenciosamente']
        }
    };

    await agentService.updateDnaConfig(agent.id, newDna);
    console.log('✨ Agent DNA Updated to HUMAN_SDR mode with typos enabled.');

    process.exit(0);
}

run();
