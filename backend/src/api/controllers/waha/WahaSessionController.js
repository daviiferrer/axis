const { createClient } = require('@supabase/supabase-js');
const logger = require('../../../shared/Logger').createModuleLogger('waha-session');
const SettingsService = require('../../../core/services/system/SettingsService');

class WahaSessionController {
    constructor({ wahaClient, supabase, billingService }) {
        this.waha = wahaClient;
        this.supabase = supabase;
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
                logger.error({ error: error.message }, 'DB fetch error');
                throw error;
            }

            // 2. Background Sync with WAHA (Fire & Forget)
            // We return DB data immediately for speed/resilience.
            // If WAHA is up, we'll update DB statuses.
            this._syncSessionsWithWaha(all, dbSessions, req).catch(err => {
                logger.warn({ error: err.message }, 'Background sync failed (WAHA likely down or unreachable)');
            });

            // 3. Return DB Sessions (UI won't break)
            res.json(dbSessions.map(s => ({
                name: s.session_name,
                status: s.status,
                config: s.config,
                me: s.me
            })));

        } catch (error) {
            logger.error({ error: error.message }, 'getSessions critical error');
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

            // 1. Update DB from WAHA State & Detect Zombies
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
                    // Zombie Session: Exists in WAHA but not in DB
                    // Since DB is Source of Truth, remove from WAHA
                    logger.info({ session: wSession.name }, 'Zombie session found, deleting from WAHA');
                    try {
                        await this.waha.deleteSession(wSession.name);
                    } catch (e) {
                        logger.error({ session: wSession.name, error: e.message }, 'Failed to cleanup zombie');
                    }
                }
            }

            // 2. Detect Lost Sessions: Exists in DB but not in WAHA
            // If DB says STARTING/WORKING but WAHA doesn't have it, it failed or was lost.
            for (const dbSession of dbSessions) {
                const found = wahaSessions.find(ws => ws.name === dbSession.session_name);
                if (!found && dbSession.status !== 'STOPPED' && dbSession.status !== 'FAILED') {
                    // Verify strictly that it SHOULD be there (e.g. not in middle of creation)
                    // But here we are in a sync loop. If it's not in WAHA payload, it's not running.
                    logger.warn({ session: dbSession.session_name, currentStatus: dbSession.status }, 'Session missing in WAHA, marking as STOPPED');
                    await supabase
                        .from('sessions')
                        .update({ status: 'STOPPED', updated_at: new Date() })
                        .eq('id', dbSession.id);
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
                    logger.error({ error: dbError.message }, 'Failed to fetch company name');
                    // Continue with default name if DB fails
                }
            }

            if (!sessionName) sessionName = 'default';

            // Sanitize name: replace spaces and special chars with underscores
            // WAHA typically requires [a-zA-Z0-9_-]
            sessionName = sessionName.replace(/[^a-zA-Z0-9_-]/g, '_');

            const payload = { ...req.body, name: sessionName };

            // --- WEBHOOK CONFIGURATION (Dynamic) ---
            try {
                let webhookUrl = process.env.WAHA_WEBHOOK_URL;
                // Try to get from DB System Settings
                const settingsService = new SettingsService({ supabaseClient: this.supabase });
                // Use user ID if available, or just rely on service finding global
                const settings = await settingsService.getSettings(req.user?.id);

                if (settings && settings.waha_webhook_url) {
                    webhookUrl = settings.waha_webhook_url;
                }

                // Default if missing (User Requirement for VPS/Docker)
                if (!webhookUrl) {
                    webhookUrl = 'http://host.docker.internal:8000/api/v1/webhook/waha';
                }

                // Inject into payload
                if (!payload.config) payload.config = {};
                if (!payload.config.webhooks) {
                    logger.info({ session: sessionName, url: webhookUrl }, 'Injecting Webhook Configuration');
                    payload.config.webhooks = [{
                        url: webhookUrl,
                        events: ['message', 'message.ack', 'message.revoked', 'session.status']
                    }];
                }
            } catch (configError) {
                logger.warn({ error: configError.message }, 'Failed to inject webhook config, using defaults');
            }
            // ----------------------------------------

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
                    logger.debug({ session: sessionName }, 'Session already exists in WAHA, syncing with DB');
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
                        logger.error({ error: error.message }, 'Failed to persist session');
                    }
                } else {
                    // Optional: Update owner/company if needed, or just touch updated_at
                    // For now, we assume if it exists, it's fine.
                    logger.debug({ session: sessionName }, 'Session already exists in DB');
                }
            }

            res.json(result);
        } catch (error) {
            logger.error({ error: error.message }, 'createSession error');
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
            logger.error({ session: sessionName, error: e.message }, 'Failed to sync status');
        }
    }

    async deleteSession(req, res) {
        try {
            const { session } = req.params;

            // 1. Try to Delete from WAHA
            try {
                await this.waha.deleteSession(session);
                logger.info({ session }, 'Deleted session from WAHA');
            } catch (wahaError) {
                // If 404, it's already gone, which is fine.
                if (wahaError.message && wahaError.message.includes('404')) {
                    logger.debug({ session }, 'Session not found in WAHA, proceeding to DB delete');
                } else {
                    logger.warn({ session, error: wahaError.message }, 'Failed to delete from WAHA (likely offline or error), proceeding to DB delete');
                }
            }

            // 2. Sync: Remove from DB always
            if (this.supabase) {
                const supabase = this._getRequestClient(req);
                const { error } = await supabase.from('sessions').delete().eq('session_name', session);

                if (error) {
                    logger.error({ session, error: error.message }, 'Failed to delete session from DB');
                    throw new Error(`DB Delete Error: ${error.message}`);
                }
            }

            res.json({ success: true, message: 'Session deleted' });
        } catch (error) {
            logger.error({ session: req.params.session, error: error.message }, 'deleteSession critical error');
            res.status(500).json({ error: error.message });
        }
    }

    async startSession(req, res) {
        try {
            const { session } = req.params;
            logger.info({ session }, 'Attempting to start/recover session');

            // 1. Check current status in WAHA
            try {
                const current = await this.waha.getSession(session);
                if (current.status === 'FAILED' || current.status === 'STOPPED') {
                    logger.info({ session, status: current.status }, 'Forcing recovery (Stop -> Start)');
                    await this.waha.stopSession(session).catch(() => { });
                }
            } catch (e) {
                logger.warn({ session, error: e.message }, 'Could not check status before start');
            }

            const result = await this.waha.startSession(session);

            // Sync status to DB
            const supabase = this._getRequestClient(req);
            await this._updateDbStatus(session, result.status || 'STARTING', supabase);

            logger.info({ session, status: result.status }, 'Start command sent');
            res.json(result);
        } catch (error) {
            // Check for 404 - Session not found in WAHA
            if (error.response?.status === 404 || error.message.includes('404')) {
                logger.warn({ session: req.params.session }, 'Session not found in WAHA (404), cannot start.');
                return res.status(404).json({
                    error: 'Session not found',
                    message: 'This session does not exist in the engine. Please create it first.'
                });
            }

            logger.error({ session: req.params.session, error: error.message }, 'Start failed');
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
            // Graceful 404
            if (error.response?.status === 404) {
                return res.status(404).json({ error: 'Session not found' });
            }
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
            // Graceful 404
            if (error.response?.status === 404) {
                return res.status(404).json({ error: 'Session not found' });
            }
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
            // Graceful 404
            if (error.response?.status === 404) {
                return res.status(404).json({ error: 'Session not found' });
            }
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = WahaSessionController;
