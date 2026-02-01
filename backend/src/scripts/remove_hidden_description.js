require('dotenv').config();
const { configureContainer } = require('../container');

async function run() {
    console.log('🧹 Removing Hidden Description Field...');
    const container = configureContainer(); // Initialize DI
    const supabase = container.resolve('supabaseAdmin');
    const AGENT_ID = 'a7531b67-40dc-4e8e-aa8f-e21d852a69a3'; // Julia

    const { data: agent } = await supabase.from('agents').select('*').eq('id', AGENT_ID).single();

    if (agent && agent.dna_config && agent.dna_config.personality) {
        let newDna = { ...agent.dna_config };

        // Remove description if it exists
        if (newDna.personality.description) {
            console.log(`Found Hidden Description: "${newDna.personality.description}"`);
            delete newDna.personality.description;
            console.log('🗑️  Description removed.');
        } else {
            console.log('✅ No description found.');
        }

        // Update
        const { error } = await supabase
            .from('agents')
            .update({ dna_config: newDna })
            .eq('id', AGENT_ID);

        if (error) console.error('Error updating:', error);
        else console.log('✅ Agent DNA clean. Driven by Enums only.');
    }
    process.exit(0);
}

run();
