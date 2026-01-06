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

    async updateCampaignStatus(campaignId, status) {
        const { data, error } = await this.supabase
            .from('campaigns')
            .update({ status, updated_at: new Date().toISOString() })
            .eq('id', campaignId)
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
            .from('campaign_leads')
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
