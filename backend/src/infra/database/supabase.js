const { createClient } = require('@supabase/supabase-js');

// Relies on server.js to have loaded process.env
// But for safety/standalone usage, checks if loaded.
if (!process.env.SUPABASE_URL) {
    const path = require('path');
    require('dotenv').config({ path: path.resolve(__dirname, '../../../../.env') });
}

const sbUrl = process.env.SUPABASE_URL;
// Use SERVICE KEY for backend operations - this allows bypassing RLS and ensures
// the backend can perform administrative tasks and cross-tenant queries securely.
const sbKey = process.env.SUPABASE_SERVICE_KEY;

if (!sbUrl || !sbKey) {
    console.error(`[Supabase] CRITICAL: Missing credentials.`);
    console.error('URL:', sbUrl || 'MISSING');
    console.error('SERVICE KEY:', sbKey ? 'EXISTS' : 'MISSING');
    throw new Error('Supabase Credentials Missing');
}

console.log(`[Supabase] Connecting to: ${sbUrl}`);
console.log(`[Supabase] Using SERVICE KEY for server-side operations`);

const supabase = createClient(sbUrl, sbKey, {
    auth: { persistSession: false }
});

module.exports = supabase;
