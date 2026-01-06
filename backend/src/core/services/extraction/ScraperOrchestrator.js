const CircuitBreaker = require('opossum');
const ApifyProvider = require('./providers/ApifyProvider');
// Import other providers here (e.g. ZenRowsProvider) when available
const logger = require('../../../shared/Logger').createModuleLogger('scraper-orchestrator');

class ScraperOrchestrator {
    constructor() {
        this.providers = [
            new ApifyProvider()
            // new ZenRowsProvider() // Future fallback
        ];

        // Circuit Breaker Options
        this.breakerOptions = {
            timeout: 60000, // 60s timeout per attempt
            errorThresholdPercentage: 50,
            resetTimeout: 30000 // 30s before trying again after open
        };

        // Initialize Breakers
        this.breakers = this.providers.map(provider => {
            const breaker = new CircuitBreaker(
                (url, opts) => provider.scrape(url, opts),
                this.breakerOptions
            );

            breaker.fallback(() => {
                // Return special symbol or throw to indicate this breaker failed
                return { error: 'Breaker Open/Failed' };
            });

            breaker.on('open', () => logger.warn(`Circuit Breaker OPEN for ${provider.name}`));
            breaker.on('close', () => logger.info(`Circuit Breaker CLOSED for ${provider.name}`));

            return {
                name: provider.name,
                breaker: breaker
            };
        });
    }

    /**
     * Execute scraping with failover strategy
     */
    async scrape(url, options = {}) {
        let lastError = null;

        for (const { name, breaker } of this.breakers) {
            try {
                logger.debug({ provider: name, url }, 'Attempting scrape');

                const result = await breaker.fire(url, options);

                // Check if result is the fallback error
                if (result && result.error === 'Breaker Open/Failed') {
                    throw new Error(`Circuit Breaker fallback for ${name}`);
                }

                logger.info({ provider: name, url }, 'Scrape successful');
                return result;

            } catch (error) {
                logger.warn({ provider: name, error: error.message }, 'Scrape attempt failed, failing over...');
                lastError = error;
                // Loop continues to next provider
            }
        }

        logger.error({ url }, 'All scraping providers failed');
        throw new Error(`All providers failed. Last Error: ${lastError ? lastError.message : 'Unknown'}`);
    }
}

// Singleton instance
module.exports = new ScraperOrchestrator();
