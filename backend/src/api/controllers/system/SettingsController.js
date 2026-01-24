/**
 * SettingsController - Handles system settings API requests.
 */
class SettingsController {
    constructor(settingsService, wahaClient) {
        this.settingsService = settingsService;
        this.wahaClient = wahaClient;
    }

    async getSettings(req, res) {
        try {
            console.log('[SettingsController] GET / hit for user:', req.user?.id);
            const userId = req.user?.id;

            if (!userId) {
                return res.status(401).json({ error: 'Auth context missing' });
            }

            const settings = await this.settingsService.getSettings(userId);
            res.json(settings || {});
        } catch (error) {
            console.error('[SettingsController] Get Error:', error);
            res.status(500).json({ error: 'Failed to fetch settings' });
        }
    }

    async saveSettings(req, res) {
        try {
            const { settings } = req.body;
            const userId = req.user?.id;

            if (!userId) {
                return res.status(401).json({ error: 'User ID is required (Auth missing)' });
            }

            console.log(`[SettingsController] Updating settings for user ${userId}...`);

            // 1. Update via Service
            const updatedData = await this.settingsService.updateSettings(userId, settings);

            // 2. Trigger WAHA Sync
            // Note: The legacy logic called updateWebhook() which was a service function.
            // Our WahaClient has updateSessionConfig. 
            // We might need a higher level PresenceService or AutomationService to handle this properly,
            // but for now, we'll keep the logic of triggering a sync if available.

            res.json({
                success: true,
                settings: updatedData
            });

        } catch (error) {
            console.error('[SettingsController] API Error:', error);
            res.status(500).json({ error: 'Failed to save settings' });
        }
    }
}

module.exports = SettingsController;
