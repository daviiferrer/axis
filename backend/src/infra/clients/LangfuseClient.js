/**
 * LangfuseClient - LLM Observability & Tracing
 * 
 * Integrates with Langfuse for:
 * - Distributed tracing of LLM calls
 * - Token usage tracking
 * - Latency monitoring
 * - Conversation quality metrics
 * 
 * Now reads credentials from database via SettingsService
 * 
 * @see https://langfuse.com/docs
 */
const { Langfuse } = require('langfuse');
const logger = require('../../shared/Logger').createModuleLogger('langfuse');

class LangfuseClient {
    constructor({ settingsService } = {}) {
        this.settingsService = settingsService;
        this.enabled = false;
        this.client = null;
        this.initialized = false;
        this.initPromise = null;
    }

    /**
     * Initialize the Langfuse client with settings from database.
     * Lazy initialization on first use.
     */
    async initialize() {
        if (this.initialized) return;
        if (this.initPromise) return this.initPromise;

        this.initPromise = this._doInitialize();
        return this.initPromise;
    }

    async _doInitialize() {
        try {
            let publicKey = null;
            let secretKey = null;
            let host = 'https://cloud.langfuse.com';

            if (this.settingsService) {
                publicKey = await this.settingsService.getLangfusePublicKey();
                secretKey = await this.settingsService.getLangfuseSecretKey();
                host = await this.settingsService.getLangfuseHost();
            }

            this.enabled = !!(publicKey && secretKey);

            if (this.enabled) {
                this.client = new Langfuse({
                    publicKey,
                    secretKey,
                    baseUrl: host,
                    flushAt: 5,
                    flushInterval: 1000
                });
                logger.info('✅ Langfuse observability enabled (credentials from database)');
            } else {
                this.client = null;
                logger.warn('⚠️ Langfuse disabled - missing langfuse_public_key or langfuse_secret_key in system_settings');
            }

            this.initialized = true;
        } catch (error) {
            logger.error({ error: error.message }, 'Failed to initialize Langfuse');
            this.enabled = false;
            this.initialized = true;
        }
    }

    /**
     * Create a new trace for a conversation/workflow.
     */
    async trace({ id, name, userId, metadata = {} }) {
        await this.initialize();
        if (!this.enabled) return this.#createMockTrace();

        try {
            const trace = this.client.trace({
                id,
                name,
                userId,
                metadata,
                tags: [process.env.NODE_ENV || 'development']
            });

            logger.debug({ traceId: id, name }, 'Trace created');
            return trace;
        } catch (error) {
            logger.error({ error: error.message }, 'Failed to create trace');
            return this.#createMockTrace();
        }
    }

    /**
     * Log a generation (LLM call) within a trace.
     */
    generation(trace, { name, model, input, output, usage = {}, metadata = {} }) {
        if (!this.enabled || !trace || trace._mock) {
            return { end: () => { } };
        }

        try {
            const generation = trace.generation({
                name,
                model,
                input,
                output,
                usage: {
                    promptTokens: usage.input || 0,
                    completionTokens: usage.output || 0,
                    totalTokens: usage.total || (usage.input || 0) + (usage.output || 0)
                },
                metadata: {
                    ...metadata,
                    temperature: metadata.temperature,
                    finishReason: metadata.finishReason
                }
            });

            return generation;
        } catch (error) {
            logger.error({ error: error.message }, 'Failed to log generation');
            return { end: () => { } };
        }
    }

    /**
     * Log a span (non-LLM operation) within a trace.
     */
    span(trace, { name, input, output, metadata = {} }) {
        if (!this.enabled || !trace || trace._mock) {
            return { end: () => { } };
        }

        try {
            return trace.span({
                name,
                input,
                output,
                metadata
            });
        } catch (error) {
            logger.error({ error: error.message }, 'Failed to log span');
            return { end: () => { } };
        }
    }

    /**
     * Log a score/evaluation for quality tracking.
     */
    score(trace, { name, value, comment = '' }) {
        if (!this.enabled || !trace || trace._mock) return;

        try {
            trace.score({
                name,
                value,
                comment
            });
        } catch (error) {
            logger.error({ error: error.message }, 'Failed to log score');
        }
    }

    /**
     * Log a security event (guardrail trigger, injection attempt).
     */
    securityEvent(trace, { type, blocked, details }) {
        if (!this.enabled || !trace || trace._mock) return;

        try {
            trace.event({
                name: 'security_event',
                input: { type, blocked, details },
                level: blocked ? 'WARNING' : 'INFO'
            });

            logger.warn({ type, blocked }, 'Security event logged to Langfuse');
        } catch (error) {
            logger.error({ error: error.message }, 'Failed to log security event');
        }
    }

    /**
     * Flush all pending events.
     */
    async flush() {
        if (!this.enabled) return;

        try {
            await this.client.flush();
            logger.debug('Langfuse events flushed');
        } catch (error) {
            logger.error({ error: error.message }, 'Failed to flush Langfuse');
        }
    }

    /**
     * Get client stats for health checks.
     */
    async getStats() {
        await this.initialize();
        let host = 'https://cloud.langfuse.com';
        if (this.settingsService) {
            host = await this.settingsService.getLangfuseHost();
        }
        return {
            enabled: this.enabled,
            host
        };
    }

    /**
     * Create a mock trace for when Langfuse is disabled.
     */
    #createMockTrace() {
        return {
            _mock: true,
            generation: () => ({ end: () => { } }),
            span: () => ({ end: () => { } }),
            score: () => { },
            event: () => { },
            update: () => { }
        };
    }
}

module.exports = LangfuseClient;
