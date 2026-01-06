/**
 * CacheService - Core Service for In-memory Caching
 */
const logger = require('../../../shared/Logger').createModuleLogger('cache');

// Composing state cache (Anti-Collision System)
const composingCache = new Map();
const COMPOSING_COOLDOWN_MS = 3000; // 3 seconds after last composing event

class CacheService {
    constructor() {
        this.lidCache = new Map();
        this.tokenCache = new Map();
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
