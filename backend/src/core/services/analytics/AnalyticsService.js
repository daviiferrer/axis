/**
 * AnalyticsService.js
 * Service for aggregating global dashboard statistics.
 */
class AnalyticsService {
    constructor({ supabaseClient }) {
        this.supabase = supabaseClient;
    }

    /**
     * Aggregates key metrics for the company dashboard.
     * @param {string} companyId - Not fully used yet if RLS handles it, but good for future.
     */
    async getDashboardStats(companyId) {
        // 1. Total Leads
        const { count: totalLeads, error: errTotal } = await this.supabase
            .from('leads')
            .select('*', { count: 'exact', head: true });

        if (errTotal) throw errTotal;

        // 2. Active Leads (in progress)
        // Adjust status filter based on your exact enum (e.g., 'new', 'contacted', 'responded')
        const { count: activeLeads, error: errActive } = await this.supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .in('status', ['new', 'contacted', 'responded']);

        if (errActive) throw errActive;

        // 3. Conversions (e.g., status = 'converted' or 'scheduled')
        const { count: conversions, error: errConv } = await this.supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'converted');

        if (errConv) throw errConv;

        // 4. Calculate Rate
        const rate = totalLeads > 0 ? ((conversions / totalLeads) * 100).toFixed(1) : 0;

        return {
            total_leads: totalLeads || 0,
            active_leads: activeLeads || 0,
            conversions: conversions || 0,
            conversion_rate: parseFloat(rate)
        };
    }

    /**
     * Gets recent lead activity for the feed.
     */
    async getRecentActivity(limit = 5) {
        const { data, error } = await this.supabase
            .from('leads')
            .select('id, name, status, last_message_at, campaigns(name)')
            .order('last_message_at', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return data || [];
    }
}

module.exports = AnalyticsService;
