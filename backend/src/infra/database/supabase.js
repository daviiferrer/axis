const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

// Ensure env vars are loaded if this file is required independently
dotenv.config();

const sbUrl = process.env.SUPABASE_URL;
const sbKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;

if (!sbUrl || !sbKey) {
    console.warn('[Supabase] Missing credentials in environment variables.');
}

const supabase = createClient(sbUrl, sbKey, {
    auth: { persistSession: false }
});

module.exports = supabase;
