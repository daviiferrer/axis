class AnalyticsService {
    constructor(supabase) {
        this.supabase = supabase;
    }

    async getDashboardStats() {
        try {
            // 1. Total Leads & Pending Human (Parallel)
            const [
                { count: totalLeads },
                { count: leadsToday },
                { count: pendingHuman }
            ] = await Promise.all([
                this.supabase.from('campaign_leads').select('*', { count: 'exact', head: true }),
                this.supabase.from('campaign_leads').select('*', { count: 'exact', head: true })
                    .gte('created_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
                this.supabase.from('campaign_leads').select('*', { count: 'exact', head: true })
                    .in('status', ['transbordo', 'pending_human', 'manual_intervention'])
            ]);

            // 2. Conversion Data
            const { count: convertedCount } = await this.supabase
                .from('campaign_leads')
                .select('*', { count: 'exact', head: true })
                .in('status', ['converted', 'scheduled', 'won']);

            const conversionRate = totalLeads > 0
                ? ((convertedCount || 0) / totalLeads * 100).toFixed(1)
                : 0;

            // 3. Channel Battle (Inbound vs Outbound)
            // Fetch campaigns to split by type
            const { data: campaigns } = await this.supabase
                .from('campaigns')
                .select('id, type'); // Assuming type exists: 'inbound' | 'outbound'

            let inboundCount = 0;
            let outboundCount = 0;
            let inboundResponses = 0;
            let outboundResponses = 0;

            if (campaigns && campaigns.length > 0) {
                // This is an approximation to avoid heavy joins. ideally we do this in DB view.
                const inboundIds = campaigns.filter(c => c.type === 'inbound').map(c => c.id);
                const outboundIds = campaigns.filter(c => c.type === 'outbound' || c.type === 'scraper').map(c => c.id);

                const countLeadsByCampaigns = async (ids) => {
                    if (ids.length === 0) return { total: 0, responded: 0 };
                    const { count: total } = await this.supabase.from('campaign_leads').select('*', { count: 'exact', head: true }).in('campaign_id', ids);
                    const { count: responded } = await this.supabase.from('campaign_leads').select('*', { count: 'exact', head: true }).in('campaign_id', ids).neq('status', 'new');
                    return { total, responded };
                };

                const inboundStats = await countLeadsByCampaigns(inboundIds);
                const outboundStats = await countLeadsByCampaigns(outboundIds);

                inboundCount = inboundStats.total;
                inboundResponses = inboundStats.responded; // Or 'converted' depending on view
                outboundCount = outboundStats.total;
                outboundResponses = outboundStats.responded;
            }

            // 4. Heatmap (Last 7 Days)
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            const { data: recentMessages } = await this.supabase
                .from('messages')
                .select('created_at')
                .eq('from_me', false) // Only inbound messages from leads
                .gte('created_at', sevenDaysAgo.toISOString())
                .limit(2000); // Safety limit

            // Process Heatmap in JS
            // Grid: 7 days x 24 hours. Array of { day: 0-6, hour: 0-23, value: count }
            const heatmapGrid = {};
            (recentMessages || []).forEach(msg => {
                const date = new Date(msg.created_at);
                const day = date.getDay(); // 0 = Sunday
                const hour = date.getHours();
                const key = `${day}-${hour}`;
                heatmapGrid[key] = (heatmapGrid[key] || 0) + 1;
            });

            const heatmap = [];
            for (let d = 0; d < 7; d++) {
                for (let h = 0; h < 24; h++) {
                    const val = heatmapGrid[`${d}-${h}`] || 0;
                    if (val > 0) heatmap.push({ day: d, hour: h, value: val });
                }
            }

            // 5. Commercial Stats (Revenue & Funnel)
            // We fetch all leads to calculate values locally to ensure safety if column missing
            // Ideally we use database SUM() but 'deal_value' might not exist yet.
            const { data: commercialLeads } = await this.supabase
                .from('campaign_leads')
                .select('status, deal_value'); // Optimize: fetch only needed columns

            let totalRevenue = 0;
            let dealsWon = 0;
            let funnelData = {
                new: { count: 0, value: 0 },
                qualified: { count: 0, value: 0 },
                negotiating: { count: 0, value: 0 },
                won: { count: 0, value: 0 },
                lost: { count: 0, value: 0 }
            };

            if (commercialLeads) {
                commercialLeads.forEach(lead => {
                    const val = Number(lead.deal_value || 0);
                    const status = lead.status || 'new';

                    // Map status to funnel bucket
                    let bucket = 'new';
                    if (['qualified', 'contacted', 'responding'].includes(status)) bucket = 'qualified';
                    if (['negotiating', 'offered', 'proposing'].includes(status)) bucket = 'negotiating';
                    if (['won', 'converted', 'closed'].includes(status)) bucket = 'won';
                    if (['lost', 'archived', 'rejected'].includes(status)) bucket = 'lost';

                    if (funnelData[bucket]) {
                        funnelData[bucket].count++;
                        funnelData[bucket].value += val;
                    }

                    if (bucket === 'won') {
                        totalRevenue += val;
                        dealsWon++;
                    }
                });
            }

            const ticketAverage = dealsWon > 0 ? (totalRevenue / dealsWon) : 0;

            // 6. Costs (Mocked for now as per BillingService)
            // In real scenario, query 'usage_logs' or similar
            const costs = {
                total: 12.50,
                breakdown: {
                    openai: 8.50,
                    apify: 3.00,
                    whatsapp: 1.00
                },
                budget_used_percent: 65
            };

            return {
                totalLeads: totalLeads || 0,
                leadsToday: leadsToday || 0,
                pendingHuman: pendingHuman || 0,
                conversionRate: Number(conversionRate),
                channels: {
                    inbound: { total: inboundCount, responded: inboundResponses },
                    outbound: { total: outboundCount, responded: outboundResponses }
                },
                commercial: {
                    revenue: totalRevenue,
                    ticketAverage: ticketAverage,
                    funnel: funnelData
                },
                heatmap,
                costs,
            };

        } catch (error) {
            console.error('AnalyticsService Error:', error);
            throw error;
        }
    }
}

module.exports = AnalyticsService;
