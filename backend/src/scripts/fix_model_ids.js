require('dotenv').config();
const { configureContainer } = require('../container');
const { AgentModels } = require('../config/AgentModels');

async function run() {
    console.log('🔧 Fixing Agent Model IDs in Database...');
    const container = configureContainer(); // Initialize DI
    const supabase = container.resolve('supabaseAdmin');

    const { data: agents, error } = await supabase.from('agents').select('*');

    if (error) {
        console.error('❌ Error fetching agents:', error);
        process.exit(1);
    }

    const corrections = {
        'Gemini 2.5 Flash': AgentModels.GEMINI_2_5_FLASH,
        'Gemini 2.5 Flash-Lite': AgentModels.GEMINI_2_5_FLASH_LITE,
        'Gemini 3 Flash': AgentModels.GEMINI_3_FLASH_PREVIEW,
        'Gemini 3 Flash (Preview)': AgentModels.GEMINI_3_FLASH_PREVIEW,
        // Catch common typos or variations if any
    };

    let count = 0;

    for (const agent of agents) {
        const currentModel = agent.model;

        // Check if current model is one of the "Bad Names" (keys)
        if (corrections[currentModel]) {
            const correctId = corrections[currentModel];
            console.log(`⚠️  Fixing Agent "${agent.name}": "${currentModel}" -> "${correctId}"`);

            await supabase
                .from('agents')
                .update({ model: correctId })
                .eq('id', agent.id);
            count++;
        }
        // Also check if allow space (invalid)
        else if (currentModel && currentModel.includes(' ')) {
            console.log(`⚠️  Found suspicious model name with spaces: "${currentModel}" for agent "${agent.name}".`);
            // Determine best fallback?
            // Not touching unless explicitly known to avoid breaking logic? 
            // Logic: If it has "Lite", map to Lite ID. Else Flash.
            let fallback = AgentModels.GEMINI_2_5_FLASH;
            if (currentModel.toLowerCase().includes('lite')) fallback = AgentModels.GEMINI_2_5_FLASH_LITE;
            else if (currentModel.includes('3')) fallback = AgentModels.GEMINI_3_FLASH_PREVIEW;

            console.log(`    -> Converting to "${fallback}"`);
            await supabase.from('agents').update({ model: fallback }).eq('id', agent.id);
            count++;
        }
    }

    console.log(`✅ Fixed ${count} agents.`);
    process.exit(0);
}

run();
