
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

// Path to root .env (Up 2 levels: scripts -> backend -> root)
const envPath = path.resolve(__dirname, '../../.env');

if (fs.existsSync(envPath)) {
    require('dotenv').config({ path: envPath });
} else {
    console.warn('Warning: .env file not found at:', envPath);
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Error: Missing SUPABASE_URL or SUPABASE_SERVICE_KEY/SUPABASE_KEY in .env');
    console.error('Checked path:', envPath);
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function initSessionTable() {
    console.log('Initializing user_sessions table logic...');

    // SQL to create the table
    const createTableSQL = `
        CREATE TABLE IF NOT EXISTS user_sessions (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES auth.users(id),
            session_name TEXT NOT NULL UNIQUE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
        );
        CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
    `;

    console.log('----------------------------------------------------------------');
    console.log('Please run the following SQL in your Supabase SQL Editor to enable Session Isolation:');
    console.log(createTableSQL);
    console.log('----------------------------------------------------------------');

    // Attempt verification
    const { error } = await supabase.from('user_sessions').select('count', { count: 'exact', head: true });

    if (error && error.code === '42P01') {
        console.log('Current Status: Table "user_sessions" does NOT exist yet.');
    } else if (!error) {
        console.log('Current Status: Table "user_sessions" ALREADY exists. Good to go!');
    } else {
        console.log('Current Status: Unable to verify table existence (Permissions/Error).');
        console.error('Details:', error.message);
    }
}

initSessionTable();
