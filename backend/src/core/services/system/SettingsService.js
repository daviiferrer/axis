/**
 * SettingsService - Core Service for System Configuration
 */
const logger = require('../../../shared/Logger').createModuleLogger('settings');

class SettingsService {
    constructor({ supabaseClient }) {
        this.supabase = supabaseClient;
    }

    /**
     * Fetches system settings.
     */
    async getSettings(userId = null) {
        let query = this.supabase.from('system_settings').select('*');

        if (userId) {
            // RLS now enforces access. We just query.
            // If user is admin/owner, they see global settings (limit 1).
            // If user is member, they see nothing (RLS blocks).
            query = query.limit(1).maybeSingle();
        } else {
            query = query.limit(1).maybeSingle();
        }

        const { data, error } = await query;
        if (error) {
            logger.error({ error: error.message }, 'Error fetching settings');
            return null;
        }
        return data;
    }

    /**
     * Updates system settings for a specific user.
     */
    async updateSettings(userId, updates) {
        const { data, error } = await this.supabase
            .from('system_settings')
            // For system settings, we assume a single global row or company-bound row.
            // Removing strict user_id bind allows any admin to update the shared settings.
            .upsert({ ...updates }, { onConflict: 'id' }) // Assuming ID matches or only 1 row
            .select()
            .single();

        if (error) {
            logger.error({ error: error.message }, 'Error updating settings');
            throw error;
        }
        return data;
    }

    /**
     * Validates if a provider API key exists for a user.
     * @param {string} userId - User ID to check.
     * @param {string} provider - Provider name: 'gemini', 'openai', 'anthropic'.
     * @returns {{ valid: boolean, keyName: string }}
     */
    async validateProviderKey(userId, provider) {
        const settings = await this.getSettings(userId);
        if (!settings) {
            return { valid: false, keyName: this.#getKeyName(provider) };
        }

        const keyName = this.#getKeyName(provider);
        const keyValue = settings[keyName];

        const valid = !!keyValue && keyValue.length > 10;

        if (!valid) {
            logger.warn({ userId, provider, keyName }, 'Missing API key for provider');
        }

        return { valid, keyName };
    }

    /**
     * Get the database column name for a provider's API key.
     */
    #getKeyName(provider) {
        const keyMap = {
            'gemini': 'gemini_api_key',
            'openai': 'openai_api_key',
            'anthropic': 'anthropic_api_key',
            'claude': 'anthropic_api_key',
            'apify': 'apify_token',
            'meta': 'meta_capi_token'
        };
        return keyMap[provider?.toLowerCase()] || 'gemini_api_key';
    }

    /**
     * Get API key for a specific provider.
     */
    async getProviderKey(userId, provider) {
        const settings = await this.getSettings(userId);
        if (!settings) return null;

        const keyName = this.#getKeyName(provider);
        return settings[keyName] || null;
    }

    // ============================================
    // NEW: Configuration Getters with Defaults
    // ============================================

    /**
     * Get Langfuse host URL.
     */
    async getLangfuseHost(userId = null) {
        const settings = await this.getSettings(userId);
        return settings?.langfuse_host || 'https://cloud.langfuse.com';
    }

    /**
     * Get Redis URL.
     */
    async getRedisUrl(userId = null) {
        const settings = await this.getSettings(userId);
        return settings?.redis_url || process.env.REDIS_URL || 'redis://localhost:6379';
    }

    /**
     * Get Meta Graph API version.
     */
    async getMetaApiVersion(userId = null) {
        const settings = await this.getSettings(userId);
        return settings?.meta_api_version || 'v18.0';
    }

    /**
     * Get default CTA URL for guardrail injection.
     */
    async getDefaultCtaUrl(userId = null) {
        const settings = await this.getSettings(userId);
        return settings?.default_cta_url || null;
    }

    /**
     * Get RAG configuration.
     */
    async getRagConfig(userId = null) {
        const settings = await this.getSettings(userId);
        return settings?.rag_config || {
            rrf_k: 60,
            semantic_limit: 50,
            lexical_limit: 50,
            final_limit: 5
        };
    }

    /**
     * Get composing cooldown in milliseconds.
     */
    async getComposingCooldown(userId = null) {
        const settings = await this.getSettings(userId);
        return settings?.composing_cooldown_ms || 3000;
    }

    /**
     * Get embedding cache configuration.
     */
    async getEmbeddingCacheConfig(userId = null) {
        const settings = await this.getSettings(userId);
        return settings?.embedding_cache_config || {
            max_size: 1000,
            ttl_ms: 3600000
        };
    }

    /**
     * Get persona refresh configuration.
     */
    async getPersonaRefreshConfig(userId = null) {
        const settings = await this.getSettings(userId);
        return settings?.persona_refresh_config || {
            threshold: 6,
            interval: 4
        };
    }

    /**
     * Get canary TTL in milliseconds.
     */
    async getCanaryTtl(userId = null) {
        const settings = await this.getSettings(userId);
        return settings?.canary_ttl_ms || 300000;
    }

    /**
     * Get max response length.
     */
    async getMaxResponseLength(userId = null) {
        const settings = await this.getSettings(userId);
        return settings?.max_response_length || 500;
    }

    /**
     * Get workflow max retries.
     */
    async getWorkflowMaxRetries(userId = null) {
        const settings = await this.getSettings(userId);
        return settings?.workflow_max_retries || 3;
    }

    /**
     * Get workflow cleanup days.
     */
    async getWorkflowCleanupDays(userId = null) {
        const settings = await this.getSettings(userId);
        return settings?.workflow_cleanup_days || 30;
    }

    /**
     * Get scraping max pages.
     */
    async getScrapingMaxPages(userId = null) {
        const settings = await this.getSettings(userId);
        return settings?.scraping_max_pages || 5;
    }

    /**
     * Get scraping stale days.
     */
    async getScrapingStaleDays(userId = null) {
        const settings = await this.getSettings(userId);
        return settings?.scraping_stale_days || 7;
    }

    // ============================================
    // Phase 2: Additional Env Var Migrations
    // ============================================

    /**
     * Get WAHA API key.
     */
    async getWahaApiKey(userId = null) {
        const settings = await this.getSettings(userId);
        return settings?.waha_api_key || process.env.WHATSAPP_API_KEY || null;
    }

    /**
     * Get CORS origin.
     */
    async getCorsOrigin(userId = null) {
        const settings = await this.getSettings(userId);
        return settings?.cors_origin || process.env.CORS_ORIGIN || '*';
    }

    /**
     * Check if BullMQ is enabled.
     */
    async isBullMQEnabled(userId = null) {
        const settings = await this.getSettings(userId);
        if (settings?.enable_bullmq !== undefined) {
            return settings.enable_bullmq;
        }
        return process.env.ENABLE_BULLMQ === 'true';
    }

    /**
     * Get Meta App ID.
     */
    async getMetaAppId(userId = null) {
        const settings = await this.getSettings(userId);
        return settings?.meta_app_id || process.env.META_APP_ID || null;
    }

    /**
     * Get Meta App Secret.
     */
    async getMetaAppSecret(userId = null) {
        const settings = await this.getSettings(userId);
        return settings?.meta_app_secret || null;
    }

    // ============================================
    // Phase 3: Full Database-Driven Configuration
    // ============================================

    /**
     * Get Langfuse public key.
     */
    async getLangfusePublicKey(userId = null) {
        const settings = await this.getSettings(userId);
        return settings?.langfuse_public_key || null;
    }

    /**
     * Get Langfuse secret key.
     */
    async getLangfuseSecretKey(userId = null) {
        const settings = await this.getSettings(userId);
        return settings?.langfuse_secret_key || null;
    }

    /**
     * Get Inngest event key.
     */
    async getInngestEventKey(userId = null) {
        const settings = await this.getSettings(userId);
        return settings?.inngest_event_key || 'axis-dev-key';
    }

    /**
     * Get queue concurrency.
     */
    async getQueueConcurrency(userId = null) {
        const settings = await this.getSettings(userId);
        return settings?.queue_concurrency || 5;
    }

    /**
     * Get log level.
     */
    async getLogLevel(userId = null) {
        const settings = await this.getSettings(userId);
        return settings?.log_level || 'info';
    }

    /**
     * Get WAHA Dashboard username.
     */
    async getWahaDashboardUsername(userId = null) {
        const settings = await this.getSettings(userId);
        return settings?.waha_dashboard_username || 'admin';
    }

    /**
     * Get WAHA Dashboard password.
     */
    async getWahaDashboardPassword(userId = null) {
        const settings = await this.getSettings(userId);
        return settings?.waha_dashboard_password || null;
    }
}

module.exports = SettingsService;
