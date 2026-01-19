
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { createClient } = require('@supabase/supabase-js');

const sbUrl = process.env.SUPABASE_URL;
const sbKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;

console.log('--- SUPABASE CONNECTIVITY TEST ---');
console.log('URL:', sbUrl);
console.log('Key Length:', sbKey ? sbKey.length : 'MISSING');

if (!sbUrl || !sbKey) {
    console.error('❌ Credentials missing in .env');
    process.exit(1);
}

const supabase = createClient(sbUrl, sbKey, {
    auth: { persistSession: false }
});

async function testConnection() {
    console.log('Attempting to fetch a single row from "chats"...');
    const start = Date.now();
    try {
        const { data, error } = await supabase.from('chats').select('*').limit(1);
        const duration = Date.now() - start;

        if (error) {
            console.error('❌ Supabase Query Failed:', error.message);
            console.error('Details:', error);
        } else {
            console.log(`✅ Success! Request took ${duration}ms`);
            console.log('Data found:', data ? data.length : 0, 'rows');
        }
    } catch (e) {
        console.error('❌ EXCEPTION (Likely Network/Fetch Error):', e.message);
        console.error('Cause:', e.cause);
        console.error('Stack:', e.stack);
    }
}

testConnection();
