/**
 * FacebookAdsController - Meta Lead Ads Integration
 * 
 * Handles:
 * 1. OAuth flow (Login -> Callback -> Token)
 * 2. Page Management (List Pages, Subscribe App)
 * 3. Webhook Handling (Leadgen events -> Leads Table)
 */
const axios = require('axios');
const crypto = require('crypto');
const logger = require('../../../shared/Logger').createModuleLogger('facebook-ads');

class FacebookAdsController {
    constructor(supabase, settingsService) {
        this.supabase = supabase;
        this.settingsService = settingsService;
        this.GRAPH_API_URL = 'https://graph.facebook.com';
    }

    /**
     * Helper: Get App Config
     */
    async #getAppConfig() {
        const appId = await this.settingsService.getMetaAppId();
        const appSecret = await this.settingsService.getMetaAppSecret();
        const apiVersion = await this.settingsService.getMetaApiVersion();

        if (!appId || !appSecret) {
            throw new Error('Meta App ID/Secret not configured in system settings');
        }
        return { appId, appSecret, apiVersion };
    }

    /**
     * 1. GET /login - Generate OAuth URL
     */
    async getLoginUrl(req, res) {
        try {
            const { appId, apiVersion } = await this.#getAppConfig();
            // Redirect URI must match exactly what's allowed in FB App settings
            // We use the backend callback URL, or a frontend URL that calls backend
            // Let's assume frontend handles the redirect to this URL, or we return the URL
            const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/app/settings/integrations/facebook/callback`;
            const state = crypto.randomBytes(16).toString('hex');

            const scope = [
                'public_profile',
                'email',
                'pages_show_list',
                'pages_read_engagement',
                'pages_manage_metadata',
                'leads_retrieval',
                'ads_management'
            ].join(',');

            const url = `https://www.facebook.com/${apiVersion}/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=${scope}`;

            res.json({ url });
        } catch (error) {
            logger.error({ error: error.message }, 'Failed to generate login URL');
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * 2. POST /callback - Exchange code for token
     */
    async handleCallback(req, res) {
        try {
            const { code, redirectUri } = req.body;
            const userId = req.user.id;
            const { appId, appSecret, apiVersion } = await this.#getAppConfig();

            // 1. Exchange code for short-lived token
            const tokenRes = await axios.get(`${this.GRAPH_API_URL}/${apiVersion}/oauth/access_token`, {
                params: {
                    client_id: appId,
                    client_secret: appSecret,
                    redirect_uri: redirectUri,
                    code
                }
            });
            const shortLivedToken = tokenRes.data.access_token;

            // 2. Exchange for long-lived token
            const longTokenRes = await axios.get(`${this.GRAPH_API_URL}/${apiVersion}/oauth/access_token`, {
                params: {
                    grant_type: 'fb_exchange_token',
                    client_id: appId,
                    client_secret: appSecret,
                    fb_exchange_token: shortLivedToken
                }
            });
            const longLivedToken = longTokenRes.data.access_token;

            // 3. Get User Info (Ad Accounts & Pages will be fetched separately)
            // We store the user token temporarily or just return it to frontend
            // Better to store it associated with the user for future use?
            // For now, return it so frontend can call getPages
            res.json({ accessToken: longLivedToken });

        } catch (error) {
            logger.error({ error: error.response?.data || error.message }, 'OAuth callback failed');
            res.status(500).json({ error: 'Failed to authenticate with Facebook' });
        }
    }

    /**
     * 3. GET /pages - List Pages with Tasks
     */
    async getPages(req, res) {
        try {
            const { accessToken } = req.query; // Passed from frontend or DB
            const { apiVersion } = await this.#getAppConfig();

            if (!accessToken) return res.status(400).json({ error: 'Access Token required' });

            const pagesRes = await axios.get(`${this.GRAPH_API_URL}/${apiVersion}/me/accounts`, {
                params: {
                    access_token: accessToken,
                    fields: 'id,name,access_token,tasks,picture{url}'
                }
            });

            const pages = pagesRes.data.data;
            res.json({ pages });

        } catch (error) {
            logger.error({ error: error.response?.data || error.message }, 'Failed to list pages');
            res.status(500).json({ error: 'Failed to list Facebook Pages' });
        }
    }

    /**
     * 4. POST /pages/:id/subscribe - Connect Page & Subscribe Webhook
     */
    async subscribePage(req, res) {
        try {
            const { id: pageId } = req.params;
            const { pageAccessToken, userId: overrideUserId } = req.body;
            const userId = req.user.id;
            const { apiVersion } = await this.#getAppConfig();

            // 1. Subscribe App to Page (Enables Webhooks)
            // Need 'subscribed_fields' for leadgen
            await axios.post(`${this.GRAPH_API_URL}/${pageId}/subscribed_apps`, {
                subscribed_fields: ['leadgen'],
                access_token: pageAccessToken
            });

            // 2. Fetch Page Info
            const pageRes = await axios.get(`${this.GRAPH_API_URL}/${apiVersion}/${pageId}`, {
                params: { fields: 'name,id', access_token: pageAccessToken }
            });

            // 3. Save to database
            const { data, error } = await this.supabase
                .from('facebook_ad_accounts')
                .upsert({
                    user_id: userId,
                    page_id: pageId,
                    page_name: pageRes.data.name,
                    page_access_token: pageAccessToken,
                    subscribed_forms: ['leadgen'],
                    is_active: true,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'user_id,page_id' })
                .select()
                .single();

            if (error) throw error;

            res.json({ success: true, account: data });

        } catch (error) {
            logger.error({ error: error.response?.data || error.message }, 'Failed to subscribe page');
            res.status(500).json({ error: 'Failed to connect Facebook Page' });
        }
    }

    /**
     * 5. GET /webhook - Verification
     */
    async verifyWebhook(req, res) {
        try {
            const mode = req.query['hub.mode'];
            const token = req.query['hub.verify_token'];
            const challenge = req.query['hub.challenge'];

            // Get verification token from settings
            const { data: settings } = await this.supabase.from('system_settings').select('meta_webhook_verify_token').single();
            const verifyToken = settings?.meta_webhook_verify_token || process.env.META_WEBHOOK_VERIFY_TOKEN;

            if (mode && token) {
                if (mode === 'subscribe' && token === verifyToken) {
                    logger.info('Webhook verified');
                    res.status(200).send(challenge);
                } else {
                    res.sendStatus(403);
                }
            } else {
                res.sendStatus(400);
            }
        } catch (error) {
            logger.error({ error }, 'Webhook verification failed');
            res.sendStatus(500);
        }
    }

    /**
     * 6. POST /webhook - Event Handling
     */
    async handleWebhook(req, res) {
        try {
            // Signature verification (X-Hub-Signature-256) should be middleware, 
            // but for simplicity we assume it's valid or add logic here.

            const body = req.body;

            if (body.object === 'page') {
                for (const entry of body.entry) {
                    const pageId = entry.id;
                    const changes = entry.changes;

                    for (const change of changes) {
                        if (change.field === 'leadgen') {
                            await this.#processLeadgen(pageId, change.value);
                        }
                    }
                }
                res.status(200).send('EVENT_RECEIVED');
            } else {
                res.sendStatus(404);
            }
        } catch (error) {
            logger.error({ error: error.message }, 'Webhook handling failed');
            // Facebook retries on 500, but if it's a logic error we might want to return 200 to stop retry loop
            // For now, 500 triggers retry which is safer for data loss
            res.sendStatus(500);
        }
    }

    /**
     * Helper: Process Leadgen Event
     */
    async #processLeadgen(pageId, value) {
        const { leadgen_id, form_id, created_time } = value;

        logger.info({ leadgen_id, form_id, pageId }, 'Processing new Facebook Lead');

        // 1. Find User/Account associated with this Page
        const { data: account, error } = await this.supabase
            .from('facebook_ad_accounts')
            .select('*')
            .eq('page_id', pageId)
            .eq('is_active', true)
            .single();

        if (error || !account) {
            logger.warn({ pageId }, 'No active account found for page webhook');
            return;
        }

        // 2. Fetch Lead Details from Graph API
        const { apiVersion } = await this.#getAppConfig();
        const leadRes = await axios.get(`${this.GRAPH_API_URL}/${apiVersion}/${leadgen_id}`, {
            params: { access_token: account.page_access_token }
        });
        const leadData = leadRes.data;

        // 3. Fetch Form Details (for Ad info)
        let adInfo = {};
        try {
            // Usually we get ad_id, adset_id etc from lead data if available
            // Or we fetch form details
        } catch (e) { /* ignore extra info errors */ }

        // 4. Map Field Data
        const fieldData = leadData.field_data || [];
        const mappedData = {};
        fieldData.forEach(field => {
            mappedData[field.name] = field.values[0];
        });

        // 5. Create Lead in 'leads' table
        // Find basic fields
        const name = mappedData.full_name || mappedData.first_name + ' ' + mappedData.last_name || 'Lead Facebook';
        const phone = mappedData.phone_number || mappedData.phone;
        const email = mappedData.email;

        // Clean phone number (simple cleanup)
        const cleanPhone = phone ? phone.replace(/\D/g, '') : null;

        const { error: insertError } = await this.supabase
            .from('leads')
            .insert({
                user_id: account.user_id,
                name: name,
                phone: cleanPhone,
                status: 'new',
                source: 'facebook_ads',
                ad_source_id: leadgen_id,
                ad_headline: mappedData.platform || 'fb', // or form name
                ad_body: `Form: ${form_id}`,
                custom_fields: { ...mappedData, form_id, page_id: pageId },
                created_at: new Date(created_time * 1000).toISOString()
            });

        if (insertError) {
            logger.error({ error: insertError, leadgen_id }, 'Failed to insert lead from Facebook');
        } else {
            logger.info({ leadgen_id, user_id: account.user_id }, 'Facebook Lead successfully saved');

            // Trigger Workflow / Campaign logic here?
            // Usually the database trigger or a separate service watches 'leads' table
            // Or we can invoke the CampaignService directly if we want instant reaction
        }
    }
}

module.exports = FacebookAdsController;
