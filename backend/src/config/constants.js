/**
 * Constants Configuration
 * Centralizes magic numbers and configuration values for maintainability
 */

module.exports = {
    // ============================================
    // TIMING CONFIGURATION
    // ============================================

    /** TTL for message deduplication cache (prevents double-processing webhooks) */
    MESSAGE_DEDUP_TTL_MS: 30000, // 30 seconds

    /** Interval for WorkflowEngine polling loop */
    WORKFLOW_PULSE_INTERVAL_MS: 10000, // 10 seconds

    /** Interval for timer recovery (checks expired DelayNode timers) */
    TIMER_RECOVERY_INTERVAL_MS: 15000, // 15 seconds

    /** Default TTL for distributed locks */
    DEFAULT_LOCK_TTL_MS: 60000, // 60 seconds

    /** Composing cache TTL (anti-collision with user typing) */
    COMPOSING_CACHE_TTL_MS: 30000, // 30 seconds

    // ============================================
    // LIMITS
    // ============================================

    /** Maximum workflow steps per execution (prevents infinite loops) */
    MAX_WORKFLOW_STEPS: 5,

    /** Maximum messages to load from chat history */
    MAX_HISTORY_MESSAGES: 15,

    /** Maximum retries for failed operations */
    MAX_RETRIES: 3,

    /** Maximum concurrent workflow processing per campaign */
    MAX_CONCURRENT_LEADS_PER_CAMPAIGN: 10,

    // ============================================
    // AI CONFIGURATION
    // ============================================

    /** Decay factor for lead temperature (sentiment tracking) */
    TEMPERATURE_DECAY_FACTOR: 0.8,

    /** Weight of current sentiment in temperature calculation */
    SENTIMENT_WEIGHT: 0.2,

    /** Default confidence threshold for intent classification */
    INTENT_CONFIDENCE_THRESHOLD: 0.7,

    /** Circuit breaker error threshold percentage */
    CIRCUIT_BREAKER_ERROR_THRESHOLD: 70,

    /** Circuit breaker reset timeout */
    CIRCUIT_BREAKER_RESET_MS: 30000,

    // ============================================
    // HUMANIZATION (Anti-Ban)
    // ============================================

    /** Base delay per word for message sending (ms) */
    TYPING_DELAY_PER_WORD_MS: 300,

    /** Minimum delay before sending message (ms) */
    MIN_TYPING_DELAY_MS: 2500,

    /** Maximum delay before sending message (ms) */
    MAX_TYPING_DELAY_MS: 15000,

    /** Jitter factor range for randomization (0.85-1.15 = ±15%) */
    JITTER_MIN: 0.85,
    JITTER_MAX: 1.15,

    // ============================================
    // BUSINESS HOURS (Brazil timezone assumed)
    // ============================================

    /** Business hours start (24h format) */
    BUSINESS_START_HOUR: 8,

    /** Business hours end (24h format) */
    BUSINESS_END_HOUR: 20,

    /** Weekend days (0 = Sunday, 6 = Saturday) */
    WEEKEND_DAYS: [0, 6],

    // ============================================
    // RATE LIMITING
    // ============================================

    /** API rate limit window (ms) */
    API_RATE_LIMIT_WINDOW_MS: 15 * 60 * 1000, // 15 minutes

    /** Maximum API requests per window */
    API_RATE_LIMIT_MAX_REQUESTS: 100,

    /** Webhook rate limit window (ms) */
    WEBHOOK_RATE_LIMIT_WINDOW_MS: 1000, // 1 second

    /** Maximum webhooks per window */
    WEBHOOK_RATE_LIMIT_MAX_REQUESTS: 50
};
