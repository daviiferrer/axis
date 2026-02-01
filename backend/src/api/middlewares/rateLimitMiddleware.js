/**
 * Rate Limiting Middleware
 * Protects API endpoints from abuse and DDoS attacks
 */
const rateLimit = require('express-rate-limit');
const {
    API_RATE_LIMIT_WINDOW_MS,
    API_RATE_LIMIT_MAX_REQUESTS,
    WEBHOOK_RATE_LIMIT_WINDOW_MS,
    WEBHOOK_RATE_LIMIT_MAX_REQUESTS
} = require('../../config/constants');

/**
 * Standard API rate limiter
 * 100 requests per 15 minutes per IP
 */
const apiLimiter = rateLimit({
    windowMs: API_RATE_LIMIT_WINDOW_MS,
    max: API_RATE_LIMIT_MAX_REQUESTS,
    message: {
        error: 'Too many requests',
        message: 'Please try again later.',
        retryAfter: Math.ceil(API_RATE_LIMIT_WINDOW_MS / 1000 / 60) + ' minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        // Use user ID if authenticated, otherwise IP
        return req.user?.id || req.ip;
    },
    skip: (req) => {
        // Skip rate limiting for health checks
        return req.path === '/health' || req.path === '/api/health';
    }
});

/**
 * Webhook rate limiter (higher throughput)
 * 50 requests per second per IP
 */
const webhookLimiter = rateLimit({
    windowMs: WEBHOOK_RATE_LIMIT_WINDOW_MS,
    max: WEBHOOK_RATE_LIMIT_MAX_REQUESTS,
    message: {
        error: 'Webhook rate limit exceeded',
        message: 'Too many webhook requests.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

/**
 * Strict limiter for sensitive operations (auth, billing)
 * 10 requests per 15 minutes per IP
 */
const strictLimiter = rateLimit({
    windowMs: API_RATE_LIMIT_WINDOW_MS,
    max: 10,
    message: {
        error: 'Too many attempts',
        message: 'Please wait before trying again.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

/**
 * AI endpoint limiter (expensive operations)
 * 30 requests per 15 minutes per user
 */
const aiLimiter = rateLimit({
    windowMs: API_RATE_LIMIT_WINDOW_MS,
    max: 30,
    message: {
        error: 'AI rate limit exceeded',
        message: 'Please wait before making more AI requests.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        // Always rate limit by user for AI endpoints
        return req.user?.id || req.ip;
    }
});

module.exports = {
    apiLimiter,
    webhookLimiter,
    strictLimiter,
    aiLimiter
};
