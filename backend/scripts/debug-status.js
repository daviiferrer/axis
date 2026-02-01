require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const col = {
    cyan: (text) => `\x1b[36m${text}\x1b[0m`,
    green: (text) => `\x1b[32m${text}\x1b[0m`,
    red: (text) => `\x1b[31m${text}\x1b[0m`,
    yellow: (text) => `\x1b[33m${text}\x1b[0m`,
};

async function main() {
    console.log(col.cyan('--- DIAGNOSTICS ---'));

    // 1. Check Env
    console.log('Checking Environment...');
    console.log(`GEMINI_API_KEY: ${process.env.GEMINI_API_KEY ? col.green('OK') : col.red('MISSING')}`);
    console.log(`WAHA_API_URL: ${process.env.WAHA_API_URL || 'http://localhost:3000'}`);

    // 2. DB Connection
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

    // 3. Check Recent Messages
    console.log(col.yellow('\n--- Last 5 Messages in DB ---'));
    const { data: msgs, error: msgError } = await supabase
        .from('messages')
        .select('id, body, from_me, created_at, chat_id')
        .order('created_at', { ascending: false })
        .limit(5);

    if (msgError) console.error(col.red('Error fetching messages:'), msgError.message);
    else if (msgs.length === 0) console.log('No messages found.');
    else {
        msgs.forEach(m => {
            console.log(`[${new Date(m.created_at).toLocaleTimeString()}] ${m.from_me ? 'ME' : 'USER'}: ${m.body} (Chat: ${m.chat_id})`);
        });
    }

    // 4. Check Active Campaigns & Sessions
    console.log(col.yellow('\n--- Active Campaigns ---'));
    const { data: camps, error: campError } = await supabase
        .from('campaigns')
        .select('id, name, session_name, status')
        .eq('status', 'active');

    if (campError) console.error(col.red('Error fetching campaigns:'), campError.message);
    else if (camps.length === 0) console.log(col.red('NO ACTIVE CAMPAIGNS FOUND.'));
    else {
        camps.forEach(c => {
            console.log(`- ${col.green(c.name)} | Session: ${col.cyan(c.session_name)}`);
        });
    }

    process.exit(0);
}

main().catch(err => console.error(err));
