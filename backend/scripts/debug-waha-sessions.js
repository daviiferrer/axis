require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const WahaClient = require('./src/infra/clients/WahaClient'); // Attempt to use existing client if possible, or build raw request

const col = {
    cyan: (text) => `\x1b[36m${text}\x1b[0m`,
    green: (text) => `\x1b[32m${text}\x1b[0m`,
    red: (text) => `\x1b[31m${text}\x1b[0m`,
    yellow: (text) => `\x1b[33m${text}\x1b[0m`,
};

async function main() {
    console.log(col.cyan('--- WAHA SESSION DIAGNOSTICS ---'));

    const wahaUrl = process.env.WAHA_API_URL || 'http://localhost:3000';
    const wahaKey = process.env.WAHA_API_KEY;

    console.log(`Connecting to WAHA at: ${col.green(wahaUrl)}`);

    try {
        // We can't use WahaClient.getSessions because it might not implement it.
        // Let's do a raw fetch to /api/sessions which is standard WAHA endpoint
        const response = await fetch(`${wahaUrl}/api/sessions?all=true`, {
            headers: {
                'X-Api-Key': wahaKey,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
        }

        const sessions = await response.json();

        console.log(col.yellow(`\nFOUND ${sessions.length} ACTIVE SESSIONS ON WAHA:`));
        sessions.forEach(s => {
            console.log(`- Name: ${col.cyan(s.name)} | Status: ${s.status} | Me: ${s.me?.id || 'Unknown'}`);
        });

        // Now Check DB
        const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
        const { data: campaigns } = await supabase.from('campaigns').select('name, session_name').eq('status', 'active');

        console.log(col.yellow('\n--- DB ACTIVE CAMPAIGNS ---'));
        const activeDbSessions = new Set();
        campaigns.forEach(c => {
            console.log(`- Campaign: ${c.name} expects Session: ${col.red(c.session_name)}`);
            activeDbSessions.add(c.session_name);
        });

        // CROSS CHECK
        console.log(col.yellow('\n--- MISMATCH ANALYSIS ---'));
        sessions.forEach(s => {
            if (!activeDbSessions.has(s.name)) {
                console.log(col.red(`⚠️  WARNING: WAHA has session '${s.name}' but NO active campaign uses it.`));
            } else {
                console.log(col.green(`✅ Session '${s.name}' is correctly linked to an active campaign.`));
            }
        });

    } catch (err) {
        console.error(col.red('❌ FAILED TO CONNECT TO WAHA:'), err.message);
        console.error('Check if WAHA is running and accessible from this machine.');
    }
}

main().catch(err => console.error(err));
