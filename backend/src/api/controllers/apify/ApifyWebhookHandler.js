/**
 * ApifyWebhookHandler - Async Webhook Receiver
 * 
 * Receives completion webhooks from Apify, downloads datasets,
 * normalizes leads and triggers auto-engagement.
 */
const { ApifyClient } = require('apify-client');
const LeadTransformerService = require('../../../core/services/extraction/LeadTransformerService');
const logger = require('../../../shared/Logger').createModuleLogger('apify-webhook');

class ApifyWebhookHandler {
    constructor(supabase, triggerService) {
        this.client = new ApifyClient({ token: process.env.APIFY_TOKEN });
        this.supabase = supabase;
        this.triggerService = triggerService;
        this.transformer = new LeadTransformerService();
    }

    /**
     * Handle Apify webhook callback
     * POST /api/webhooks/apify
     */
    async handleWebhook(req, res) {
        try {
            const { eventType, eventData } = req.body;

            logger.info({ eventType, runId: eventData?.runId }, 'Apify webhook received');

            // Acknowledge immediately (async processing)
            res.status(200).json({ received: true });

            // Process based on event type
            switch (eventType) {
                case 'ACTOR.RUN.SUCCEEDED':
                    await this.handleRunSuccess(eventData);
                    break;
                case 'ACTOR.RUN.FAILED':
                    await this.handleRunFailed(eventData);
                    break;
                default:
                    logger.debug({ eventType }, 'Unhandled event type');
            }

        } catch (error) {
            logger.error({ error: error.message }, 'Webhook handling error');
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * Handle successful run - download, transform, save
     */
    async handleRunSuccess(eventData) {
        const { actorRunId, defaultDatasetId } = eventData;

        try {
            // 1. Get run metadata from database
            const { data: runMeta, error: metaError } = await this.supabase
                .from('extraction_runs')
                .select('*')
                .eq('run_id', actorRunId)
                .single();

            if (metaError || !runMeta) {
                logger.warn({ runId: actorRunId }, 'Run metadata not found');
                return;
            }

            const { campaign_id, actor_key } = runMeta;

            logger.info({ runId: actorRunId, campaignId: campaign_id }, 'Processing successful run');

            // 2. Download dataset
            const dataset = await this.client.dataset(defaultDatasetId).listItems();
            const rawItems = dataset.items;

            logger.info({ count: rawItems.length }, 'Dataset downloaded');

            // 3. Normalize data
            const normalized = this.transformer.normalizeAuto(rawItems, campaign_id, actor_key);

            // 4. Get existing leads for deduplication
            const existingPhones = await this.getExistingPhones(campaign_id);
            const { unique, duplicates } = this.transformer.deduplicate(normalized, existingPhones);

            // 5. Save to database
            if (unique.length > 0) {
                const { error: insertError } = await this.supabase
                    .from('prospects')
                    .insert(unique);

                if (insertError) {
                    logger.error({ error: insertError.message }, 'Failed to insert prospects');
                } else {
                    logger.info({ inserted: unique.length }, 'Prospects saved');
                }
            }

            // 6. Update run status
            await this.supabase
                .from('extraction_runs')
                .update({
                    status: 'completed',
                    finished_at: new Date().toISOString(),
                    results: {
                        total: rawItems.length,
                        normalized: normalized.length,
                        unique: unique.length,
                        duplicates: duplicates.length
                    }
                })
                .eq('run_id', actorRunId);

            // 7. Trigger auto-engagement if leads are ready
            if (this.triggerService && unique.length > 0) {
                await this.triggerService.onNewLeadsImported(campaign_id, unique);
            }

        } catch (error) {
            logger.error({ runId: actorRunId, error: error.message }, 'Run processing failed');

            await this.supabase
                .from('extraction_runs')
                .update({ status: 'error', error_message: error.message })
                .eq('run_id', actorRunId);
        }
    }

    /**
     * Handle failed run
     */
    async handleRunFailed(eventData) {
        const { actorRunId } = eventData;

        try {
            const run = await this.client.run(actorRunId).get();

            await this.supabase
                .from('extraction_runs')
                .update({
                    status: 'failed',
                    finished_at: new Date().toISOString(),
                    error_message: run.exitCode || 'Unknown error'
                })
                .eq('run_id', actorRunId);

            logger.warn({ runId: actorRunId }, 'Run failed');

        } catch (error) {
            logger.error({ runId: actorRunId, error: error.message }, 'Failed to update run status');
        }
    }

    /**
     * Get existing phones for a campaign (for deduplication)
     */
    async getExistingPhones(campaignId) {
        const { data, error } = await this.supabase
            .from('prospects')
            .select('phone')
            .eq('campaign_id', campaignId)
            .not('phone', 'is', null);

        if (error) {
            logger.error({ error: error.message }, 'Failed to get existing phones');
            return new Set();
        }

        return new Set(data.map(p => p.phone));
    }
}

module.exports = ApifyWebhookHandler;
