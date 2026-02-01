require('dotenv').config();
const { configureContainer } = require('../container');

async function run() {
    console.log('🚀 Forcing LIVE Mode...');
    const container = configureContainer(); // Initialize DI
    const supabase = container.resolve('supabaseAdmin');

    const EMAIL = 'luisdaviferrer@gmail.com';
    const CAMPAIGN_NAME = 'Campanha Teste Real Link';

    // 1. Accept Security Protocols - SKIPPED (Column missing)
    /*
    console.log(`🛡️ Accepting security protocols for ${EMAIL}...`);
    const { data: user, error: userError } = await supabase
        .from('profiles')
        .update({ safety_accepted_at: new Date().toISOString() })
        .eq('email', EMAIL)
        .select()
        .single();
    */
    console.log('⚠️ Skipping profile update (column missing)');

    // 2. Set Campaign to LIVE
    console.log(`🔴 Switching campaign "${CAMPAIGN_NAME}" to LIVE...`);
    const { data: campaign, error: campError } = await supabase
        .from('campaigns')
        .update({ mode: 'live', status: 'active' })
        .eq('name', CAMPAIGN_NAME)
        .select()
        .single();

    if (campError) {
        console.error('❌ Failed to update campaign:', campError);
        process.exit(1);
    }

    console.log(`✅ Campaign is now LIVE! (${campaign.id})`);
    console.log('👉 Ready for real-world WhatsApp testing.');

    process.exit(0);
}

run();
