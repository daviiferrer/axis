const { createClient } = require('@supabase/supabase-js');

class WahaSessionController {
    constructor(wahaClient, supabase) {
        this.waha = wahaClient;
        this.supabase = supabase;
    }

    /**
     * Creates a Supabase client scoped to the user's request if authorization header is present.
     * This ensures RLS policies are respected and allows the user to insert/update their own data.
     */
    _getRequestClient(req) {
        const authHeader = req.headers.authorization;
        // If we have an auth header, we create a new client that passes this header.
        // This makes Supabase treat the request as "authenticated" = RLS works.
        if (authHeader) {
            const sbUrl = process.env.SUPABASE_URL;
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
        // Fallback to the injected client (which might be the server/admin one or generic anon)
        return this.supabase;
    }

    async getSessions(req, res) {
        try {
            const all = req.query.all === 'true';

            // 1. Fetch raw sessions from WAHA
            const wahaSessions = await this.waha.getSessions(all);

            // 2. Filter by Company (Multi-tenancy)
            if (this.supabase && req.user) {
                // AuthMiddleware attaches profile to req.user.profile
                const companyId = req.user.profile?.company_id;
                const userId = req.user.id;
                const supabase = this._getRequestClient(req);

                let query = supabase
                    .from('sessions')
                    .select('session_name');

                if (companyId) {
                    // If user has company, allow company sessions OR own sessions
                    query = query.or(`company_id.eq.${companyId},created_by.eq.${userId}`);
                } else {
                    // If no company, only own sessions
                    query = query.eq('created_by', userId);
                }

                const { data: allowedSessions, error } = await query;

                if (error) {
                    console.error('[WahaSessionController] Failed to fetch allowed sessions:', error);
                    return res.json([]);
                }

                const allowedNames = new Set(allowedSessions.map(s => s.session_name));

                // Filter
                // Filter
                const filtered = wahaSessions.filter(s => allowedNames.has(s.name));

                if (filtered.length > 0) {
                    process.nextTick(async () => {
                        try {
                            const supabase = this._getRequestClient(req);
                            for (const s of filtered) {
                                await supabase
                                    .from('sessions')
                                    .update({ status: s.status, updated_at: new Date() })
                                    .eq('session_name', s.name);
                            }
                        } catch (syncErr) {
                            console.error('[WahaSessionController] Passive sync failed:', syncErr);
                        }
                    });
                }

                return res.json(filtered);
            }

            // Fallback for dev/no-auth (Shouldn't happen in prod with authMiddleware)
            // But if we are here and have no user context, it's safer to return NOTHING or only PUBLIC sessions?
            // To be safe: return empty array if no user context is present.
            return res.json([]);

        } catch (error) {
            console.error('[WahaSessionController] getSessions Error:', error.message);
            const status = error.message.includes('WAHA Connection Error') ? 503 : 500;
            res.status(status).json({
                error: error.message,
                hint: 'Please ensure the WAHA service is running via Docker.'
            });
        }
    }

    async getSession(req, res) {
        try {
            const result = await this.waha.getSession(req.params.session);
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async getSessionMe(req, res) {
        try {
            const result = await this.waha.getSessionMe(req.params.session);
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async createSession(req, res) {
        try {
            // 1. Determine Session Name
            let sessionName = req.body.name;

            // If no name provided (or default), try to use Company Name
            if ((!sessionName || sessionName === 'default') && this.supabase && req.user?.profile?.company_id) {
                try {
                    const supabase = this._getRequestClient(req);
                    const { data: company, error } = await supabase
                        .from('companies')
                        .select('name')
                        .eq('id', req.user.profile.company_id)
                        .maybeSingle(); // Use maybeSingle to avoid error if not found

                    if (company && company.name) {
                        sessionName = company.name;
                    }
                } catch (dbError) {
                    console.error('[WahaSessionController] Failed to fetch company name:', dbError);
                    // Continue with default name if DB fails
                }
            }

            if (!sessionName) sessionName = 'default';

            // Sanitize name: replace spaces and special chars with underscores
            // WAHA typically requires [a-zA-Z0-9_-]
            sessionName = sessionName.replace(/[^a-zA-Z0-9_-]/g, '_');

            const payload = { ...req.body, name: sessionName };

            let result;

            // 1. Try to Create in WAHA
            try {
                result = await this.waha.createSession(payload);
            } catch (wahaError) {
                // If session already exists (likely 409 or specific error), we proceed to ensure DB sync.
                // We'll treat it as success for the purpose of the flow, but log it.
                if (wahaError.message && (wahaError.message.includes('409') || wahaError.message.includes('already exists'))) {
                    console.log(`[WahaSessionController] Session '${sessionName}' already exists in WAHA. Syncing with DB...`);
                    result = { name: sessionName, status: 'STOPPED' }; // Fallback result
                } else {
                    throw wahaError; // Re-throw other errors
                }
            }

            // 2. Persist in Supabase (Upsert/Check)
            if (this.supabase) {
                const supabase = this._getRequestClient(req);
                const userId = req.user?.id;
                // AuthMiddleware attaches profile to req.user.profile
                const companyId = req.user.profile?.company_id;

                // Check if it already exists to avoid 500 on duplicate
                const { data: existing } = await supabase
                    .from('sessions')
                    .select('id')
                    .eq('session_name', sessionName)
                    .single();

                if (!existing) {
                    const { error } = await supabase
                        .from('sessions')
                        .insert({
                            session_name: sessionName,
                            status: 'STOPPED', // Default WAHA state usually
                            created_by: userId,
                            company_id: companyId,
                            user_id: userId
                        });

                    if (error) {
                        console.error('[WahaSessionController] Failed to persist session:', error);
                    }
                } else {
                    // Optional: Update owner/company if needed, or just touch updated_at
                    // For now, we assume if it exists, it's fine.
                    console.log(`[WahaSessionController] Session '${sessionName}' already exists in DB.`);
                }
            }

            res.json(result);
        } catch (error) {
            console.error('[WahaSessionController] createSession Error:', error);
            res.status(500).json({ error: error.message });
        }
    }

    async updateSession(req, res) {
        try {
            const result = await this.waha.updateSession(req.params.session, req.body);

            // Sync status if present
            if (this.supabase && req.body.status) {
                const supabase = this._getRequestClient(req);
                await supabase
                    .from('sessions')
                    .update({ status: req.body.status, updated_at: new Date() })
                    .eq('session_name', req.params.session);
            }

            res.json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    // --- Helper for DB Sync ---
    async _updateDbStatus(sessionName, status, client = null) {
        const db = client || this.supabase;
        if (!db || !sessionName) return;
        try {
            await db
                .from('sessions')
                .update({ status: status, updated_at: new Date() })
                .eq('session_name', sessionName);
        } catch (e) {
            console.error(`[WahaSessionController] Failed to sync status for ${sessionName}:`, e);
        }
    }

    async deleteSession(req, res) {
        try {
            const { session } = req.params;
            const result = await this.waha.deleteSession(session);

            // Sync: Remove from DB
            if (this.supabase) {
                const supabase = this._getRequestClient(req);
                await supabase.from('sessions').delete().eq('session_name', session);
            }

            res.json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async startSession(req, res) {
        try {
            const { session } = req.params;
            console.log(`🚀 [WahaSession] Attempting to start/recover session: ${session}`);

            // 1. Check current status in WAHA
            try {
                const current = await this.waha.getSession(session);
                if (current.status === 'FAILED' || current.status === 'STOPPED') {
                    console.log(`🛠️ [WahaSession] Session ${session} is ${current.status}. Forcing recovery (Stop -> Start)...`);
                    await this.waha.stopSession(session).catch(() => { });
                }
            } catch (e) {
                console.warn(`⚠️ [WahaSession] Could not check status before start: ${e.message}`);
            }

            const result = await this.waha.startSession(session);

            // Sync status to DB
            const supabase = this._getRequestClient(req);
            await this._updateDbStatus(session, result.status || 'STARTING', supabase);

            console.log(`✅ [WahaSession] Start command sent for ${session}. New status: ${result.status}`);
            res.json(result);
        } catch (error) {
            console.error(`❌ [WahaSession] Start FAILED for ${session}:`, error.message);
            res.status(500).json({ error: error.message });
        }
    }

    async stopSession(req, res) {
        try {
            const { session } = req.params;
            const result = await this.waha.stopSession(session);
            // Sync: usually returns { name: '...', status: 'STOPPED' }
            const supabase = this._getRequestClient(req);
            await this._updateDbStatus(session, result.status || 'STOPPED', supabase);
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async logoutSession(req, res) {
        try {
            const { session } = req.params;
            const result = await this.waha.logoutSession(session);
            // Sync: usually returns { name: '...', status: 'LOGGED_OUT' } or similar?
            const supabase = this._getRequestClient(req);
            await this._updateDbStatus(session, result.status || 'LOGGED_OUT', supabase);
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async restartSession(req, res) {
        try {
            const { session } = req.params;
            const result = await this.waha.restartSession(session);
            // Sync: usually returns { name: '...', status: 'STARTING' }
            const supabase = this._getRequestClient(req);
            await this._updateDbStatus(session, result.status || 'STARTING', supabase);
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = WahaSessionController;
