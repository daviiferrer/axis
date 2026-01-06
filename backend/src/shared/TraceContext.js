/**
 * TraceContext - AsyncLocalStorage-based distributed tracing
 * 
 * Provides trace context propagation without prop-drilling.
 * Automatically injects trace_id, lead_id, campaign_id into all logs.
 */
const { AsyncLocalStorage } = require('async_hooks');
const crypto = require('crypto');

const traceStore = new AsyncLocalStorage();

/**
 * Run a function within a trace context
 * @param {Object} context - { trace_id, lead_id, campaign_id, ... }
 * @param {Function} fn - Function to execute within context
 */
function runWithTrace(context, fn) {
    const trace = {
        trace_id: context.trace_id || crypto.randomUUID(),
        lead_id: context.lead_id || null,
        campaign_id: context.campaign_id || null,
        chat_id: context.chat_id || null,
        started_at: Date.now()
    };
    return traceStore.run(trace, fn);
}

/**
 * Get current trace context (null if outside traced context)
 */
function getTraceContext() {
    return traceStore.getStore() || null;
}

/**
 * Get trace ID from current context
 */
function getTraceId() {
    const ctx = getTraceContext();
    return ctx?.trace_id || null;
}

/**
 * Update current trace context with additional data
 */
function updateTraceContext(updates) {
    const ctx = getTraceContext();
    if (ctx) {
        Object.assign(ctx, updates);
    }
}

/**
 * Calculate elapsed time since trace started
 */
function getTraceElapsed() {
    const ctx = getTraceContext();
    return ctx ? Date.now() - ctx.started_at : 0;
}

module.exports = {
    runWithTrace,
    getTraceContext,
    getTraceId,
    updateTraceContext,
    getTraceElapsed
};
