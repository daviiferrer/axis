const { createClient } = require('@supabase/supabase-js');

/**
 * Creates a Supabase client scoped to the user's request.
 * This client passes the user's JWT Authorization header to Supabase/Postgres,
 * enabling Row Level Security (RLS) policies to work correctly.
 * 
 * @param {Request} req - The Express request object
 * @param {Object} defaultClient - The default admin/service client to fallback to (optional)
 * @returns {SupabaseClient} - The scoped client or the default client
 */
function getRequestClient(req, defaultClient = null) {
    const authHeader = req.headers.authorization;

    if (authHeader) {
        const sbUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
        const sbKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;

        return createClient(sbUrl, sbKey, {
            global: {
                headers: {
                    Authorization: authHeader
                }
            },
            auth: {
                persistSession: false,
                autoRefreshToken: false,
                detectSessionInUrl: false
            }
        });
    }

    return defaultClient;
}

module.exports = { getRequestClient };
