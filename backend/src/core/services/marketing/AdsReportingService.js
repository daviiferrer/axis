/**
 * AdsReportingService - The ROI Engine
 * 
 * Responsibilities:
 * 1. Send Conversion Events to Meta CAPI (Server-Side).
 * 2. Hash sensitive data (SHA-256) before sending.
 * 3. Track ROI metrics locally.
 */
const crypto = require('crypto');
const axios = require('axios');
const logger = require('../../../shared/Logger').createModuleLogger('ads-reporting');

class AdsReportingService {
    constructor(supabaseClient) {
        this.supabase = supabaseClient;
        this.META_API_VERSION = 'v18.0';
    }

    /**
     * Reports a High-Value Action (Conversion) to Ad Platforms.
     * @param {string} leadId - The converted lead
     * @param {string} eventName - 'Purchase', 'Schedule', 'Lead', 'CompleteRegistration'
     * @param {number} value - Discovery value (optional)
     */
    async reportConversion(leadId, eventName, value = 0) {
        try {
            // 1. Fetch Lead & Campaign Ad Data
            const { data: lead, error } = await this.supabase
                .from('leads')
                .select('*, campaigns(*)')
                .eq('id', leadId)
                .single();

            if (error || !lead) throw new Error('Lead not found for conversion reporting');

            const pixelId = lead.campaigns?.metadata?.pixel_id || process.env.META_PIXEL_ID;
            const accessToken = lead.campaigns?.metadata?.capi_token || process.env.META_CAPI_TOKEN;

            if (!pixelId || !accessToken) {
                logger.warn({ leadId, campaignId: lead.campaign_id }, '⚠️ Transformation skipped: Missing Pixel ID or Token');
                return { status: 'skipped', reason: 'missing_config' };
            }

            // 2. Prepare CAPI Payload
            const userData = {
                em: [this.hash(lead.email)],
                ph: [this.hash(lead.phone)],
                fn: [this.hash(lead.first_name)],
                ln: [this.hash(lead.last_name)],
                external_id: [this.hash(lead.id)]
            };

            const payload = {
                data: [
                    {
                        event_name: eventName,
                        event_time: Math.floor(Date.now() / 1000),
                        action_source: 'chat',
                        user_data: userData,
                        custom_data: { value: value, currency: 'BRL' }
                    }
                ]
            };

            // 3. Send to Meta (Fire & Forget logic with Logging)
            const url = `https://graph.facebook.com/${this.META_API_VERSION}/${pixelId}/events?access_token=${accessToken}`;

            // In dev mode, we might just log
            if (process.env.NODE_ENV === 'development' && !process.env.FORCE_CAPI) {
                logger.info({ leadId, eventName, payload }, '🔌 DEV MODE: CAPI Mock Send');
                return { status: 'mock_sent' };
            }

            const response = await axios.post(url, payload);

            logger.info({ leadId, eventName, fbTraceId: response.data?.fbtrace_id }, '✅ CAPI Event Sent');

            // 4. Update Local ROI Stats
            await this.updateLocalRoi(lead.campaign_id, value);

            return { status: 'sent', fbTraceId: response.data?.fbtrace_id };

        } catch (error) {
            logger.error({ error: error.message, leadId }, '❌ CAPI Reporting Failed');
            return { status: 'error', error: error.message };
        }
    }

    /**
     * Updates internal analytics for the graph.
     */
    async updateLocalRoi(campaignId, value) {
        // Implementation would increment a counter in Redis or DB
        // For now, we rely on the materialized views to pick this up eventually
        // or we could increment a direct counter here.
    }

    hash(input) {
        if (!input) return null;
        // Normalize: lowercase, trim
        const normalized = input.trim().toLowerCase();
        return crypto.createHash('sha256').update(normalized).digest('hex');
    }
}

module.exports = AdsReportingService;
