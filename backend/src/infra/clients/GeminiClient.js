const { GoogleGenerativeAI } = require("@google/generative-ai");
const CircuitBreaker = require('opossum');
const logger = require('../../shared/Logger').createModuleLogger('gemini');
const { updateTraceContext } = require('../../shared/TraceContext');
const SpintaxService = require('../../core/services/content/SpintaxService');

/**
 * GeminiClient - Infrastructure Client for Google Gemini AI
 * 
 * O modelo a ser usado DEVE ser passado explicitamente em cada chamada.
 * A configuração do modelo vem da tabela `agents` no banco de dados.
 * NÃO há modelo padrão hardcoded - se não for passado, lança erro.
 */
class GeminiClient {
    constructor(apiKey) {
        if (!apiKey) throw new Error("Gemini API Key is required for GeminiClient.");
        this.genAI = new GoogleGenerativeAI(apiKey);
        this.apiKey = apiKey;

        // Circuit Breaker configuration
        this.breakerOptions = {
            timeout: 10000,
            errorThresholdPercentage: 50,
            resetTimeout: 30000,
            volumeThreshold: 5
        };

        this.generateBreaker = new CircuitBreaker(
            this._rawGenerateContent.bind(this),
            this.breakerOptions
        );

        this.generateBreaker.fallback(() => {
            logger.warn('Circuit breaker triggered - using fallback message');
            return {
                text: () => SpintaxService.getFallbackMessage(),
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
            return {
                text: () => SpintaxService.getFallbackMessage(),
                _metrics: { fallback: true }
            };
        });
    }

    /**
     * Valida que um modelo foi fornecido. NÃO há fallback.
     * O modelo deve vir da tabela `agents.model` no banco de dados.
     */
    _validateModel(modelName, methodName) {
        if (!modelName) {
            const error = `[GeminiClient.${methodName}] ERRO: Modelo não especificado. O modelo DEVE vir da tabela 'agents' no banco de dados.`;
            logger.error(error);
            throw new Error(error);
        }

        return modelName;
    }

    async _rawGenerateContent(modelName, systemInstruction, history, options = {}) {
        const start = performance.now();
        const model = this._validateModel(modelName, '_rawGenerateContent');

        const genModel = this.genAI.getGenerativeModel({
            model,
            systemInstruction,
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
        return response;
    }

    async _rawGenerateSimple(modelName, systemInstruction, prompt, options = {}) {
        const start = performance.now();
        const model = this._validateModel(modelName, '_rawGenerateSimple');

        const genModel = this.genAI.getGenerativeModel({
            model,
            systemInstruction,
            ...options
        });

        const result = await genModel.generateContent(prompt);
        const response = result.response;

        const total_ms = Math.round(performance.now() - start);
        logger.info({ model, total_ms }, 'Simple generation completed');

        response._metrics = { model, total_ms };
        return response;
    }

    async generateContent(modelName, systemInstruction, history, options = {}) {
        return this.generateBreaker.fire(modelName, systemInstruction, history, options);
    }

    async generateContentStream(modelName, systemInstruction, history, options = {}) {
        const start = performance.now();
        const model = this._validateModel(modelName, 'generateContentStream');
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
        const model = this._validateModel(modelName, 'getEmbedding');

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
