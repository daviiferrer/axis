import api from './api';

export const profileService = {
    /**
     * Updates the user's API key for a specific provider.
     * @param provider 'gemini' | 'openai' | 'anthropic' | 'apify' | 'meta'
     * @param key The API Key string
     */
    updateApiKey: async (provider: string, key: string) => {
        const response = await api.put('/user/params', { provider, key });
        return response.data;
    },

    /**
     * Checks if the user has an API key configured for a specific provider.
     * @param provider 'gemini' | 'openai' | 'anthropic' | 'apify' | 'meta'
     * @returns { hasKey: boolean }
     */
    hasApiKey: async (provider: string) => {
        const response = await api.get(`/user/params/${provider}`);
        return response.data; // { hasKey: boolean }
    }
};
