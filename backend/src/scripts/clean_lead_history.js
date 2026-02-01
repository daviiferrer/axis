require('dotenv').config();
const { configureContainer } = require('../container');

async function run() {
    const container = configureContainer(); // Initialize DI
    const supabase = container.resolve('supabaseAdmin');
    const CHAT_ID = '555199794450@s.whatsapp.net';
    const AGENT_ID = 'a7531b67-40dc-4e8e-aa8f-e21d852a69a3'; // Julia

    console.log(`🧹 Cleaning history for ${CHAT_ID}...`);

    // 1. Delete Messages (Context Reset)
    const { error: delError, count } = await supabase
        .from('messages')
        .delete()
        .eq('chat_id', CHAT_ID);

    if (delError) console.error('❌ Error deleting messages:', delError);
    else console.log(`✅ Message History wiped.`);

    // 2. Sanitize Agent Company
    console.log('🧬 Sanitizing Agent Company Identity...');
    const { data: agent, error } = await supabase.from('agents').select('*').eq('id', AGENT_ID).single();

    if (agent && agent.dna_config) {
        const newDna = { ...agent.dna_config };

        // Ensure identity exists
        if (!newDna.identity) newDna.identity = { name: "Julia" };

        // REMOVE 'ÁXIS' explicit or implicit
        newDna.identity.company = "Sua Empresa"; // Generic Default instead of null (null might trigger fallback)
        // Or better: Let it be dynamic.
        delete newDna.identity.company;

        // Update Agent
        const { error: updateError } = await supabase
            .from('agents')
            .update({
                dna_config: newDna
            })
            .eq('id', AGENT_ID);

        if (updateError) console.error('❌ Error updating agent:', updateError);
        else console.log('✅ Agent sanitized (Company removed from DNA & Context).');
    } else {
        console.log('❌ Agent not found to sanitize.');
    }

    process.exit(0);
}

run();
