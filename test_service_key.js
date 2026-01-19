const { createClient } = require('@supabase/supabase-js');

const sbUrl = 'https://powqmddgrwarydmsrreu.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvd3FtZGRncndhcnlkbXNycmV1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNTk5NTYzMCwiZXhwIjoyMDUxNTcxNjMwfQ.XrfJZCMBc2bEDpGq1fBCjlJqXPMmn1pNXKpWQ9rkYhc';

const supabase = createClient(sbUrl, serviceKey);

async function test() {
    console.log('Testing Service Key...');
    const { data, error } = await supabase.from('profiles').select('count').limit(1);

    if (error) {
        console.error('Error:', error.message);
        if (error.message.includes('Invalid API key')) {
            console.log('RESULT: Service Key is INVALID');
        } else {
            console.log('RESULT: Key is valid but query failed (maybe table missing?):', error.message);
        }
    } else {
        console.log('RESULT: Service Key is VALID');
    }
}

test();
