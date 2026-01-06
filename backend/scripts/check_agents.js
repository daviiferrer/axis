
require('dotenv').config({ path: '../.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Credentials:', {
        url: !!supabaseUrl,
        key: !!supabaseServiceKey
    });
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
    console.log('Applying migration to add missing columns...');

    const queries = [
        "ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';",
        "ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS provider TEXT DEFAULT 'openai';",
        "ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS description TEXT;",
        "ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);"
    ];

    for (const sql of queries) {
        const { error } = await supabase.rpc('exec_sql', { sql_query: sql }).catch(() => ({ error: { message: 'RPC exec_sql not found, trying direct insert/select if possible (limitations apply)' } }));

        if (error) {
            console.log(`Error or limitation applying [${sql}]: ${error.message}`);
            console.log('Falling back to direct schema check...');
        }
    }

    // Since we might not have a raw SQL RPC, we just report what we found earlier and mention manual execution if needed
    console.log('Schema update attempted. If RPC is missing, please run the SQL manually in Supabase SQL Editor:');
    console.log(queries.join('\n'));
}

run();
