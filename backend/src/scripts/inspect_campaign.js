require('dotenv').config();
const { configureContainer } = require('../container');

async function run() {
    console.log('🕵️ Inspecting Campaign "Central de Triagem"...');
    const container = configureContainer();
    const supabase = container.resolve('supabaseAdmin');
    const CAMPAIGN_ID = '412b966c-40ed-427e-8c8b-51b1e42f8937'; // From earlier log

    const { data: campaign, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', CAMPAIGN_ID)
        .single();

    if (error) {
        console.error(error);
        process.exit(1);
    }

    console.log('--- CAMPAIGN CONFIG ---');
    console.log(`ID: ${campaign.id}`);
    console.log(`Name: ${campaign.name}`);
    console.log(`Company Name (DB): ${campaign.company_name}`);
    console.log(`Company (DB Field): ${campaign.company}`);
    console.log(`Description: ${campaign.description}`);

    process.exit(0);
}

run();
