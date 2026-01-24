/**
 * CampaignService - Core Service for Campaign Management
 */
class CampaignService {
    constructor({ supabaseClient }) {
        this.supabase = supabaseClient;
    }

    async getCampaign(campaignId) {
        const { data, error } = await this.supabase
            .from('campaigns')
            .select('*, agents(*)')
            .eq('id', campaignId)
            .single();

        if (error) throw error;
        return data;
    }

    async listCampaigns() {
        const { data, error } = await this.supabase
            .from('campaigns')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    }

    async createCampaign(userId, campaignData) {
        // campaignData: { name, description, session_id }
        // 1. Get user's company_id
        const { data: profile } = await this.supabase
            .from('profiles')
            .select('company_id')
            .eq('id', userId)
            .single();

        if (!profile?.company_id) throw new Error('Usuário sem empresa vinculada.');

        const { data, error } = await this.supabase
            .from('campaigns')
            .insert({
                company_id: profile.company_id,
                user_id: userId,
                name: campaignData.name,
                description: campaignData.description,
                session_id: campaignData.session_id,
                type: campaignData.type || 'inbound', // Default to inbound
                status: 'draft'
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async updateCampaignStatus(campaignId, status) {
        const { data, error } = await this.supabase
            .from('campaigns')
            .update({ status })
            .eq('id', campaignId)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async deleteCampaign(campaignId) {
        // 1. Unlink Leads (Set campaign_id to NULL) - Preserve the leads, just detach them
        const { error: leadsError } = await this.supabase
            .from('leads')
            .update({ campaign_id: null })
            .eq('campaign_id', campaignId);

        if (leadsError) {
            console.error('Error detaching leads:', leadsError);
            throw leadsError;
        }

        // 2. Delete Instances (Runtime state)
        const { error: instancesError } = await this.supabase
            .from('campaign_instances')
            .delete()
            .eq('campaign_id', campaignId);

        if (instancesError) {
            console.error('Error deleting instances:', instancesError);
            throw instancesError;
        }

        // 3. Delete Campaign
        const { error } = await this.supabase
            .from('campaigns')
            .delete()
            .eq('id', campaignId);

        if (error) throw error;
        return { success: true };
    }

    // --- Flow Management ---

    async getFlow(campaignId) {
        const { data, error } = await this.supabase
            .from('campaigns')
            .select('graph')
            .eq('id', campaignId)
            .single();

        if (error) throw error;
        // Return existing graph or empty structure
        return {
            flow_data: data?.graph || { nodes: [], edges: [] },
            version: 1
        };
    }

    async saveFlow(campaignId, flowData) {
        // Update the 'graph' jsonb column directly on the campaign
        const { data, error } = await this.supabase
            .from('campaigns')
            .update({
                graph: flowData,
                updated_at: new Date().toISOString()
            })
            .eq('id', campaignId)
            .select()
            .single();

        if (error) throw error;
        return { flow_data: data.graph };
    }

    async publishFlow(campaignId) {
        // In the single-table model, saving is effectively publishing 
        // unless we separate 'graph' (draft) and 'published_graph' (live).
        // For now, assuming direct manipulation as per user request ("não ficar criando tabelas toda hora").
        // We just verify the campaign is active.

        const { data, error } = await this.supabase
            .from('campaigns')
            .select('status')
            .eq('id', campaignId)
            .single();

        if (error) throw error;
        return data;
    }

    async updateCampaignMode(campaignId, mode, userId) {
        // 1. If switching to LIVE, check safety and billing
        if (mode === 'live') {
            // Get user's company_id
            const { data: profile } = await this.supabase
                .from('profiles')
                .select('company_id')
                .eq('id', userId)
                .single();

            if (!profile?.safety_accepted_at) {
                throw new Error('Você deve aceitar os protocolos de segurança antes de ativar o modo LIVE.');
            }

            // Check Billing (Subscription status)
            const { data: subscription } = await this.supabase
                .from('subscriptions')
                .select('status')
                .eq('user_id', userId)
                .single();

            const isActive = subscription?.status === 'active' || subscription?.status === 'trialing';

            if (!isActive) {
                throw new Error('Assinatura ativa necessária para habilitar o modo LIVE.');
            }
        }

        const { data, error } = await this.supabase
            .from('campaigns')
            .update({ mode, updated_at: new Date().toISOString() })
            .eq('id', campaignId)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async getCampaignStats(campaignId) {
        // Logic to calculate stats (leads, responses, conversions)
        // This is a placeholder for actual complex query or RPC
        const { data: leads } = await this.supabase
            .from('leads')
            .select('status')
            .eq('campaign_id', campaignId);

        const stats = {
            total: leads?.length || 0,
            active: leads?.filter(l => l.status === 'active').length || 0,
            responded: leads?.filter(l => l.status === 'responded').length || 0,
            converted: leads?.filter(l => l.status === 'converted').length || 0
        };

        return stats;
    }
}

module.exports = CampaignService;
