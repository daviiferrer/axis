const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');

class SupabaseClientFactory {
    constructor() {
        // ADMIN KEY (Service Role) - Bypasses RLS
        this.adminKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.SERVICE_ROLE_KEY;

        // CLIENT KEY (Anon) - Respects RLS
        this.anonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        this.supabaseUrl = process.env.SUPABASE_URL;

        if (!this.supabaseUrl) {
            throw new Error('[SupabaseClientFactory] Missing SUPABASE_URL');
        }

        if (!this.adminKey) {
            console.warn('⚠️ [SupabaseClientFactory] Missing SUPABASE_SERVICE_ROLE_KEY. Admin operations may fail.');
        }

        if (!this.anonKey) {
            throw new Error('❌ [SupabaseClientFactory] Missing SUPABASE_ANON_KEY. Cannot start safely (RLS Security Risk).');
        }
    }

    /**
     * Creates a Supabase client for a specific user.
     * Uses ANON KEY + User Token.
     * Enforces RLS Policies.
     */
    createClientForUser(token) {
        if (!token) throw new Error('Token required for user client');

        return createClient(this.supabaseUrl, this.anonKey, {
            global: {
                headers: { Authorization: `Bearer ${token}` }
            },
            auth: {
                persistSession: false,
                autoRefreshToken: false,
                detectSessionInUrl: false
            }
        });
    }

    /**
     * Creates a Supabase client with FULL ADMIN PRIVILEGES.
     * Uses SERVICE ROLE KEY.
     * Bypasses RLS.
     */
    createAdminClient() {
        if (!this.adminKey) {
            throw new Error('Cannot create Admin Client: No Service Role Key configured.');
        }

        return createClient(this.supabaseUrl, this.adminKey, {
            auth: {
                persistSession: false,
                autoRefreshToken: false,
                detectSessionInUrl: false
            }
        });
    }
}

module.exports = { SupabaseClientFactory };
