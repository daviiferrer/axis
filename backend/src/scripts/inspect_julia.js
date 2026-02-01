require('dotenv').config();
const { configureContainer } = require('../container');

async function run() {
    console.log('🕵️ Inspecting Julia DNA...');
    const container = configureContainer();
    const supabase = container.resolve('supabaseAdmin');
    const AGENT_ID = 'a7531b67-40dc-4e8e-aa8f-e21d852a69a3';

    const { data: agent, error } = await supabase
        .from('agents')
        .select('*')
        .eq('id', AGENT_ID)
        .single();

    if (error) {
        console.error(error);
        process.exit(1);
    }

    console.log('--- RAW DNA CONFIG ---');
    console.log(JSON.stringify(agent.dna_config, null, 2));

    console.log('\n--- IDENTITY CHECK ---');
    console.log(`Name: ${agent.name}`);
    console.log(`Company (in DNA): ${agent.dna_config?.identity?.company}`);
    console.log(`Company Context (Root JSON):`, JSON.stringify(agent.company_context, null, 2));

    process.exit(0);
}

run();
