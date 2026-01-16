class WahaSessionController {
    constructor(wahaClient, supabase) {
        this.waha = wahaClient;
        this.supabase = supabase;
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

                let query = this.supabase
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

                // Passive Sync: Update DB status for all fetched sessions ensuring consistency
                // This handles cases where Waha changed state without a direct API call (e.g. crash, restart, scan complete)
                if (filtered.length > 0) {
                    process.nextTick(async () => {
                        try {
                            for (const s of filtered) {
                                await this.supabase
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
                    const { data: company, error } = await this.supabase
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
                const userId = req.user?.id;
                // AuthMiddleware attaches profile to req.user.profile
                const companyId = req.user.profile?.company_id;

                // Check if it already exists to avoid 500 on duplicate
                const { data: existing } = await this.supabase
                    .from('sessions')
                    .select('id')
                    .eq('session_name', sessionName)
                    .single();

                if (!existing) {
                    const { error } = await this.supabase
                        .from('sessions')
                        .insert({
                            session_name: sessionName,
                            status: 'STOPPED', // Default WAHA state usually
                            created_by: userId,
                            company_id: companyId
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
                await this.supabase
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
    async _updateDbStatus(sessionName, status) {
        if (!this.supabase || !sessionName) return;
        try {
            await this.supabase
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
                await this.supabase.from('sessions').delete().eq('session_name', session);
            }

            res.json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async startSession(req, res) {
        try {
            const { session } = req.params;
            const result = await this.waha.startSession(session);
            // Sync: WAHA usually returns { name: '...', status: 'STARTING' | 'WORKING' }
            await this._updateDbStatus(session, result.status || 'STARTING');
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async stopSession(req, res) {
        try {
            const { session } = req.params;
            const result = await this.waha.stopSession(session);
            // Sync: usually returns { name: '...', status: 'STOPPED' }
            await this._updateDbStatus(session, result.status || 'STOPPED');
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
            await this._updateDbStatus(session, result.status || 'LOGGED_OUT');
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
            await this._updateDbStatus(session, result.status || 'STARTING');
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = WahaSessionController;
