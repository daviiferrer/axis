const { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } = require("@google/generative-ai");
const CircuitBreaker = require('opossum');
const logger = require('../../shared/Logger').createModuleLogger('gemini');
const { updateTraceContext } = require('../../shared/TraceContext');
const SpintaxService = require('../../core/services/content/SpintaxService');

/**
 * Safety settings for sales/customer service AI.
 * We need to allow processing offensive USER messages (leads being rude)
 * while still blocking the AI from generating harmful content.
 * BLOCK_NONE allows processing all input - the AI still won't generate bad content.
 */
const SALES_SAFETY_SETTINGS = [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
];

/**
 * GeminiClient - Infrastructure Client for Google Gemini AI
 * 
 * O modelo a ser usado DEVE ser passado explicitamente em cada chamada.
 * A configuração do modelo vem da tabela `agents` no banco de dados.
 * NÃO há modelo padrão hardcoded - se não for passado, lança erro.
 */
class GeminiClient {
    constructor({ systemConfig, billingService, settingsService }) {
        const apiKey = systemConfig?.geminiKey;
        this.billingService = billingService;
        this.settingsService = settingsService;
        this.apiKey = apiKey;

        // If key is present, init immediately. If not, we'll try lazy load.
        this.genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

        if (!apiKey) {
            logger.info("ℹ️ GeminiClient: No env API Key. Will attempt to load from SettingsService on demand.");
        }

        // ... rest of init

        // Circuit Breaker configuration
        // More tolerant settings for production - don't open too quickly
        this.breakerOptions = {
            timeout: 15000,              // 15s timeout for Gemini calls
            errorThresholdPercentage: 70, // Open after 70% failures (was 50%)
            resetTimeout: 30000,          // Try again after 30 seconds
            volumeThreshold: 10           // Need 10 requests before calculating error rate (was 5)
        };

        this.generateBreaker = new CircuitBreaker(
            this._rawGenerateContent.bind(this),
            this.breakerOptions
        );

        this.generateBreaker.fallback(() => {
            logger.warn('Circuit breaker triggered - using fallback message');
            const fallbackJson = JSON.stringify({
                response: SpintaxService.getFallbackMessage(),
                thought: "System Overload / Circuit Open",
                sentiment_score: 0.5,
                confidence_score: 0.0
            });
            return {
                text: () => fallbackJson,
                _metrics: { fallback: true }
            };
        });

        this.generateBreaker.on('open', () => logger.warn('⚠️ Circuit OPEN - Gemini unavailable'));
        this.generateBreaker.on('halfOpen', () => logger.info('🔄 Circuit HALF-OPEN - testing Gemini'));
        this.generateBreaker.on('close', () => logger.info('✅ Circuit CLOSED - Gemini recovered'));

        this.simpleBreaker = new CircuitBreaker(
            this._rawGenerateSimple.bind(this),
            this.breakerOptions
        );

        this.simpleBreaker.fallback(() => {
            logger.warn('Circuit breaker triggered (Simple) - using fallback message');
            const fallbackJson = JSON.stringify({
                response: SpintaxService.getFallbackMessage(),
                thought: "System Overload / Circuit Open",
                sentiment_score: 0.5,
                confidence_score: 0.0
            });
            return {
                text: () => fallbackJson,
                _metrics: { fallback: true }
            };
        });

        // Log actual errors that cause circuit breaker to trigger
        this.simpleBreaker.on('failure', (error) => {
            logger.error({ error: error?.message || error, stack: error?.stack?.slice(0, 200) }, '❌ Gemini Simple call failed');
        });
        this.generateBreaker.on('failure', (error) => {
            logger.error({ error: error?.message || error, stack: error?.stack?.slice(0, 200) }, '❌ Gemini Generate call failed');
        });
    }

    async _handleBilling(metrics, context = {}) {
        if (!this.billingService || !context.companyId) return;

        // Cost Model:
        // Simple Generation: 1 Credit
        // Complex (Chat/Stream): 2 Credits
        const cost = context.isComplex ? 2 : 1;

        try {
            await this.billingService.deductCredits(context.companyId, cost, {
                purpose: 'ai_generation',
                model: metrics.model
            });
        } catch (e) {
            logger.error({ error: e.message }, 'Billing Deduction Failed');
        }
    }

    /**
     * Valida que o cliente está pronto e o modelo foi fornecido.
     * O modelo deve vir da tabela `agents.model` no banco de dados.
     */
    /**
     * Ensures the client is initialized with an API Key.
     * Attempts to fetch from SettingsService if not already configured.
     */
    async _ensureClient(modelName, methodName) {
        if (!this.genAI) {
            // Try to load from DB
            if (this.settingsService) {
                const dbKey = await this.settingsService.getProviderKey(null, 'gemini');
                if (dbKey) {
                    this.apiKey = dbKey;
                    this.genAI = new GoogleGenerativeAI(dbKey);
                    logger.info("✅ GeminiClient: API Key loaded lazily from SettingsService.");
                }
            }
        }

        if (!this.genAI) {
            const error = `[GeminiClient.${methodName}] ERRO: API Key não configurada (Env ou DB). Configure no Painel Admin.`;
            logger.error(error);
            throw new Error(error);
        }

        if (!modelName) {
            const error = `[GeminiClient.${methodName}] ERRO: Modelo não especificado. O modelo DEVE vir da tabela 'agents' no banco de dados.`;
            logger.error(error);
            throw new Error(error);
        }

        return modelName;
    }

    async _rawGenerateContent(modelName, systemInstruction, history, options = {}) {
        const start = performance.now();
        const model = await this._ensureClient(modelName, '_rawGenerateContent');

        const genModel = this.genAI.getGenerativeModel({
            model,
            systemInstruction,
            safetySettings: SALES_SAFETY_SETTINGS,
            ...options
        });

        const chat = genModel.startChat({ history });
        const lastMessage = history[history.length - 1];
        const result = await chat.sendMessage(lastMessage.parts);
        const response = result.response;

        const total_ms = Math.round(performance.now() - start);
        const metrics = {
            model,
            total_ms,
            prompt_tokens: history.reduce((acc, m) => acc + (m.parts?.[0]?.text?.length || 0), 0),
            completion_tokens: response.text()?.length || 0
        };

        logger.info({ metrics }, 'Gemini generation completed');
        response._metrics = metrics;

        // BILLING HOOK
        if (options.companyId) {
            this._handleBilling(metrics, { companyId: options.companyId, isComplex: true });
        }

        return response;
    }

    async _rawGenerateSimple(modelName, systemInstruction, prompt, options = {}) {
        const start = performance.now();
        const model = await this._ensureClient(modelName, '_rawGenerateSimple');

        const genModel = this.genAI.getGenerativeModel({
            model,
            systemInstruction,
            safetySettings: SALES_SAFETY_SETTINGS,
            ...options
        });

        const result = await genModel.generateContent(prompt);
        const response = result.response;

        const total_ms = Math.round(performance.now() - start);
        logger.info({ model, total_ms }, 'Simple generation completed');

        const metrics = { model, total_ms };
        response._metrics = metrics;

        // BILLING HOOK
        if (options.companyId) {
            this._handleBilling(metrics, { companyId: options.companyId, isComplex: false });
        }

        return response;
    }

    async generateContent(modelName, systemInstruction, history, options = {}) {
        return this.generateBreaker.fire(modelName, systemInstruction, history, options);
    }

    async generateContentStream(modelName, systemInstruction, history, options = {}) {
        const start = performance.now();
        const model = await this._ensureClient(modelName, 'generateContentStream');
        let ttft = null;
        let tokenCount = 0;

        const genModel = this.genAI.getGenerativeModel({
            model,
            systemInstruction,
            ...options
        });

        const chat = genModel.startChat({ history });
        const lastMessage = history[history.length - 1];
        const result = await chat.sendMessageStream(lastMessage.parts);
        const originalStream = result.stream;

        result.stream = (async function* () {
            for await (const chunk of originalStream) {
                if (ttft === null) {
                    ttft = Math.round(performance.now() - start);
                    logger.debug({ ttft_ms: ttft }, 'Time to first token');
                }
                tokenCount++;
                yield chunk;
            }

            const total_ms = Math.round(performance.now() - start);
            const tpot = tokenCount > 1 ? Math.round((total_ms - ttft) / (tokenCount - 1)) : 0;

            const metrics = { model, ttft_ms: ttft, tpot_ms: tpot, total_ms, token_count: tokenCount };
            logger.info({ metrics }, 'Gemini stream completed');
            updateTraceContext({ cognitive_metrics: metrics });
        })();

        return result;
    }

    async generateSimple(modelName, systemInstruction, prompt, options = {}) {
        return this.simpleBreaker.fire(modelName, systemInstruction, prompt, options);
    }

    async getEmbedding(modelName, text) {
        const start = performance.now();
        const model = await this._ensureClient(modelName, 'getEmbedding');

        const genModel = this.genAI.getGenerativeModel({ model });
        const result = await genModel.embedContent(text);

        const total_ms = Math.round(performance.now() - start);
        logger.debug({ model, total_ms, text_length: text.length }, 'Embedding generated');

        return result.embedding.values;
    }

    getCircuitStats() {
        return this.generateBreaker.stats;
    }
}

module.exports = GeminiClient;
