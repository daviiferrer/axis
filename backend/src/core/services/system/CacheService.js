/**
 * CacheService - Core Service for In-memory Caching & Distributed Locking
 * 
 * Implements:
 * - LID Mapping Cache (ephemeral)
 * - Composing State (anti-collision)
 * - Fencing Tokens (split-brain prevention)
 * 
 * @see Research: Fencing tokens prevent split-brain in distributed workflows
 */
const logger = require('../../../shared/Logger').createModuleLogger('cache');

// Composing state cache (Anti-Collision System)
const composingCache = new Map();
const COMPOSING_COOLDOWN_MS = 3000; // 3 seconds after last composing event

// Fencing token store (in-memory fallback when Redis unavailable)
const fenceTokens = new Map();
let globalFenceCounter = 0;

class CacheService {
    constructor({ redisClient } = {}) {
        this.lidCache = new Map();
        this.tokenCache = new Map();
        this.redis = redisClient; // Optional Redis client for distributed locks
    }

    // --- LID Mapping ---
    getLidMapping(lid) {
        return this.lidCache.get(lid);
    }

    setLidMapping(lid, jid) {
        this.lidCache.set(lid, jid);
    }

    clearLidCache() {
        this.lidCache.clear();
    }

    // ==========================================
    // FENCING TOKENS - Split-Brain Prevention
    // ==========================================

    /**
     * Acquire a lock with a fencing token.
     * Returns null if lock cannot be acquired.
     * 
     * The fencing token is a monotonically increasing number that MUST be
     * passed to all write operations. Storage layers should reject writes
     * with stale tokens.
     * 
     * @param {string} key - Lock key (e.g., "workflow:lead-123")
     * @param {number} ttlMs - Lock TTL in milliseconds
     * @returns {Promise<{key: string, fenceToken: number} | null>}
     * 
     * @see https://levelup.gitconnected.com/fencing-tokens
     */
    async acquireLockWithFence(key, ttlMs = 30000) {
        try {
            if (this.redis) {
                return await this.#acquireRedisLock(key, ttlMs);
            } else {
                return this.#acquireLocalLock(key, ttlMs);
            }
        } catch (error) {
            logger.error({ key, error: error.message }, 'Failed to acquire lock');
            return null;
        }
    }

    /**
     * Release a lock.
     * @param {string} key - Lock key
     * @param {number} fenceToken - The fence token received when acquiring
     */
    async releaseLock(key, fenceToken) {
        try {
            if (this.redis) {
                // Only delete if our token matches current
                const currentToken = await this.redis.get(`fence:${key}`);
                if (parseInt(currentToken) === fenceToken) {
                    await this.redis.del(`lock:${key}`);
                    logger.debug({ key, fenceToken }, 'Lock released');
                }
            } else {
                const lock = fenceTokens.get(key);
                if (lock && lock.fenceToken === fenceToken) {
                    fenceTokens.delete(key);
                    logger.debug({ key, fenceToken }, 'Local lock released');
                }
            }
        } catch (error) {
            logger.warn({ key, error: error.message }, 'Error releasing lock');
        }
    }

    /**
     * Check if a fence token is still valid (not superseded).
     * Use this before committing writes to database.
     * 
     * @param {string} key - Lock key
     * @param {number} fenceToken - Token to validate
     * @returns {Promise<boolean>}
     */
    async isFenceTokenValid(key, fenceToken) {
        try {
            if (this.redis) {
                const currentToken = await this.redis.get(`fence:${key}`);
                return parseInt(currentToken) === fenceToken;
            } else {
                const lock = fenceTokens.get(key);
                return lock && lock.fenceToken === fenceToken;
            }
        } catch (error) {
            logger.error({ key, error: error.message }, 'Error validating fence token');
            return false; // Fail-safe: reject writes if we can't verify
        }
    }

    /**
     * Get current fence token for a key (for comparison in queries).
     * @param {string} key - Lock key
     * @returns {Promise<number | null>}
     */
    async getCurrentFenceToken(key) {
        try {
            if (this.redis) {
                const token = await this.redis.get(`fence:${key}`);
                return token ? parseInt(token) : null;
            } else {
                const lock = fenceTokens.get(key);
                return lock ? lock.fenceToken : null;
            }
        } catch (error) {
            return null;
        }
    }

    /**
     * Acquire lock using Redis (distributed mode).
     * Uses SETNX with global incrementing fence token.
     */
    async #acquireRedisLock(key, ttlMs) {
        // Increment global fence token atomically
        const fenceToken = await this.redis.incr('fence:global');

        // Try to set lock with NX (only if not exists)
        const acquired = await this.redis.set(`lock:${key}`, fenceToken, 'PX', ttlMs, 'NX');

        if (!acquired) {
            // Lock already held by another worker
            logger.debug({ key }, 'Lock acquisition failed - already held');
            return null;
        }

        // Store fence token for this lock
        await this.redis.set(`fence:${key}`, fenceToken, 'PX', ttlMs);

        logger.debug({ key, fenceToken, ttlMs }, 'Redis lock acquired with fence token');
        return { key, fenceToken };
    }

    /**
     * Acquire lock using local memory (single-instance fallback).
     */
    #acquireLocalLock(key, ttlMs) {
        const existing = fenceTokens.get(key);
        const now = Date.now();

        // Check if existing lock is expired
        if (existing && (now - existing.timestamp) < ttlMs) {
            logger.debug({ key }, 'Local lock acquisition failed - already held');
            return null;
        }

        // Increment global fence token
        globalFenceCounter++;
        const fenceToken = globalFenceCounter;

        fenceTokens.set(key, {
            fenceToken,
            timestamp: now,
            ttlMs
        });

        // Auto-cleanup after TTL
        setTimeout(() => {
            const lock = fenceTokens.get(key);
            if (lock && lock.fenceToken === fenceToken) {
                fenceTokens.delete(key);
            }
        }, ttlMs);

        logger.debug({ key, fenceToken, ttlMs }, 'Local lock acquired with fence token');
        return { key, fenceToken };
    }

    /**
     * Get cache statistics for monitoring.
     */
    getStats() {
        return {
            lidCacheSize: this.lidCache.size,
            composingCacheSize: composingCache.size,
            activeLocks: fenceTokens.size,
            globalFenceCounter: this.redis ? 'redis' : globalFenceCounter
        };
    }
}

// --- Anti-Collision: Composing State Management ---
/**
 * Mark a chat as currently composing (typing)
 */
function setComposing(chatId) {
    composingCache.set(chatId, Date.now());
    logger.debug({ chatId }, 'Composing state set');
}

/**
 * Clear composing state for a chat
 */
function clearComposing(chatId) {
    composingCache.delete(chatId);
    logger.debug({ chatId }, 'Composing state cleared');
}

/**
 * Check if a chat is currently composing (within cooldown period)
 */
function isComposing(chatId) {
    const timestamp = composingCache.get(chatId);
    if (!timestamp) return false;

    const elapsed = Date.now() - timestamp;
    if (elapsed >= COMPOSING_COOLDOWN_MS) {
        composingCache.delete(chatId); // Auto-cleanup
        return false;
    }
    return true;
}

/**
 * Get remaining cooldown time (for logging/debugging)
 */
function getComposingCooldown(chatId) {
    const timestamp = composingCache.get(chatId);
    if (!timestamp) return 0;
    return Math.max(0, COMPOSING_COOLDOWN_MS - (Date.now() - timestamp));
}

module.exports = CacheService;
module.exports.composingCache = { setComposing, clearComposing, isComposing, getComposingCooldown };
module.exports.lidCache = new Map(); // Legacy export for backwards compat

