/**
 * LlmFactory - Dynamic LLM Provider Factory
 * 
 * Creates the appropriate LLM client based on provider configuration.
 * Supports: Gemini, OpenAI, Anthropic (future).
 */
const logger = require('../../shared/Logger').createModuleLogger('llm-factory');
const GeminiClient = require('../../infra/clients/GeminiClient');

class LlmFactory {
    constructor(settingsService) {
        this.settingsService = settingsService;
        this.clients = new Map(); // Cache clients by userId:provider
    }

    /**
     * Get or create an LLM client for the specified provider.
     * @param {string} userId - User ID for API key lookup.
     * @param {string} provider - Provider name: 'gemini', 'openai'.
     * @returns {Promise<object>} LLM client instance.
     */
    async getClient(userId, provider = 'gemini') {
        const cacheKey = `${userId}:${provider}`;

        // Return cached client if exists
        if (this.clients.has(cacheKey)) {
            return this.clients.get(cacheKey);
        }

        // Validate API key exists
        const validation = await this.settingsService.validateProviderKey(userId, provider);
        if (!validation.valid) {
            throw new Error(`MISSING_API_KEY:${provider}:${validation.keyName}`);
        }

        // Get API key and default model
        const apiKey = await this.settingsService.getProviderKey(userId, provider);
        if (!apiKey) {
            throw new Error(`MISSING_API_KEY:${provider}`);
        }

        // Get default model from settings
        const settings = await this.settingsService.getSettings(userId);
        const defaultModel = settings?.default_gemini_model || 'gemini-1.5-flash';

        // Create client based on provider
        const client = await this.#createClient(provider, apiKey, { defaultModel });
        this.clients.set(cacheKey, client);

        logger.info({ userId, provider, defaultModel }, 'LLM client created');
        return client;
    }

    /**
     * Create a new LLM client instance.
     */
    async #createClient(provider, apiKey, options = {}) {
        switch (provider.toLowerCase()) {
            case 'gemini':
                return new GeminiClient(apiKey, options);

            case 'openai':
                return this.#createOpenAIClient(apiKey);

            case 'anthropic':
            case 'claude':
                return this.#createAnthropicClient(apiKey);

            default:
                logger.warn({ provider }, 'Unknown provider, falling back to Gemini');
                return new GeminiClient(apiKey, options);
        }
    }

    /**
     * Create OpenAI client wrapper.
     * Uses same interface as GeminiClient for compatibility.
     */
    #createOpenAIClient(apiKey) {
        // Lazy import to avoid requiring openai if not used
        try {
            const OpenAI = require('openai');
            const client = new OpenAI({ apiKey });

            // Return wrapper with same interface as GeminiClient
            return {
                async generateContent(modelName, systemInstruction, history, options = {}) {
                    const messages = [
                        { role: 'system', content: systemInstruction },
                        ...history.map(h => ({
                            role: h.role === 'model' ? 'assistant' : 'user',
                            content: h.parts?.[0]?.text || ''
                        }))
                    ];

                    if (!modelName) throw new Error('OpenAI model name required');

                    const start = performance.now();
                    const response = await client.chat.completions.create({
                        model: modelName,
                        messages,
                        ...options
                    });

                    const total_ms = Math.round(performance.now() - start);

                    return {
                        text: () => response.choices[0]?.message?.content || '',
                        _metrics: {
                            model: modelName,
                            total_ms,
                            prompt_tokens: response.usage?.prompt_tokens,
                            completion_tokens: response.usage?.completion_tokens
                        }
                    };
                },

                async generateSimple(modelName, systemInstruction, prompt, options = {}) {
                    return this.generateContent(modelName, systemInstruction, [
                        { role: 'user', parts: [{ text: prompt }] }
                    ], options);
                }
            };
        } catch (e) {
            logger.error({ error: e.message }, 'Failed to create OpenAI client');
            throw new Error('OPENAI_NOT_INSTALLED');
        }
    }

    /**
     * Create Anthropic/Claude client wrapper (placeholder).
     */
    #createAnthropicClient(apiKey) {
        logger.warn('Anthropic client not yet implemented');
        throw new Error('ANTHROPIC_NOT_IMPLEMENTED');
    }

    /**
     * Clear cached client for a user/provider.
     */
    clearCache(userId, provider = null) {
        if (provider) {
            this.clients.delete(`${userId}:${provider}`);
        } else {
            // Clear all clients for user
            for (const key of this.clients.keys()) {
                if (key.startsWith(`${userId}:`)) {
                    this.clients.delete(key);
                }
            }
        }
    }

    /**
     * Get available providers.
     */
    static getAvailableProviders() {
        return [
            { id: 'gemini', name: 'Google Gemini', models: ['gemini-3-flash-preview', 'gemini-2.0-flash-exp', 'gemini-1.5-flash'] },
            { id: 'openai', name: 'OpenAI', models: ['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo'] },
            { id: 'anthropic', name: 'Anthropic (Claude)', models: ['claude-3-sonnet', 'claude-3-opus'], disabled: true }
        ];
    }
}

module.exports = LlmFactory;
