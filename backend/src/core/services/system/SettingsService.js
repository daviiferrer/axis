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
}

module.exports = SettingsService;
