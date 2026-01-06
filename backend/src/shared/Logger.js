/**
 * Logger - Pino-based structured logging with trace context
 * 
 * Features:
 * - JSON output for Elasticsearch/Grafana ingestion
 * - Auto-injects trace_id, lead_id, campaign_id from AsyncLocalStorage
 * - Pretty printing in development mode
 */
const pino = require('pino');
const { getTraceContext } = require('./TraceContext');

const isDev = process.env.NODE_ENV !== 'production';

// Base logger configuration
const baseConfig = {
    level: process.env.LOG_LEVEL || 'info',
    formatters: {
        level: (label) => ({ level: label }),
        bindings: () => ({ service: 'prospecao-fria' })
    },
    // Mixin injects trace context into every log entry
    mixin: () => {
        const ctx = getTraceContext();
        if (!ctx) return {};
        return {
            trace_id: ctx.trace_id,
            lead_id: ctx.lead_id,
            campaign_id: ctx.campaign_id,
            chat_id: ctx.chat_id
        };
    },
    timestamp: pino.stdTimeFunctions.isoTime
};

// Pretty print for development
const devTransport = {
    target: 'pino-pretty',
    options: {
        colorize: true,
        translateTime: 'HH:MM:ss',
        ignore: 'pid,hostname,service'
    }
};

const logger = isDev
    ? pino(baseConfig, pino.transport(devTransport))
    : pino(baseConfig);

// Named child loggers for different modules
const createModuleLogger = (moduleName) => logger.child({ module: moduleName });

module.exports = logger;
module.exports.createModuleLogger = createModuleLogger;
