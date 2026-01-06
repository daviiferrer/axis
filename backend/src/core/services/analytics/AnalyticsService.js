class AnalyticsService {
    constructor(supabase) {
        this.supabase = supabase;
    }

    async getDashboardStats() {
        try {
            // 1. Total Leads
            const { count: totalLeads, error: leadsError } = await this.supabase
                .from('campaign_leads')
                .select('*', { count: 'exact', head: true });

            if (leadsError) throw leadsError;

            // 2. Active Agents (Count campaigns with status 'active' * nodes of type 'agent'?)
            // For now, simpler: Count active campaigns
            const { count: activeCampaigns } = await this.supabase
                .from('campaigns')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'active');

            // Approximation: 3 agents per campaign on average
            const activeAgents = (activeCampaigns || 0) * 3;

            // 3. Leads Today
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const { count: leadsToday } = await this.supabase
                .from('campaign_leads')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', today.toISOString());

            // 4. Conversion Rate (Scheduled / Total Contacted)
            // Assuming status 'converted', 'scheduled', 'won' are positive
            const { count: convertedCount } = await this.supabase
                .from('campaign_leads')
                .select('*', { count: 'exact', head: true })
                .in('status', ['converted', 'scheduled', 'won']);

            const conversionRate = totalLeads > 0
                ? ((convertedCount || 0) / totalLeads * 100).toFixed(1)
                : 0;

            // 5. Top Objections (Mocked/Placeholder until we have structured objection logging)
            // Ideally query a 'leads_history' or similar log with objection tags
            const topObjections = [
                { label: 'Preço muito alto', count: 42, color: 'bg-red-500' },
                { label: 'Já possui solução', count: 28, color: 'bg-orange-500' },
                { label: 'Sem orçamento', count: 15, color: 'bg-yellow-500' },
            ];

            return {
                totalLeads: totalLeads || 0,
                activeAgents: activeAgents || 0,
                leadsToday: leadsToday || 0,
                conversionRate: Number(conversionRate),
                topObjections
            };
        } catch (error) {
            console.error('AnalyticsService Error:', error);
            throw error;
        }
    }
}

module.exports = AnalyticsService;
