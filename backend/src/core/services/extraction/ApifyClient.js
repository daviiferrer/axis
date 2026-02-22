const { ApifyClient: BaseApifyClient } = require('apify-client');
const logger = require('../../../shared/Logger').createModuleLogger('apify-client');

class ApifyClient {
    constructor({ settingsService }) {
        this.settingsService = settingsService;
        this.GMAPS_ACTOR = 'compass/crawler-google-places';
    }

    async getClient() {
        const token = await this.settingsService.getApifyToken();
        if (!token) throw new Error('Apify API Token not configured in system settings');
        return new BaseApifyClient({ token });
    }

    /**
     * Starts a Google Maps search run
     */
    async startGmapsSearch(searchTerms, location, maxResults = 50) {
        const client = await this.getClient();

        const input = {
            "searchStringsArray": [searchTerms],
            "locationQuery": location,
            "maxCrawledPlacesPerSearch": maxResults,
            "language": "pt-BR", // Kept PT-BR as default for the user's context
            "searchMatching": "all",
            "placeMinimumStars": "",
            "website": "allPlaces",
            "skipClosedPlaces": false,
            "scrapePlaceDetailPage": false,
            "scrapeTableReservationProvider": false,
            "includeWebResults": false,
            "scrapeDirectories": false,
            "maxQuestions": 0,
            "scrapeContacts": false, // Based on compass/crawler-google-places defaults
            "scrapeSocialMediaProfiles": {
                "facebooks": false,
                "instagrams": false,
                "youtubes": false,
                "tiktoks": false,
                "twitters": false
            },
            "maximumLeadsEnrichmentRecords": 0,
            "maxReviews": 0,
            "reviewsSort": "newest",
            "reviewsFilterString": "",
            "reviewsOrigin": "all",
            "scrapeReviewsPersonalData": true,
            "maxImages": 0,
            "scrapeImageAuthors": false,
            "allPlacesNoSearchAction": ""
        };

        const run = await client.actor(this.GMAPS_ACTOR).start(input);
        logger.info({ runId: run.id, actor: this.GMAPS_ACTOR }, 'Started Gmaps search');

        return run.id;
    }

    /**
     * Polls for run results
     */
    async getRunResults(runId) {
        const client = await this.getClient();
        const run = await client.run(runId).get();

        if (run.status === 'SUCCEEDED') {
            const { items } = await client.dataset(run.defaultDatasetId).listItems();
            return {
                status: run.status,
                items: items
            };
        }

        return {
            status: run.status,
            items: []
        };
    }

    /**
     * Stops a running actor
     */
    async stopRun(runId) {
        const client = await this.getClient();
        await client.run(runId).abort();
        logger.info({ runId }, 'Aborted Apify run');
    }

    /**
     * Normalize item for consistency (Legacy method used by ProspectController)
     */
    normalizeItem(item, userId, runId) {
        return {
            id: item.id || item.placeId,
            name: item.title || item.name,
            phone: item.phone || item.phoneNumber,
            address: item.address,
            category: item.categoryName,
            website: item.website,
            runId
        };
    }
}

module.exports = ApifyClient;
