require('dotenv').config({ path: '../../.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function checkCampaigns() {
    console.log('🔍 Checking Active Campaigns for Session Routing...');

    const { data: campaigns, error } = await supabase
        .from('campaigns')
        .select('id, name, status, graph, user_id')
        .eq('status', 'active');

    if (error) {
        console.error('❌ Error fetching campaigns:', error);
        return;
    }

    console.log(`📊 Found ${campaigns.length} Active Campaigns.`);

    let found = false;
    campaigns.forEach(c => {
        const trigger = c.graph?.nodes?.find(n => n.type === 'trigger');
        if (trigger) {
            const session = trigger.data?.sessionName;
            console.log(`   - Campaign: "${c.name}" (ID: ${c.id})`);
            console.log(`     User ID: ${c.user_id}`);
            console.log(`     Trigger Node: ✅ Found`);
            console.log(`     Configured Session: "${session}"`);

            if (session === 'testee') {
                found = true;
                console.log(`     🎯 MATCH! This campaign should receive messages for "testee".`);
            }
        } else {
            console.log(`   - Campaign: "${c.name}" (ID: ${c.id}) - ⚠️ No Trigger Node`);
        }
    });

    if (!found) {
        console.log('\n❌ PROBLEM CONFIRMED: No active campaign has sessionName = "testee".');
    } else {
        console.log('\n✅ DB STATE OK: Campaign routing is correctly configured in the database.');
    }
}

checkCampaigns();
