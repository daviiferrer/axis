/**
 * OutboundDispatcherService - Manages rate-limited lead engagement for Outbound.
 * 
 * Periodically scans for new leads in active campaigns and dispatches them
 * while respecting daily limits and safety delays.
 */
const logger = require('../../../shared/Logger').createModuleLogger('outbound-dispatcher');

class OutboundDispatcherService {
    constructor({ supabaseClient, workflowEngine }) {
        this.supabase = supabaseClient;
        this.workflowEngine = workflowEngine;
        this.interval = null;
        this.POLL_INTERVAL_MS = 1000 * 60 * 5; // Every 5 minutes
    }

    /**
     * Start the dispatcher background task
     */
    start() {
        if (this.interval) return;

        logger.info('🚀 Outbound Dispatcher started');
        this.interval = setInterval(() => this.dispatchAll(), this.POLL_INTERVAL_MS);

        // Immediate first run
        this.dispatchAll().catch(err => {
            logger.error({ err: err.message }, 'Initial dispatch failed');
        });
    }

    /**
     * Stop the dispatcher
     */
    stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
            logger.info('🛑 Outbound Dispatcher stopped');
        }
    }

    /**
     * Scan all active campaigns and dispatch available quota
     */
    async dispatchAll() {
        try {
            // 1. Get active campaigns with auto_engage enabled
            const { data: campaigns, error } = await this.supabase
                .from('campaigns')
                .select('*')
                .eq('status', 'active')
                .eq('auto_engage', true);

            if (error) throw error;
            if (!campaigns || campaigns.length === 0) return;

            logger.debug({ count: campaigns.length }, 'Scanning active outbound campaigns');

            for (const campaign of campaigns) {
                await this.processCampaign(campaign);
            }
        } catch (error) {
            logger.error({ err: error.message }, 'Dispatch error');
        }
    }

    /**
     * Extract rate limit config from the trigger node in the campaign graph.
     * Falls back to campaign-level columns, then defaults.
     */
    _getRateLimitConfig(campaign) {
        const graph = campaign.strategy_graph || campaign.graph;
        const triggerNode = graph?.nodes?.find(n => n.type === 'trigger' || n.type === 'leadEntry');
        const nodeData = triggerNode?.data || {};

        return {
            maxPerDay: nodeData.maxLeadsPerDay || campaign.max_leads_per_day || 50,
            batchSize: nodeData.batchSize || campaign.batch_size || 10,
            delayMs: nodeData.delayBetweenLeads || campaign.delay_between_leads || 5000
        };
    }

    /**
     * Process a single campaign
     */
    async processCampaign(campaign) {
        try {
            const campaignId = campaign.id;
            const { maxPerDay, batchSize, delayMs } = this._getRateLimitConfig(campaign);

            // 1. Calculate how many leads were dispatched TODAY
            // Only count leads that were moved to 'processing' today (not old leads updated for other reasons)
            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);

            const { count: sentToday, error: countError } = await this.supabase
                .from('leads')
                .select('*', { count: 'exact', head: true })
                .eq('campaign_id', campaignId)
                .in('status', ['processing', 'contacted', 'interested', 'qualified'])
                .gte('updated_at', todayStart.toISOString());

            if (countError) throw countError;

            const remainingQuota = Math.max(0, maxPerDay - (sentToday || 0));

            if (remainingQuota <= 0) {
                logger.debug({ campaignId, maxPerDay, sentToday }, 'Quota reached for today');
                return;
            }

            // 2. Adjust batch size to quota
            const currentBatchSize = Math.min(batchSize, remainingQuota);

            // 3. Find "new" leads to process
            const { data: newLeads, error: leadsError } = await this.supabase
                .from('leads')
                .select('*')
                .eq('campaign_id', campaignId)
                .eq('status', 'new')
                .limit(currentBatchSize)
                .order('created_at', { ascending: true });

            if (leadsError) throw leadsError;

            if (!newLeads || newLeads.length === 0) return;

            logger.info({ campaignId, count: newLeads.length, remainingQuota, maxPerDay, batchSize }, 'Dispatching batch of leads');

            // 4. Dispatch leads
            for (let i = 0; i < newLeads.length; i++) {
                const lead = newLeads[i];

                // Update status immediately to avoid double processing
                await this.supabase
                    .from('leads')
                    .update({
                        status: 'processing',
                        current_node_id: campaign.entry_node_id || lead.current_node_id,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', lead.id);

                // Dispatch to workflow engine
                if (this.workflowEngine) {
                    try {
                        await this.workflowEngine.processLead({
                            ...lead,
                            campaigns: campaign
                        });
                    } catch (e) {
                        logger.error({ leadId: lead.id, err: e.message }, 'Failed to dispatch lead to engine');
                    }
                }

                // Safety delay BETWEEN leads (not after the last one)
                if (i < newLeads.length - 1 && delayMs > 0) {
                    await new Promise(resolve => setTimeout(resolve, delayMs));
                }
            }

            // 5. Update campaign last_dispatch_at
            await this.supabase
                .from('campaigns')
                .update({ last_dispatch_at: new Date().toISOString() })
                .eq('id', campaignId);

        } catch (error) {
            logger.error({ campaignId: campaign.id, err: error.message }, 'Failed to process campaign dispatch');
        }
    }
}

module.exports = OutboundDispatcherService;
