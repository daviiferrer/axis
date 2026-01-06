require('dotenv').config({ path: '../../.env' }); // relative to backend/
const { createClient } = require('@supabase/supabase-js');

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;

console.log(`URL: ${url}`);
console.log(`Key: ${key ? key.substring(0, 10) + '...' : 'MISSING'}`);

if (!url || !key) {
    console.error('Credentials missing');
    process.exit(1);
}

const supabase = createClient(url, key);
console.log('Client created.');
console.log('Type of supabase:', typeof supabase);
console.log('Keys:', Object.keys(supabase));
console.log('Has .from?', typeof supabase.from);

async function test() {
    try {
        console.log('Testing connection to system_settings...');
        const { data, error } = await supabase.from('system_settings').select('*').limit(1);
        if (error) {
            console.error('Error:', error);
        } else {
            console.log('Success! Data:', data);
        }
    } catch (e) {
        console.error('Exception:', e);
    }
}

test();
