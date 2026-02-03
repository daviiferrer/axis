/**
 * TriggerService - Core Service for AI Trigger Logic (Sniper)
 */
const logger = require('../../../shared/Logger').createModuleLogger('trigger-service');

class TriggerService {
    constructor({ supabaseClient, workflowEngine }) {
        this.supabase = supabaseClient;
        this.workflowEngine = workflowEngine;
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
     * Called when new leads are imported from Apify extraction
     * Checks for active campaigns and starts auto-engagement
     */
    async onNewLeadsImported(campaignId, leads) {
        logger.info({ campaignId, count: leads.length }, '📥 New leads imported - checking for auto-engagement');

        try {
            // Get campaign details
            const { data: campaign, error } = await this.supabase
                .from('campaigns')
                .select('*, agents(*)')
                .eq('id', campaignId)
                .single();

            if (error || !campaign) {
                logger.warn({ campaignId }, 'Campaign not found for auto-engagement');
                return;
            }

            // Check if campaign has auto-engage enabled
            if (!campaign.auto_engage || campaign.status !== 'active') {
                logger.info({ campaignId }, 'Auto-engagement disabled or campaign not active');
                return;
            }

            // Get leads that are ready (have phone numbers)
            const readyLeads = leads.filter(l => l.status === 'ready' && l.phone);

            if (readyLeads.length === 0) {
                logger.info({ campaignId }, 'No leads ready for engagement');
                return;
            }

            logger.info({ campaignId, readyCount: readyLeads.length }, '🚀 Starting auto-engagement');

            // Import leads to campaign_leads table
            const campaignLeads = readyLeads.map(lead => ({
                campaign_id: campaignId,
                phone: lead.phone,
                name: lead.name,
                company: lead.company,
                metadata: {
                    source: lead.source,
                    title: lead.title,
                    email: lead.email,
                    website: lead.website,
                    linkedin_url: lead.linkedin_url
                },
                status: 'new',
                current_node_id: campaign.entry_node_id || null
            }));

            const { error: insertError } = await this.supabase
                .from('leads')
                .insert(campaignLeads);

            if (insertError) {
                logger.error({ error: insertError.message }, 'Failed to import leads to campaign');
                return;
            }

            // Trigger workflow for first batch (respect rate limits)
            const batchSize = campaign.batch_size || 10;
            const firstBatch = campaignLeads.slice(0, batchSize);

            for (const lead of firstBatch) {
                if (this.workflowEngine) {
                    // Delay between leads to avoid spam detection
                    await this.delay(campaign.delay_between_leads || 5000);
                    this.workflowEngine.processLead({
                        ...lead,
                        campaigns: campaign
                    }).catch(e => logger.error({ error: e.message }, 'Workflow trigger failed'));
                }
            }

            logger.info({
                campaignId,
                triggered: firstBatch.length,
                remaining: campaignLeads.length - firstBatch.length
            }, '✅ Auto-engagement batch started');

        } catch (err) {
            logger.error({ campaignId, error: err.message }, 'Auto-engagement failed');
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

