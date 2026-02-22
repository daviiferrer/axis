/**
 * TriggerService - Core Service for AI Trigger Logic (Sniper)
 */
const logger = require('../../../shared/Logger').createModuleLogger('trigger-service');

class TriggerService {
    constructor({ supabaseClient, workflowEngine, outboundDispatcherService }) {
        this.supabase = supabaseClient;
        this.workflowEngine = workflowEngine;
        this.outboundDispatcherService = outboundDispatcherService;
        this.aiDebounceTimers = new Map();
        this.AI_DEBOUNCE_MS = 3000;
    }

    /**
     * Handles presence update events.
     * Decides if the AI should be triggered.
     */
    async handlePresenceUpdate(sessionName, jid, status) {
        // Only trigger if status is 'online' or 'typing'
        if (status !== 'online' && status !== 'typing') return;

        const phone = jid.replace('@s.whatsapp.net', '');

        // Debounce to avoid multiple triggers for the same user activity
        if (this.aiDebounceTimers.has(phone)) {
            clearTimeout(this.aiDebounceTimers.get(phone));
        }

        const timer = setTimeout(async () => {
            this.aiDebounceTimers.delete(phone);
            await this.triggerAiForLead(phone, sessionName);
        }, this.AI_DEBOUNCE_MS);

        this.aiDebounceTimers.set(phone, timer);
    }

    /**
     * Triggers the AI for a specific lead.
     */
    async triggerAiForLead(phone, sessionName) {
        // SAFETY: Prevent Bot Self-Triggering (JID 55519... is often the bot itself in waha/baileys)
        if (phone.startsWith('55519') || phone.includes('99794450')) {
            logger.warn({ phone }, '🛑 Security: Blocked attempt to trigger AI on Session Number (Self-Loop Protection)');
            return;
        }

        logger.info({ phone, sessionName }, '🎯 Sniper Triggered');

        try {
            // Find lead and campaign
            const { data: lead, error } = await this.supabase
                .from('leads')
                .select('*, campaigns!inner(id, graph, status, user_id)') // Join campaigns to get graph
                .or(`phone.eq.${phone},phone.ilike.%${phone.slice(-8)}`)
                .eq('campaigns.status', 'active') // Only look for leads in active campaigns
                .single();

            if (error || !lead) return;

            // Check if lead is in a state that allows AI interaction
            if (lead.status === 'manual_intervention' || lead.owner === 'human') {
                logger.info({ phone }, 'AI skipped: Lead is under human control');
                return;
            }

            // Call WorkflowEngine to process the lead
            if (this.workflowEngine) {
                this.workflowEngine.processLead(lead);
            }

        } catch (err) {
            logger.error({ error: err.message }, 'Error triggering AI');
        }
    }

    /**
     * Called when new leads are imported from Apify extraction.
     * Imports leads as 'new' status. The OutboundDispatcherService 
     * will pick them up and trickle them into the workflow periodically.
     */
    async onNewLeadsImported(campaignId, leads) {
        logger.info({ campaignId, count: leads.length }, '📥 New leads imported - Storing for controlled dispatch');

        try {
            // 1. Get campaign details helper
            const { data: campaign, error } = await this.supabase
                .from('campaigns')
                .select('id, entry_node_id, auto_engage, status')
                .eq('id', campaignId)
                .single();

            if (error || !campaign) {
                logger.warn({ campaignId }, 'Campaign not found for import');
                return;
            }

            // 2. Map leads to database format
            const campaignLeads = leads.map(lead => ({
                campaign_id: campaignId,
                phone: lead.phone,
                name: lead.name,
                company: lead.company,
                source: lead.source || 'outbound', // Explicitly set the source column
                custom_fields: {
                    source: lead.source,
                    rating: lead.rating,
                    reviews: lead.reviews,
                    address: lead.address,
                    website: lead.website,
                    linkedin_url: lead.linkedin_url
                },
                status: 'new', // Dispatcher will pick these up
                current_node_id: campaign.entry_node_id || null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }));

            // 3. Batch insert to 'leads' table (using upsert logic for phone/campaign_id)
            const { error: insertError } = await this.supabase
                .from('leads')
                .upsert(campaignLeads, { onConflict: 'campaign_id, phone', ignoreDuplicates: true });

            if (insertError) {
                logger.error({ error: insertError.message }, 'Failed to store new leads');
                return;
            }

            logger.info({ campaignId, imported: campaignLeads.length }, '✅ Leads stored successfully. Awaiting dispatcher.');

            // 4. Trigger one immediate dispatch run to provide instant feedback for the first batch
            if (campaign.auto_engage && campaign.status === 'active' && this.outboundDispatcherService) {
                // We use setTimeout to not block the webhook response
                setTimeout(() => {
                    this.outboundDispatcherService.dispatchAll().catch(e => {
                        logger.error({ err: e.message }, 'Immediate dispatch failed');
                    });
                }, 1000);
            }

        } catch (err) {
            logger.error({ campaignId, error: err.message }, 'Manual lead import failed');
        }
    }

    /**
     * Utility delay function
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = TriggerService;

