require('dotenv').config({ path: 'c:/Users/luisd/Documents/GitHub/ÁXIS/.env' });
const { createClient } = require('@supabase/supabase-js');

const sbUrl = process.env.SUPABASE_URL;
const sbKey = process.env.SUPABASE_KEY; // Force Anon Key

console.log('--- ANON KEY CHECK ---');
console.log('URL:', sbUrl);
console.log('Anon Key:', sbKey ? sbKey.substring(0, 10) + '...' : 'MISSING');

const supabase = createClient(sbUrl, sbKey);

async function check() {
    console.log('Attempting to connect with ANON KEY...');
    // Try to read system_settings. RLS might block, but connection should be established (no 401).
    const { data, error } = await supabase.from('system_settings').select('count');

    if (error) {
        console.log('Result:', error.message);
        console.log('Code:', error.code);
        // 401 = Invalid Key / Unauthorized (Authentication failed)
        // 403 = Forbidden (RLS block) -> This means Key IS VALID but user has no permission.
        if (error.message.includes('Invalid API key')) {
            console.error('VERDICT: Anon Key is INVALID.');
        } else {
            console.log('VERDICT: Anon Key is VALID (even if RLS blocked).');
        }
    } else {
        console.log('SUCCESS! Data accessed.');
        console.log('VERDICT: Anon Key is VALID.');
    }
}

check();
