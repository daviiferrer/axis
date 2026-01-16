const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const dotenv = require('dotenv');

// Explicitly load root .env to ensure credentials are found
const rootEnvPath = path.resolve(__dirname, '../../../../.env');
dotenv.config({ path: rootEnvPath });

const sbUrl = process.env.SUPABASE_URL;
const sbKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;

if (!sbUrl || !sbKey) {
    console.error(`[Supabase] CRITICAL: Missing credentials. Tried loading from: ${rootEnvPath}`);
    console.error(`[Supabase] URL: ${sbUrl}, Key Exists: ${!!sbKey}`);
    throw new Error('Supabase Credentials Missing');
} else {
    console.log(`[Supabase] Initializing with URL: ${sbUrl}`);
    console.log(`[Supabase] Using Key (first 10 chars): ${sbKey.substring(0, 10)}...`);
}

const supabase = createClient(sbUrl, sbKey, {
    auth: { persistSession: false }
});

module.exports = supabase;
