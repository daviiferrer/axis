/**
 * ApifyController - Lead Extraction Engine Controller
 * 
 * Manages Apify actor runs for B2B lead extraction from multiple sources:
 * LinkedIn, Google Maps, Web, Social Media.
 */
const { ApifyClient } = require('apify-client');
const logger = require('../../../shared/Logger').createModuleLogger('apify');

// Actor Catalog - All supported B2B extraction actors
const ACTOR_CATALOG = {
    // LinkedIn Module
    linkedin: {
        harvest: { id: 'jupri/linkedin-people-search-export', name: 'HarvestAPI (LinkedIn Search)', costPerRun: 'low' },
        profiles: { id: 'dev_fusion/linkedin-profile-scraper', name: 'Dev Fusion (Profile Deep)', costPerRun: 'medium' },
        companies: { id: 'bebity/linkedin-company-scraper', name: 'Bebity (Companies/ABM)', costPerRun: 'medium' },
        jobs: { id: 'curious_coder/linkedin-jobs-scraper', name: 'Curious Coder (Jobs/Intent)', costPerRun: 'low' }
    },
    // Maps Module
    maps: {
        compass: { id: 'compass/crawler-google-places', name: 'Compass (Google Maps)', costPerRun: 'low' },
        emailExtractor: { id: 'lukaskrivka/google-maps-with-contact-details', name: 'Lukáš (Maps + Emails)', costPerRun: 'medium' }
    },
    // Social Module
    social: {
        instagram: { id: 'apify/instagram-scraper', name: 'API Dojo (Instagram)', costPerRun: 'medium' },
        tiktok: { id: 'clockworks/tiktok-scraper', name: 'Clockworks (TikTok)', costPerRun: 'medium' }
    },
    // Web Module
    web: {
        contacts: { id: 'vojta/contact-details-scraper', name: 'Vojta (URL Contacts)', costPerRun: 'low' },
        emailFinder: { id: 'dxbear/fast-email-finder', name: 'Dxbear (Email Finder)', costPerRun: 'low' },
        contentCrawler: { id: 'apify/website-content-crawler', name: 'Apify (RAG Content)', costPerRun: 'low' }
    }
};

class ApifyController {
    constructor(supabase) {
        this.client = new ApifyClient({ token: process.env.APIFY_TOKEN });
        this.supabase = supabase;
    }

    /**
     * Get available actor catalog
     */
    getCatalog(req, res) {
        try {
            res.json({
                success: true,
                catalog: ACTOR_CATALOG
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * Start an extraction run
     */
    async startExtraction(req, res) {
        try {
            const { actorKey, input, campaignId, webhookUrl } = req.body;

            // Validate actor
            const actor = this.findActor(actorKey);
            if (!actor) {
                return res.status(400).json({ error: `Unknown actor: ${actorKey}` });
            }

            logger.info({ actorKey, actorId: actor.id, campaignId }, 'Starting extraction');

            // Start the actor run
            const run = await this.client.actor(actor.id).start(input, {
                webhooks: webhookUrl ? [{
                    eventTypes: ['ACTOR.RUN.SUCCEEDED', 'ACTOR.RUN.FAILED'],
                    requestUrl: webhookUrl
                }] : undefined
            });

            // Save run metadata to database
            const { error: dbError } = await this.supabase
                .from('extraction_runs')
                .insert({
                    run_id: run.id,
                    actor_id: actor.id,
                    actor_key: actorKey,
                    campaign_id: campaignId,
                    status: 'running',
                    input: input,
                    started_at: new Date().toISOString()
                });

            if (dbError) {
                logger.error({ error: dbError.message }, 'Failed to save run metadata');
            }

            res.json({
                success: true,
                runId: run.id,
                actorId: actor.id,
                status: run.status,
                datasetId: run.defaultDatasetId
            });

        } catch (error) {
            logger.error({ error: error.message }, 'Extraction start failed');
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * Get extraction run status
     */
    async getRunStatus(req, res) {
        try {
            const { runId } = req.params;

            const run = await this.client.run(runId).get();

            res.json({
                success: true,
                runId: run.id,
                status: run.status,
                startedAt: run.startedAt,
                finishedAt: run.finishedAt,
                stats: run.stats,
                datasetId: run.defaultDatasetId
            });

        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * Get dataset items from a completed run
     */
    async getDataset(req, res) {
        try {
            const { datasetId } = req.params;
            const { limit = 100, offset = 0 } = req.query;

            const dataset = await this.client.dataset(datasetId).listItems({
                limit: parseInt(limit),
                offset: parseInt(offset)
            });

            res.json({
                success: true,
                count: dataset.count,
                total: dataset.total,
                items: dataset.items
            });

        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * Abort a running extraction
     */
    async abortRun(req, res) {
        try {
            const { runId } = req.params;

            await this.client.run(runId).abort();

            // Update database
            await this.supabase
                .from('extraction_runs')
                .update({ status: 'aborted', finished_at: new Date().toISOString() })
                .eq('run_id', runId);

            res.json({ success: true, message: 'Run aborted' });

        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * Get extraction history for a campaign
     */
    async getHistory(req, res) {
        try {
            const { campaignId } = req.params;

            const { data, error } = await this.supabase
                .from('extraction_runs')
                .select('*')
                .eq('campaign_id', campaignId)
                .order('started_at', { ascending: false })
                .limit(20);

            if (error) throw error;

            res.json({ success: true, runs: data });

        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    // ============ HELPER METHODS ============

    /**
     * Find actor by key (e.g., 'linkedin.harvest')
     */
    findActor(key) {
        const [module, actor] = key.split('.');
        return ACTOR_CATALOG[module]?.[actor] || null;
    }

    /**
     * Get flat list of all actors
     */
    static getAllActors() {
        const actors = [];
        for (const [module, moduleActors] of Object.entries(ACTOR_CATALOG)) {
            for (const [key, actor] of Object.entries(moduleActors)) {
                actors.push({
                    key: `${module}.${key}`,
                    ...actor
                });
            }
        }
        return actors;
    }
}

module.exports = ApifyController;
