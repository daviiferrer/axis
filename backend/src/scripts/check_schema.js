const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

console.log('Loading env from:', path.resolve(__dirname, '../../.env'));
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    console.log('Checking availability_slots schema...');

    // Insert a dummy row to check columns if empty, or just select
    // Easier: Try to select one row
    const { data, error } = await supabase
        .from('availability_slots')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error selecting:', error);
    } else {
        if (data.length > 0) {
            console.log('Keys found:', Object.keys(data[0]));
        } else {
            console.log('Table is empty. Cannot infer keys from data.');
            // Try to assume user_id works by making a dummy select
            const { error: userError } = await supabase.from('availability_slots').select('user_id').limit(1);
            if (!userError) console.log('✅ active: user_id column exists');
            else console.log('❌ user_id column missing');

            const { error: compError } = await supabase.from('availability_slots').select('company_id').limit(1);
            if (!compError) console.log('✅ active: company_id column exists');
            else console.log('❌ company_id column missing');
        }
    }
}

checkSchema();
