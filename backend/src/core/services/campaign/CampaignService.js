/**
 * CampaignService - Core Service for Campaign Management
 */
class CampaignService {
    constructor(supabaseClient) {
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

    // --- Flow Management ---

    async getFlow(campaignId) {
        // Get generic latest flow
        const { data, error } = await this.supabase
            .from('campaign_flows')
            .select('*')
            .eq('campaign_id', campaignId)
            .order('version', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error) throw error;
        // Return empty structure if no flow exists yet
        return data || { flow_data: { nodes: [], edges: [] }, version: 0 };
    }

    async saveFlow(campaignId, flowData) {
        // Always create a new version or update draft?
        // Strategy: Check if there is a draft (is_published=false) and update it.
        // If the latest is published, create a new draft.

        // 1. Get latest flow
        const { data: latest } = await this.supabase
            .from('campaign_flows')
            .select('*')
            .eq('campaign_id', campaignId)
            .order('version', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (latest && !latest.is_published) {
            // Update existing draft
            const { data, error } = await this.supabase
                .from('campaign_flows')
                .update({
                    flow_data: flowData,
                    updated_at: new Date().toISOString()
                })
                .eq('id', latest.id)
                .select()
                .single();

            if (error) throw error;
            return data;
        } else {
            // Create new draft version
            const { data, error } = await this.supabase
                .from('campaign_flows')
                .insert({
                    campaign_id: campaignId,
                    flow_data: flowData,
                    is_published: false
                    // version auto-incremented by trigger
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        }
    }

    async publishFlow(campaignId) {
        // Find the latest draft and mark as published
        const { data: latest } = await this.supabase
            .from('campaign_flows')
            .select('*')
            .eq('campaign_id', campaignId)
            .order('version', { ascending: false })
            .limit(1)
            .single();

        if (!latest) throw new Error('No flow to publish');

        const { data, error } = await this.supabase
            .from('campaign_flows')
            .update({ is_published: true, updated_at: new Date().toISOString() })
            .eq('id', latest.id)
            .select()
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
