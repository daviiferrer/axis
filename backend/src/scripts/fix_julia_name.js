require('dotenv').config();
const { configureContainer } = require('../container');

async function run() {
    console.log('🔧 Fixing Julia vs Ana Identity...');
    const container = configureContainer();
    const supabase = container.resolve('supabaseAdmin');
    const AGENT_ID = 'a7531b67-40dc-4e8e-aa8f-e21d852a69a3';

    // 1. Fetch current
    const { data: agent } = await supabase.from('agents').select('*').eq('id', AGENT_ID).single();

    if (agent && agent.dna_config) {
        let newDna = { ...agent.dna_config };

        // Fix Personality Description
        if (newDna.personality && newDna.personality.description) {
            console.log(`Current Description: "${newDna.personality.description}"`);
            newDna.personality.description = newDna.personality.description.replace('Ana', 'Julia');
            console.log(`New Description: "${newDna.personality.description}"`);
        }

        // Ensure Identity block matches
        if (!newDna.identity) {
            newDna.identity = {};
        }
        newDna.identity.name = "Julia";
        // company is kept undefined (generic)

        // Update
        const { error } = await supabase
            .from('agents')
            .update({ dna_config: newDna })
            .eq('id', AGENT_ID);

        if (error) console.error('Error updating:', error);
        else console.log('✅ Identity Harmonized: Ana -> Julia');
    }
    process.exit(0);
}

run();
