/**
 * Trace Middleware - Injects trace context into every request
 * 
 * Automatically extracts trace_id from headers or generates a new one.
 * Binds lead_id and campaign_id from request body/query.
 */
const { runWithTrace } = require('../../shared/TraceContext');
const logger = require('../../shared/Logger').createModuleLogger('trace');

module.exports = function traceMiddleware(req, res, next) {
    const context = {
        trace_id: req.headers['x-trace-id'] || req.headers['x-request-id'],
        lead_id: req.body?.leadId || req.body?.lead_id || req.query?.lead_id,
        campaign_id: req.body?.campaignId || req.body?.campaign_id || req.query?.campaign_id,
        chat_id: req.body?.chatId || req.body?.chat_id || req.query?.chat_id
    };

    runWithTrace(context, () => {
        // Log incoming request
        logger.info({
            method: req.method,
            url: req.originalUrl,
            ip: req.ip
        }, 'Request received');

        // Track response time
        const start = Date.now();
        res.on('finish', () => {
            const duration = Date.now() - start;
            logger.info({
                status: res.statusCode,
                duration_ms: duration
            }, 'Request completed');
        });

        next();
    });
};
