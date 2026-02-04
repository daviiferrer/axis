/**
 * LeadService - Core Service for Lead Management
 */
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
     * Calculates and updates the lead's score based on qualification slots.
     */
    async updateLeadScore(leadId, customFields, sentimentScore = 0.5) {
        let score = 0;

        if (customFields.budget && customFields.budget !== 'unknown') score += 20;
        if (customFields.authority && customFields.authority !== 'unknown') score += 30;
        if (customFields.need && customFields.need !== 'unknown') score += 25;
        if (customFields.timeline && customFields.timeline !== 'unknown') score += 15;

        // Sentiment bonus
        if (sentimentScore > 0.8) score += 10;
        if (sentimentScore < 0.3) score -= 20;

        const { data, error } = await this.supabase
            .from('leads')
            .update({
                score: score,
                updated_at: new Date().toISOString()
            })
            .eq('id', leadId)
            .select()
            .single();

        if (error) {
            console.error(`[LeadService] Failed to update score for lead ${leadId}:`, error);
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
}

module.exports = LeadService;
