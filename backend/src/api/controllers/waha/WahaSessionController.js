const { createClient } = require('@supabase/supabase-js');

class WahaSessionController {
    constructor(wahaClient, supabaseClient, billingService) {
        this.waha = wahaClient;
        this.supabase = supabaseClient;
        this.billingService = billingService;
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

            // 1. Fetch from DB (Source of Truth for UI)
            const userId = req.user?.id;
            const companyId = req.user?.profile?.company_id;
            const supabase = this._getRequestClient(req);

            if (!userId) {
                return res.json([]);
            }

            let query = supabase
                .from('sessions')
                .select('*');

            if (companyId) {
                query = query.or(`company_id.eq.${companyId},created_by.eq.${userId}`);
            } else {
                query = query.eq('created_by', userId);
            }

            const { data: dbSessions, error } = await query;

            if (error) {
                console.error('[WahaSessionController] DB Fetch Error:', error);
                throw error;
            }

            // 2. Background Sync with WAHA (Fire & Forget)
            // We return DB data immediately for speed/resilience.
            // If WAHA is up, we'll update DB statuses.
            this._syncSessionsWithWaha(all, dbSessions, req).catch(err => {
                console.warn('[WahaSessionController] Background Sync Failed (WAHA likely down):', err.message);
            });

            // 3. Return DB Sessions (UI won't break)
            res.json(dbSessions.map(s => ({
                name: s.session_name,
                status: s.status,
                config: s.config,
                me: s.me
            })));

        } catch (error) {
            console.error('[WahaSessionController] getSessions Critical Error:', error.message);
            res.status(500).json({ error: 'Failed to fetch sessions from DB' });
        }
    }

    /**
     * Helper to sync WAHA state to DB in background
     */
    async _syncSessionsWithWaha(all, dbSessions, req) {
        try {
            const wahaSessions = await this.waha.getSessions(all);
            const supabase = this._getRequestClient(req);

            for (const wSession of wahaSessions) {
                const match = dbSessions.find(ds => ds.session_name === wSession.name);

                if (match) {
                    if (match.status !== wSession.status) {
                        await supabase
                            .from('sessions')
                            .update({ status: wSession.status, updated_at: new Date() })
                            .eq('id', match.id);
                    }
                } else {
                    // Zombie Session Found (In WAHA, not in DB)
                    // Since DB is Source of Truth, remove from WAHA
                    console.log(`[WahaSessionController] Found Zombie Session: ${wSession.name}. Deleting from WAHA...`);
                    try {
                        await this.waha.deleteSession(wSession.name);
                    } catch (e) {
                        console.error(`[WahaSessionController] Failed to cleanup zombie ${wSession.name}`, e);
                    }
                }
            }
        } catch (e) {
            // Throwing here is caught by the caller's .catch()
            throw e;
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

            // --- INSTANCE LIMIT CHECK ---
            if (this.billingService && req.user?.profile?.company_id) {
                const companyId = req.user.profile.company_id;

                // 1. Get Plan Status
                const companyPlan = await this.billingService.getPlanStatus(req.user.id);
                const planName = companyPlan?.subscription_plan || 'starter';
                const config = this.billingService.getPlanConfig(planName);

                // 2. Count Active Sessions
                const supabase = this._getRequestClient(req);
                const { count, error } = await supabase
                    .from('sessions')
                    .select('*', { count: 'exact', head: true })
                    .eq('company_id', companyId);

                if (!error) {
                    if (count >= config.max_waha_instances) {
                        return res.status(403).json({
                            error: 'Instance Limit Reached',
                            message: `Your '${planName}' plan allows max ${config.max_waha_instances} WhatsApp instances. Upgrade to add more.`
                        });
                    }
                }
            }
            // -----------------------------

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

            // 1. Try to Delete from WAHA
            try {
                await this.waha.deleteSession(session);
            } catch (wahaError) {
                console.warn(`[WahaSessionController] Failed to delete from WAHA (likely offline). Proceeding to remove from DB. Error: ${wahaError.message}`);
            }

            // 2. Sync: Remove from DB always
            if (this.supabase) {
                const supabase = this._getRequestClient(req);
                await supabase.from('sessions').delete().eq('session_name', session);
            }

            res.json({ success: true, message: 'Session deleted' });
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
