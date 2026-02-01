require('dotenv').config();
const { configureContainer } = require('../container');

async function run() {
    console.log('🕵️ Inspecting Campaign "Central de Triagem"...');
    const container = configureContainer();
    const supabase = container.resolve('supabaseAdmin');

    const { data: campaigns, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('name', 'Central de Triagem');

    if (error) {
        console.error('Error:', error);
        return;
    }

    if (campaigns && campaigns.length > 0) {
        campaigns.forEach(c => {
            console.log(`\n🆔 ID: ${c.id}`);
            console.log(`📌 Name: ${c.name}`);
            console.log(`🏢 Company Name (DB Column): "${c.company_name}"`); // Check this field!
            console.log(`🏢 Company (JSON):`, JSON.stringify(c.company));
            console.log(`🧬 Session: ${c.waha_session_name}`);
        });
    } else {
        console.log('❌ No campaign found with that name.');
    }
    process.exit(0);
}

run();
