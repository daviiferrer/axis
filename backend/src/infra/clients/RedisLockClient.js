const Redis = require('ioredis');
const Redlock = require('redlock').default;
const logger = require('../../shared/Logger').createModuleLogger('redis-lock');

/**
 * RedisLockClient - Distributed Locking for Multi-Instance Scalability
 * 
 * Uses Redlock algorithm to ensure only one instance processes a resource
 * at a time, even across multiple server instances.
 */
class RedisLockClient {
    constructor({ systemConfig } = {}) {
        const redisUrl = systemConfig?.redisUrl || process.env.REDIS_URL;

        if (!redisUrl) {
            logger.warn('REDIS_URL not configured - distributed locking disabled');
            this.enabled = false;
            return;
        }

        try {
            this.redis = new Redis(redisUrl, {
                maxRetriesPerRequest: 3,
                retryDelayOnFailover: 100,
                lazyConnect: true
            });

            this.redlock = new Redlock([this.redis], {
                driftFactor: 0.01,
                retryCount: 3,
                retryDelay: 200,
                retryJitter: 100,
                automaticExtensionThreshold: 500
            });

            this.enabled = true;

            // Event handlers
            this.redis.on('connect', () => logger.info('✅ Redis connected'));
            this.redis.on('error', (err) => logger.error({ error: err.message }, '❌ Redis error'));

            this.redlock.on('error', (error) => {
                // Ignore resource locked errors (expected behavior)
                if (error.name !== 'LockError') {
                    logger.error({ error: error.message }, 'Redlock error');
                }
            });

            logger.info('🔒 RedisLockClient initialized');
        } catch (error) {
            logger.error({ error: error.message }, 'Failed to initialize Redis');
            this.enabled = false;
        }
    }

    /**
     * Acquire a distributed lock on a resource
     * @param {string} resource - Resource identifier (e.g., phone number)
     * @param {number} ttlMs - Lock time-to-live in milliseconds (default: 30s)
     * @returns {Promise<object|null>} - Lock object or null if not acquired
     */
    async acquireLock(resource, ttlMs = 30000) {
        if (!this.enabled) return null;

        try {
            const lock = await this.redlock.acquire([`lock:${resource}`], ttlMs);
            logger.debug({ resource, ttlMs }, '🔐 Lock acquired');
            return lock;
        } catch (error) {
            // Lock is already held by another process - this is expected
            if (error.name === 'LockError') {
                logger.debug({ resource }, '⏳ Lock already held');
                return null;
            }
            logger.error({ resource, error: error.message }, 'Failed to acquire lock');
            return null;
        }
    }

    /**
     * Release a lock
     * @param {object} lock - Lock object from acquireLock
     */
    async releaseLock(lock) {
        if (!lock || !this.enabled) return;

        try {
            await lock.release();
            logger.debug('🔓 Lock released');
        } catch (error) {
            // Lock may have expired - this is fine
            logger.debug({ error: error.message }, 'Lock release warning (may have expired)');
        }
    }

    /**
     * Extend lock TTL
     * @param {object} lock - Lock object
     * @param {number} ttlMs - New TTL
     */
    async extendLock(lock, ttlMs = 30000) {
        if (!lock || !this.enabled) return null;

        try {
            return await lock.extend(ttlMs);
        } catch (error) {
            logger.warn({ error: error.message }, 'Failed to extend lock');
            return null;
        }
    }

    /**
     * Graceful shutdown
     */
    async disconnect() {
        if (this.redis) {
            await this.redis.quit();
            logger.info('Redis disconnected');
        }
    }
}

module.exports = RedisLockClient;
