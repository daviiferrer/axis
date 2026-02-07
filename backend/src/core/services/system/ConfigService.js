const logger = require('../../../shared/Logger').createModuleLogger('config-service');

class ConfigService {
    constructor({ supabaseClient } = {}) {
        this.supabase = supabaseClient;
        this.cache = new Map();
        this.cacheTTL = 5 * 60 * 1000; // 5 minutes
        this.defaultSettings = null;
    }

    /**
     * Loads all settings on bootstrap startup.
     * This avoids multiple DB queries for global settings.
     */
    async loadDefaults(userId = null) {
        try {
            let query = this.supabase
                .from('system_settings')
                .select('*');

            if (userId) {
                query = query.eq('user_id', userId);
            } else {
                query = query.is('user_id', null); // Global settings
            }

            const { data, error } = await query.maybeSingle();

            if (error) {
                logger.warn({ error: error.message }, 'Failed to load default settings');
                return null;
            }

            if (!userId) {
                this.defaultSettings = data;
                logger.info('✅ Global system settings loaded');
            }

            return data;

        } catch (error) {
            logger.error({ error: error.message }, 'Settings load error');
            return null;
        }
    }

    /**
     * Get single config value
     * @param {string} key - e.g., 'waha_api_url', 'gemini_api_key'
     * @param {string} userId - Optional user-specific settings
     */
    async get(key, userId = null) {
        if (!key) {
            throw new Error('ConfigService.get: key is required');
        }

        const cacheKey = `${key}:${userId || 'global'}`;

        // 1. Check cache
        const cached = this.#getFromCache(cacheKey);
        if (cached !== undefined) {
            // logger.debug({ key }, 'Config from cache'); // too verbose
            return cached;
        }

        // 2. Try to get from pre-loaded global settings (if applicable)
        if (this.defaultSettings && !userId) {
            const value = this.defaultSettings[key];
            if (value !== undefined && value !== null) {
                this.#setCache(cacheKey, value);
                return value;
            }
        }

        // 3. Query database if not cached or not in defaults
        try {
            let query = this.supabase
                .from('system_settings')
                .select(key);

            if (userId) {
                query = query.eq('user_id', userId);
            } else {
                query = query.is('user_id', null);
            }

            const { data, error } = await query.maybeSingle();

            if (error && error.code !== 'PGRST116') {
                throw error;
            }

            const value = data?.[key] || null;

            if (value !== null) {
                this.#setCache(cacheKey, value);
                logger.debug({ key }, 'Config loaded from DB');
                return value;
            }

            return null;

        } catch (error) {
            logger.error({ key, error: error.message }, 'Failed to get config');
            return null;
        }
    }

    /**
     * Get multiple values at once
     */
    async getMany(keys = [], userId = null) {
        const result = {};

        for (const key of keys) {
            result[key] = await this.get(key, userId);
        }

        return result;
    }

    /**
     * Update/create settings
     */
    async set(key, value, userId = null) {
        try {
            // 1. Prepare payload
            const payload = {
                [key]: value,
                updated_at: new Date()
            };

            if (userId) {
                payload.user_id = userId;
            }

            // 2. Upsert
            // Note: This relies on a unique constraint on user_id (or user_id IS NULL)
            // Ideally system_settings should have a single row per user (or one global row)
            // If the table structure is one-row-per-scope (global/user), this works vertically.
            // If the table is key-value based (row per setting), this needs adjustment.
            // Based on schema provided (columns are keys like 'waha_url'), it IS a wide table.

            const query = this.supabase.from('system_settings');

            // We need to match on user_id or handle the global row (user_id is null)
            // Supabase upsert needs explicit conflict target if not PK
            // Assuming there's a unique constraint on user_id?
            // If not, we might need to find ID first.

            let match = {};
            if (userId) match = { user_id: userId };
            else match = { user_id: null }; // Requires partial index usually, or we find ID first.

            // Safer approach: Check existence first or update based on ID found in loadDefaults logic?
            // Let's look up ID first to be safe about "global" row

            let { data: existing } = await this.supabase
                .from('system_settings')
                .select('id')
                .match(userId ? { user_id: userId } : {})
                .filter('user_id', userId ? 'eq' : 'is', userId || null)
                .maybeSingle();

            if (existing) {
                const { error } = await this.supabase
                    .from('system_settings')
                    .update(payload)
                    .eq('id', existing.id);
                if (error) throw error;
            } else {
                const { error } = await this.supabase
                    .from('system_settings')
                    .insert(payload);
                if (error) throw error;
            }

            // 3. Invalidate cache
            this.#clearCache(key);

            // 4. Reload defaults if global
            if (!userId) {
                await this.loadDefaults();
            }

            logger.info({ key, scope: userId || 'global' }, '✅ Config updated');
            return true;

        } catch (error) {
            logger.error({ key, error: error.message }, 'Failed to set config');
            throw error;
        }
    }

    /**
     * Get all settings for a user/global
     */
    async getSettings(userId = null) {
        try {
            let query = this.supabase
                .from('system_settings')
                .select('*');

            if (userId) {
                query = query.eq('user_id', userId);
            } else {
                query = query.is('user_id', null);
            }

            const { data, error } = await query.maybeSingle();

            if (error && error.code !== 'PGRST116') {
                throw error;
            }

            return data || null;

        } catch (error) {
            logger.error({ error: error.message }, 'Failed to get settings');
            return null;
        }
    }

    // ========== SPECIFIC GETTERS (Convenience) ==========

    async getWahaUrl(userId = null) {
        return await this.get('waha_url', userId) || 'http://waha:3000';
    }

    async getWahaApiUrl(userId = null) {
        // Alias for compatibility
        return this.getWahaUrl(userId);
    }

    async getWahaWebhookUrl(userId = null) {
        return await this.get('waha_webhook_url', userId);
    }

    async getWahaApiKey(userId = null) {
        return await this.get('waha_api_key', userId) || '';
    }

    async getRedisUrl(userId = null) {
        return await this.get('redis_url', userId) || 'redis://localhost:6379';
    }

    async getGeminiApiKey(userId = null) {
        return await this.get('gemini_api_key', userId) || '';
    }

    async getApifyToken(userId = null) {
        return await this.get('apify_token', userId) || '';
    }

    async getCorsOrigin(userId = null) {
        const origins = await this.get('cors_origin', userId) || '*';
        return origins.split(',').map(o => o.trim());
    }

    async getFrontendUrl(userId = null) {
        const env = process.env.NODE_ENV || 'production';
        // In dev, we might prefer local, but let's stick to DB if configured?
        // Or if dev, check `frontend_url_dev` column
        const key = env === 'production' ? 'frontend_url' : 'frontend_url_dev';
        return await this.get(key, userId) || await this.get('frontend_url', userId);
    }

    async getBackendUrl(userId = null) {
        const env = process.env.NODE_ENV || 'production';
        const key = env === 'production' ? 'backend_url' : 'backend_url_dev';
        return await this.get(key, userId) || await this.get('backend_url', userId);
    }

    async getLangfuseHost(userId = null) {
        return await this.get('langfuse_host', userId) || 'https://cloud.langfuse.com';
    }

    async getRagConfig(userId = null) {
        const config = await this.get('rag_config', userId);
        // It's likely already a JSON object if coming from Supabase/Postgres JSONB
        if (typeof config === 'string') {
            try { return JSON.parse(config); } catch (e) { return {}; }
        }
        return config || {
            rrf_k: 60,
            semantic_limit: 50,
            lexical_limit: 50,
            final_limit: 5
        };
    }

    async getLogLevel(userId = null) {
        return await this.get('log_level', userId) || 'info';
    }

    // ========== PRIVATE METHODS ==========

    #getFromCache(key) {
        const cached = this.cache.get(key);
        if (!cached) return undefined;

        // Check expiration
        if (Date.now() - cached.timestamp > this.cacheTTL) {
            this.cache.delete(key);
            return undefined;
        }

        return cached.value;
    }

    #setCache(key, value) {
        this.cache.set(key, {
            value,
            timestamp: Date.now()
        });
    }

    #clearCache(key) {
        // Clear all cache entries for this key (prefix match essentially for user variants)
        // Since we use key:userId, checking startsWith might be risky if keys share prefixes.
        // But our keys are distinct enough.
        for (const cacheKey of this.cache.keys()) {
            if (cacheKey.startsWith(key)) {
                this.cache.delete(cacheKey);
            }
        }
    }

    clearAllCache() {
        this.cache.clear();
        logger.info('Cache cleared');
    }
}

module.exports = ConfigService;
