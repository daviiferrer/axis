/**
 * ScraperProvider - Base Class / Interface
 * 
 * Defines the contract that all scraping providers must implement.
 */
class ScraperProvider {
    constructor(name) {
        if (this.constructor === ScraperProvider) {
            throw new Error("Abstract classes can't be instantiated.");
        }
        this.name = name;
    }

    /**
     * Scrape a URL
     * @param {string} url - The URL to scrape
     * @param {object} options - Extra options (proxy, localization, etc.)
     * @returns {Promise<object>} Normalized data
     */
    async scrape(url, options = {}) {
        throw new Error("Method 'scrape()' must be implemented.");
    }

    /**
     * Check if provider is healthy/ready
     */
    async healthCheck() {
        return true;
    }
}

module.exports = ScraperProvider;
