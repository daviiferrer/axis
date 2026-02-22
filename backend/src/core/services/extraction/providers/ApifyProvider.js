const ScraperProvider = require('./ScraperProvider');
const { ApifyClient } = require('apify-client');
const logger = require('../../../../shared/Logger').createModuleLogger('apify-provider');

class ApifyProvider extends ScraperProvider {
    constructor(settingsService) {
        super('Apify');
        this.settingsService = settingsService;
        this.CONTENT_CRAWLER_ACTOR = 'apify/website-content-crawler';
        this.MAX_PAGES = 5;
    }

    async scrape(url, options = {}) {
        logger.info({ url }, 'Starting scraping via Apify');

        // Fetch API Key from System Settings (global, managed by admin)
        const token = await this.settingsService.getApifyToken();
        if (!token) throw new Error('Apify Token not configured in System Settings');

        this.client = new ApifyClient({ token }); // Create client on demand or cache it

        try {
            // Run crawler
            const run = await this.client.actor(this.CONTENT_CRAWLER_ACTOR).call({
                startUrls: [{ url }],
                maxCrawlPages: options.maxPages || this.MAX_PAGES,
                maxCrawlDepth: options.depth || 2,
                crawlerType: 'cheerio',
                removeElementsCssSelector: 'nav, footer, script, style, noscript, .cookie-banner',
                saveHtml: false,
                saveMarkdown: true
            }, {
                waitSecs: 120 // Max wait time
            });

            // Get results
            const dataset = await this.client.dataset(run.defaultDatasetId).listItems();
            const pages = dataset.items;

            if (pages.length === 0) {
                logger.warn({ url }, 'No content extracted by Apify');
                throw new Error('No content returned');
            }

            return {
                pages: pages,
                metadata: {
                    provider: 'Apify',
                    runId: run.id,
                    cost: run.usage ? run.usage.ACTOR_COMPUTE_UNITS : 0
                }
            };

        } catch (error) {
            logger.error({ error: error.message, url }, 'Apify extraction failed');
            throw error;
        }
    }
}

module.exports = ApifyProvider;
