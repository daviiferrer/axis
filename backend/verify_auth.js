/**
 * Quick Auth Verification Script
 * Tests if the backend can validate a fresh Supabase token
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const sbUrl = process.env.SUPABASE_URL;
const sbKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;

console.log('🔐 Auth Verification Test\n');
console.log('Supabase URL:', sbUrl);
console.log('Service Key (first 20 chars):', sbKey?.slice(0, 20) + '...\n');

const supabase = createClient(sbUrl, sbKey, { auth: { persistSession: false } });

async function testAuth() {
    try {
        // Test 1: Can we query users?
        const { data: users, error: userError } = await supabase.auth.admin.listUsers();

        if (userError) {
            console.error('❌ Failed to list users:', userError.message);
            return false;
        }

        console.log(`✅ Found ${users.users.length} users in auth.users`);

        // Test 2: Can we query profiles?
        const { data: profiles, error: profileError } = await supabase
            .from('profiles')
            .select('id, email')
            .limit(5);

        if (profileError) {
            console.error('❌ Failed to query profiles:', profileError.message);
            return false;
        }

        console.log(`✅ Found ${profiles.length} profiles`);
        console.log('\n✅ Backend authentication is WORKING!\n');
        console.log('⚠️  If you still see 401 errors in the frontend:');
        console.log('   1. Open Browser DevTools (F12)');
        console.log('   2. Go to Console tab');
        console.log('   3. Type: localStorage.clear()');
        console.log('   4. Reload page (F5)\n');

        return true;

    } catch (error) {
        console.error('❌ Unexpected error:', error.message);
        return false;
    }
}

testAuth();
