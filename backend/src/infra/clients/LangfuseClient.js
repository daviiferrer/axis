/**
 * LangfuseClient - LLM Observability & Tracing
 * 
 * Integrates with Langfuse for:
 * - Distributed tracing of LLM calls
 * - Token usage tracking
 * - Latency monitoring
 * - Conversation quality metrics
 * 
 * @see https://langfuse.com/docs
 */
const { Langfuse } = require('langfuse');
const logger = require('../../shared/Logger').createModuleLogger('langfuse');

class LangfuseClient {
    constructor() {
        this.enabled = !!(process.env.LANGFUSE_PUBLIC_KEY && process.env.LANGFUSE_SECRET_KEY);

        if (this.enabled) {
            this.client = new Langfuse({
                publicKey: process.env.LANGFUSE_PUBLIC_KEY,
                secretKey: process.env.LANGFUSE_SECRET_KEY,
                baseUrl: process.env.LANGFUSE_HOST || 'https://cloud.langfuse.com',
                flushAt: 5,      // Batch size before flush
                flushInterval: 1000 // Flush every second
            });
            logger.info('✅ Langfuse observability enabled');
        } else {
            this.client = null;
            logger.warn('⚠️ Langfuse disabled - missing LANGFUSE_PUBLIC_KEY or LANGFUSE_SECRET_KEY');
        }
    }

    /**
     * Create a new trace for a conversation/workflow.
     * 
     * @param {Object} options - Trace options
     * @param {string} options.id - Unique trace ID (e.g., chatId or workflowInstanceId)
     * @param {string} options.name - Human-readable trace name
     * @param {string} options.userId - User/Lead ID for association
     * @param {Object} options.metadata - Additional metadata
     * @returns {Object | null} Trace object or null if disabled
     */
    trace({ id, name, userId, metadata = {} }) {
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
     * 
     * @param {Object} trace - Parent trace from trace()
     * @param {Object} options - Generation options
     * @param {string} options.name - Generation name (e.g., 'agentic-response')
     * @param {string} options.model - Model name (e.g., 'gemini-2.0-flash')
     * @param {string} options.input - System prompt / input
     * @param {string} options.output - Model response
     * @param {Object} options.usage - Token usage { input, output, total }
     * @param {Object} options.metadata - Additional metadata
     * @returns {Object | null} Generation object
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
     * 
     * @param {Object} trace - Parent trace
     * @param {Object} options - Span options
     * @param {string} options.name - Span name (e.g., 'slot-validation')
     * @param {string} options.input - Input data
     * @param {string} options.output - Output data
     * @returns {Object} Span object
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
     * 
     * @param {Object} trace - Parent trace
     * @param {Object} options - Score options
     * @param {string} options.name - Score name (e.g., 'sentiment', 'helpfulness')
     * @param {number} options.value - Score value (0-1 for normalized)
     * @param {string} options.comment - Optional comment
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
     * 
     * @param {Object} trace - Parent trace
     * @param {Object} event - Security event details
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
     * Call this before process shutdown.
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
    getStats() {
        return {
            enabled: this.enabled,
            host: process.env.LANGFUSE_HOST || 'https://cloud.langfuse.com'
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

// Singleton instance
let instance = null;

module.exports = {
    getInstance: () => {
        if (!instance) {
            instance = new LangfuseClient();
        }
        return instance;
    },
    LangfuseClient
};
