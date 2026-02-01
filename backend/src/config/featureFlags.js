/**
 * Feature Flags Configuration
 * Controls feature availability across the application
 */

module.exports = {
    /**
     * Enable BullMQ for asynchronous job processing
     * When false: Uses simple polling (suitable for single-instance deployments)
     * When true: Uses BullMQ queues (required for multi-instance deployments)    ENABLE_BULLMQ: true, // FORCE ENABLED

    /**
     * Enable Redis distributed locking
     * When false: Uses in-memory locks (single-instance only)
     * When true: Uses Redis locks (multi-instance safe)
     */
    ENABLE_REDIS_LOCK: process.env.ENABLE_REDIS_LOCK === 'true' || !!process.env.REDIS_URL,

    /**
     * Enable presence monitoring
     * When false: No automatic presence subscription
     * When true: Periodically syncs lead presence from WhatsApp
     */
    ENABLE_PRESENCE_MONITORING: process.env.ENABLE_PRESENCE_MONITORING !== 'false', // Default true

    /**
     * Enable strict rate limiting
     * When false: No rate limiting applied
     * When true: Applies rate limiting to all API routes
     */
    ENABLE_RATE_LIMITING: process.env.ENABLE_RATE_LIMITING === 'true' || process.env.NODE_ENV === 'production',

    /**
     * Enable development bypass for RBAC
     * Only works in development mode
     */
    RBAC_BYPASS: process.env.RBAC_BYPASS === 'true' && process.env.NODE_ENV === 'development',

    /**
     * Enable neural credit consumption tracking
     * When false: AI usage is not metered
     * When true: Deducts neural credits per AI call
     */
    ENABLE_NEURAL_CREDITS: process.env.ENABLE_NEURAL_CREDITS !== 'false', // Default true

    /**
     * Enable circuit breaker for external APIs
     * When false: No circuit breaker protection
     * When true: Automatic fallback when error threshold reached
     */
    ENABLE_CIRCUIT_BREAKER: process.env.ENABLE_CIRCUIT_BREAKER !== 'false' // Default true
};
