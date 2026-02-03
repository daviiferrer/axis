const logger = require('../../../shared/Logger').createModuleLogger('model-pricing');

/**
 * Model Pricing Registry (2026 Rates)
 * Rates are in USD per 1 Million Tokens.
 */
const PRICING_REGISTRY = {
    'gemini-2.5-flash': {
        input: 0.30,
        output: 2.50,
        name: 'Gemini 2.5 Flash'
    },
    'gemini-2.5-flash-lite': {
        input: 0.10,
        output: 0.40,
        name: 'Gemini 2.5 Flash Lite'
    },
    'gemini-3.0-flash': {
        input: 0.50,
        output: 3.00,
        name: 'Gemini 3.0 Flash'
    },
    // Fallbacks for older/other models
    'gemini-1.5-flash': { input: 0.075, output: 0.30, name: 'Gemini 1.5 Flash' },
    'gemini-1.5-pro': { input: 3.50, output: 10.50, name: 'Gemini 1.5 Pro' },
    'default': { input: 0.10, output: 0.40, name: 'Default Model' }
};

class ModelPricingService {
    static getPrice(modelId) {
        const pricing = PRICING_REGISTRY[modelId] || PRICING_REGISTRY['default'];
        return pricing;
    }

    /**
     * Calculate cost for a transaction
     * @param {string} modelId 
     * @param {number} inputTokens 
     * @param {number} outputTokens 
     * @returns {number} Cost in USD
     */
    static calculateCost(modelId, inputTokens, outputTokens) {
        const pricing = this.getPrice(modelId);

        // Prices are per 1M tokens, so we divide by 1,000,000
        const inputCost = (inputTokens / 1000000) * pricing.input;
        const outputCost = (outputTokens / 1000000) * pricing.output;

        return parseFloat((inputCost + outputCost).toFixed(9)); // High precision
    }
}

module.exports = ModelPricingService;
