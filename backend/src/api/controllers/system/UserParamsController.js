/**
 * UserParamsController - Handles user profile parameters (API Keys).
 */
class UserParamsController {
    constructor({ supabaseClient }) {
        this.supabase = supabaseClient;
    }

    /**
     * Updates the user's API key.
     * PUT /v1/user/params
     * Body: { provider: 'gemini', key: '...' }
     */
    async updateApiKey(req, res) {
        try {
            const userId = req.user?.id;
            const { provider, key } = req.body;

            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            if (!provider || !key) {
                return res.status(400).json({ error: 'Provider and Key are required' });
            }

            // Map provider to column name
            const keyMap = {
                'gemini': 'gemini_api_key',
                'apify': 'apify_token',
                'meta': 'meta_capi_token'
            };

            const columnName = keyMap[provider.toLowerCase()];

            if (!columnName) {
                return res.status(400).json({ error: 'Invalid provider' });
            }

            console.log(`[UserParamsController] Updating ${columnName} for user ${userId}...`);

            const { data, error } = await this.supabase
                .from('profiles')
                .update({ [columnName]: key })
                .eq('id', userId)
                .select()
                .maybeSingle();

            if (!data) {
                console.warn(`[UserParamsController] No profile found for user ${userId} to update.`);
                // Optionally create it? For now just return error or success false
                return res.status(404).json({ error: 'Profile not found' });
            }

            if (error) {
                console.error('[UserParamsController] Update Error:', error);
                return res.status(500).json({ error: 'Failed to update API key' });
            }

            return res.json({ success: true, message: 'API Key updated successfully' });

        } catch (error) {
            console.error('[UserParamsController] Error:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    /**
     * Check if user has an API key for a provider.
     * GET /v1/user/params/:provider
     */
    async hasApiKey(req, res) {
        try {
            const userId = req.user?.id;
            const { provider } = req.params;

            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const keyMap = {
                'gemini': 'gemini_api_key',
                'apify': 'apify_token',
                'meta': 'meta_capi_token'
            };

            const columnName = keyMap[provider?.toLowerCase()];

            if (!columnName) {
                return res.status(400).json({ error: 'Invalid provider' });
            }

            const { data, error } = await this.supabase
                .from('profiles')
                .select(columnName)
                .eq('id', userId)
                .single();

            if (error) {
                return res.status(500).json({ error: 'Failed to check API key' });
            }

            const hasKey = !!data?.[columnName] && data[columnName].length > 5;

            return res.json({ hasKey });

        } catch (error) {
            console.error('[UserParamsController] Error:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
}

module.exports = UserParamsController;
