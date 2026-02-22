/**
 * LeadService - Core Service for Lead Management
 */
const logger = require('../../../shared/Logger').createModuleLogger('lead-service');
class LeadService {
    constructor({ supabaseClient }) {
        this.supabase = supabaseClient;
    }

    async getLead(leadId, scopedClient = null) {
        const client = scopedClient || this.supabase;
        const { data, error } = await client
            .from('leads')
            .select('*, campaigns(*, agents(*))')
            .eq('id', leadId)
            .single();

        if (error) throw error;
        return data;
    }

    async updateLeadStatus(leadId, status) {
        return this.updateLead(leadId, { status });
    }

    async updateLead(leadId, updates, scopedClient = null) {
        const client = scopedClient || this.supabase;
        const { data, error } = await client
            .from('leads')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', leadId)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async transitionToNode(leadId, nodeId, campaignId = null) {
        const { data, error } = await this.supabase
            .from('leads')
            .update({
                current_node_id: nodeId,
                node_state: { entered_at: new Date().toISOString() }
            })
            .eq('id', leadId)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async markNodeExecuted(leadId, nodeState) {
        const { data, error } = await this.supabase
            .from('leads')
            .update({
                node_state: { ...nodeState, executed: true }
            })
            .eq('id', leadId)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async getLeadsForProcessing(campaignId, limit = 50) {
        const now = new Date().toISOString();

        // Leads that don't have a scheduled_at OR where scheduled_at <= now
        const { data, error } = await this.supabase
            .from('leads')
            .select('*')
            .eq('campaign_id', campaignId)
            .in('status', ['new', 'pending', 'contacted', 'prospecting', 'negotiating'])
            .or(`node_state->>scheduled_at.is.null,node_state->>scheduled_at.lte.${now}`)
            .limit(limit);

        if (error) throw error;
        return data || [];
    }

    /**
     * Calculates and updates the lead's score based on DYNAMIC qualification slots.
     * Score = (filledSlots / totalConfiguredSlots) * 90 + sentiment bonus (up to ±10).
     * Works with any user-defined criticalSlots (e.g., "nome", "email", "empresa").
     *
     * @param {string} leadId
     * @param {Object} filledSlots - The current merged qualification slots { nome: "João", email: "j@x.com" }
     * @param {string[]} configuredSlots - The criticalSlots from nodeConfig.data (e.g., ["nome", "email", "empresa"])
     * @param {number} sentimentScore - AI sentiment (0-1)
     */
    async updateLeadScore(leadId, filledSlots = {}, configuredSlots = [], sentimentScore = 0.5) {
        if (!configuredSlots || configuredSlots.length === 0) return null; // No slots configured, skip

        // Count how many configured slots are filled (non-null, non-'unknown')
        const filled = configuredSlots.filter(slot => {
            const val = filledSlots[slot];
            return val && val !== 'unknown' && val !== null;
        });

        // Base score: percentage of slots filled (0-90 range)
        let score = Math.round((filled.length / configuredSlots.length) * 90);

        // Sentiment bonus/penalty (±10)
        if (sentimentScore > 0.8) score += 10;
        else if (sentimentScore < 0.3) score = Math.max(0, score - 10);

        // Clamp 0-100
        score = Math.max(0, Math.min(100, score));

        const { data, error } = await this.supabase
            .from('leads')
            .update({
                score,
                updated_at: new Date().toISOString()
            })
            .eq('id', leadId)
            .select()
            .single();

        if (error) {
            logger.error({ leadId, score, filled: filled.length, total: configuredSlots.length, err: error }, 'Failed to update lead score');
        } else {
            logger.debug({ leadId, score, filled: filled.length, total: configuredSlots.length }, '📊 Lead score updated');
        }
        return data;
    }

    /**
     * Imports multiple leads for a campaign.
     * Sets source = 'imported'.
     */
    async importLeads(campaignId, leadsData, userId, scopedClient = null) {
        if (!leadsData || leadsData.length === 0) return { count: 0 };

        const payload = leadsData.map(lead => ({
            campaign_id: campaignId,
            phone: lead.phone.replace(/\D/g, ''),
            name: lead.name || 'Desconhecido',
            custom_fields: lead.custom_fields || {},
            status: 'new',
            source: 'imported', // Explicit source
            created_at: new Date().toISOString()
        }));

        const client = scopedClient || this.supabase;
        const { data, error } = await client
            .from('leads')
            .insert(payload) // Changed to insert to avoid non-existent constraint error
            .select();

        if (error) throw error;
        return { count: data.length };
    }

    /**
     * Get real-time stats of where leads are in the flow.
     * Returns { nodeId: count }
     */
    async getFlowStats(campaignId, scopedClient = null) {
        const client = scopedClient || this.supabase;

        // 1. Active Leads Stats (Leads currently in a node, no error)
        // Joined with 'chats' to get profile_pic_url
        const { data: activeData, error: activeError } = await client
            .from('leads')
            .select(`
                id, name, phone, current_node_id,
                chats (profile_pic_url)
            `)
            .eq('campaign_id', campaignId)
            .in('status', ['new', 'contacted', 'negotiating', 'pending', 'prospecting'])
            .not('current_node_id', 'is', null);

        if (activeError) {
            logger.error({ err: activeError }, 'getFlowStats (Active) Error');
            return { active: {}, error: {} };
        }

        // Filter out errors in JS to completely avoid PostgREST JSON null quirks
        const validActiveData = (activeData || []).filter(lead => {
            if (!lead.node_state) return true;
            return lead.node_state.error !== true && lead.node_state.error !== 'true';
        });

        // 2. Error Leads Stats (Leads stuck in error state)
        const { data: errorData, error: errStats } = await client
            .from('leads')
            .select(`
                id, name, phone, current_node_id,
                chats (profile_pic_url)
            `)
            .eq('campaign_id', campaignId)
            // We care about errors regardless of status, but typically they are active
            .not('current_node_id', 'is', null)
            .eq('node_state->>error', 'true');

        if (errStats) {
            logger.error({ err: errStats }, 'getFlowStats (Error) Error');
        }

        // Helper to aggregate arrays instead of counts
        const aggregate = (list) => {
            const stats = {};
            (list || []).forEach(lead => {
                if (lead.current_node_id) {
                    if (!stats[lead.current_node_id]) {
                        stats[lead.current_node_id] = { count: 0, leads: [] };
                    }
                    stats[lead.current_node_id].count += 1;

                    // Keep max 10 profiles for canvas/sidebar preview
                    if (stats[lead.current_node_id].leads.length < 10) {
                        // Extract profile pic from joined chats table
                        const profile_picture_url = lead.chats?.[0]?.profile_pic_url || null;

                        stats[lead.current_node_id].leads.push({
                            id: lead.id,
                            name: lead.name,
                            phone: lead.phone,
                            profile_picture_url
                        });
                    }
                }
            });
            return stats;
        };

        return {
            active: aggregate(validActiveData),
            error: aggregate(errorData)
        };
    }

    /**
 * Updates lead status based on AI Intent.
 * Maps intents to Kanban columns with hierarchy protection.
 * Progression: new → contacted → negotiating → qualified → converted | lost
 */
    async updateLeadStatusFromIntent(leadId, intent) {
        if (!intent) return;

        // Status hierarchy (higher number = further in pipeline, never go backwards)
        const STATUS_HIERARCHY = {
            'new': 0,
            'contacted': 1,
            'negotiating': 2,
            'qualified': 3,
            'converted': 4,
            'lost': 99, // Special: always allowed (explicit rejection)
        };

        let newStatus = null;
        const normalizedIntent = intent.toUpperCase();

        // MAPPING: Intent → Status
        // Tier 1: Strong interest → negotiating
        if (['PRICING_QUERY', 'INTERESTED', 'VERY_INTERESTED', 'WANTS_DEMO', 'WANTS_CALLBACK'].includes(normalizedIntent)) {
            newStatus = 'negotiating';
        }
        // Tier 2: Ready to buy → qualified
        else if (['READY_TO_BUY'].includes(normalizedIntent)) {
            newStatus = 'qualified';
        }
        // Tier 3: Negative → lost
        else if (['NOT_INTERESTED', 'SPAM_DETECTION', 'COMPLAINT'].includes(normalizedIntent)) {
            newStatus = 'lost';
        }
        // Tier 4: Any other intent (neutral/greeting/question) → contacted
        else if (['GREETING', 'QUESTION', 'GENERAL_INQUIRY', 'UNKNOWN', 'CONFIRMATION_NO', 'CONFIRMATION_YES', 'OBJECTION'].includes(normalizedIntent)) {
            newStatus = 'contacted';
        }

        if (!newStatus) return;

        const currentLead = await this.getLead(leadId);
        if (!currentLead) return;

        const currentRank = STATUS_HIERARCHY[currentLead.status] ?? 0;
        const newRank = STATUS_HIERARCHY[newStatus] ?? 0;

        // Only allow forward progression (or lost which is always allowed)
        if (newStatus === 'lost' || newRank > currentRank) {
            await this.updateLeadStatus(leadId, newStatus);
        }
    }

    /**
     * Delete multiple leads
     */
    async deleteLeads(leadIds, userId, scopedClient = null) {
        const client = scopedClient || this.supabase;

        const { data, error } = await client
            .from('leads')
            .delete()
            .in('id', leadIds)
            .select();

        if (error) {
            logger.error({ err: error }, 'deleteLeads error');
            throw error;
        }

        return { count: data.length };
    }

    /**
     * Reprocess leads (reset state, optionally change campaign)
     */
    async reprocessLeads(leadIds, newCampaignId, scopedClient = null) {
        const client = scopedClient || this.supabase;

        const updatePayload = {
            current_node_id: null,
            node_state: null,
            status: 'new',
            score: 0,
            updated_at: new Date().toISOString()
        };

        if (newCampaignId) {
            updatePayload.campaign_id = newCampaignId;
        }

        const { data, error } = await client
            .from('leads')
            .update(updatePayload)
            .in('id', leadIds)
            .select();

        if (error) {
            logger.error({ err: error }, 'reprocessLeads error');
            throw error;
        }

        return { count: data.length };
    }
}

module.exports = LeadService;
