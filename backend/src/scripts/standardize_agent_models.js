require('dotenv').config();
const { configureContainer } = require('../container');
const { AgentModels, SupportedModels } = require('../config/AgentModels');

async function run() {
    console.log('🔄 Standardizing Agent Models...');
    const container = configureContainer(); // Initialize DI
    const supabase = container.resolve('supabaseAdmin');

    // Get all agents
    const { data: agents, error } = await supabase
        .from('agents')
        .select('*');

    if (error) {
        console.error('❌ Error fetching agents:', error);
        process.exit(1);
    }

    const supportedIds = SupportedModels.map(m => m.id);
    console.log('📋 Supported Models:', supportedIds);

    let updatedCount = 0;

    for (const agent of agents) {
        // If agent model is NOT in supported list, update it
        if (!supportedIds.includes(agent.model)) {
            console.log(`⚠️ Agent "${agent.name}" uses legacy model "${agent.model}". Upgrading to "${AgentModels.GEMINI_2_5_FLASH}"...`);

            const { error: updateError } = await supabase
                .from('agents')
                .update({ model: AgentModels.GEMINI_2_5_FLASH })
                .eq('id', agent.id);

            if (updateError) {
                console.error(`❌ Failed to update agent "${agent.name}":`, updateError);
            } else {
                console.log(`✅ Agent "${agent.name}" upgraded.`);
                updatedCount++;
            }
        } else {
            console.log(`✅ Agent "${agent.name}" already fully compliant (${agent.model}).`);
        }
    }

    console.log(`\n🎉 Migration Complete. Updated ${updatedCount} agents.`);
    process.exit(0);
}

run();
