/**
 * Metrics Middleware - Native request metrics collection
 * 
 * Collects:
 * - Request count by route
 * - Response time (P50, P95, P99)
 * - Error rate by status code
 * 
 * Low overhead: ~0.5ms per request (in-memory Map)
 */
const logger = require('../../shared/Logger').createModuleLogger('metrics');

// In-memory metrics store (resets on restart)
const metrics = {
    requests: new Map(),       // route -> { count, total_ms, min_ms, max_ms }
    errors: new Map(),         // route:status -> count
    latencies: new Map(),      // route -> [array of latencies for percentile calc]
    startTime: Date.now()
};

const MAX_LATENCY_SAMPLES = 1000; // Keep last N samples per route

function metricsMiddleware(req, res, next) {
    const start = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - start;
        const route = req.route?.path || req.path || 'unknown';
        const key = `${req.method}:${route}`;

        // Update request metrics
        const current = metrics.requests.get(key) || {
            count: 0,
            total_ms: 0,
            min_ms: Infinity,
            max_ms: 0
        };
        current.count++;
        current.total_ms += duration;
        current.min_ms = Math.min(current.min_ms, duration);
        current.max_ms = Math.max(current.max_ms, duration);
        metrics.requests.set(key, current);

        // Track latencies for percentile calculation
        let latencies = metrics.latencies.get(key) || [];
        latencies.push(duration);
        if (latencies.length > MAX_LATENCY_SAMPLES) {
            latencies = latencies.slice(-MAX_LATENCY_SAMPLES);
        }
        metrics.latencies.set(key, latencies);

        // Track errors (4xx, 5xx)
        if (res.statusCode >= 400) {
            const errKey = `${key}:${res.statusCode}`;
            metrics.errors.set(errKey, (metrics.errors.get(errKey) || 0) + 1);
        }

        // Log slow requests (> 2s)
        if (duration > 2000) {
            logger.warn({ route: key, duration_ms: duration, status: res.statusCode }, 'Slow request detected');
        }
    });

    next();
}

/**
 * Calculate percentile from array of latencies
 */
function percentile(arr, p) {
    if (arr.length === 0) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const idx = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, idx)];
}

/**
 * Get aggregated metrics for API endpoint
 */
function getMetrics() {
    const requestStats = {};

    for (const [route, stats] of metrics.requests.entries()) {
        const latencies = metrics.latencies.get(route) || [];
        requestStats[route] = {
            count: stats.count,
            avg_ms: Math.round(stats.total_ms / stats.count),
            min_ms: stats.min_ms === Infinity ? 0 : stats.min_ms,
            max_ms: stats.max_ms,
            p50_ms: percentile(latencies, 50),
            p95_ms: percentile(latencies, 95),
            p99_ms: percentile(latencies, 99)
        };
    }

    const errorStats = {};
    for (const [key, count] of metrics.errors.entries()) {
        errorStats[key] = count;
    }

    // Calculate total error rate
    let totalRequests = 0;
    let totalErrors = 0;
    for (const stats of metrics.requests.values()) {
        totalRequests += stats.count;
    }
    for (const count of metrics.errors.values()) {
        totalErrors += count;
    }

    return {
        uptime_seconds: Math.floor((Date.now() - metrics.startTime) / 1000),
        total_requests: totalRequests,
        total_errors: totalErrors,
        error_rate: totalRequests > 0 ? ((totalErrors / totalRequests) * 100).toFixed(2) + '%' : '0%',
        routes: requestStats,
        errors_by_route: errorStats,
        collected_at: new Date().toISOString()
    };
}

/**
 * Reset metrics (useful for testing)
 */
function resetMetrics() {
    metrics.requests.clear();
    metrics.errors.clear();
    metrics.latencies.clear();
    metrics.startTime = Date.now();
}

module.exports = {
    metricsMiddleware,
    getMetrics,
    resetMetrics
};
