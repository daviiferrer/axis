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
            const { userId } = req.query; // Or from auth middleware // TODO: standardized auth access
            // Logic: Get global settings, or user specific if needed.
            // For Super Admin, we usually want the global one row.
            const settings = await this.settingsService.getSettings(userId);
            res.json(settings || {});
        } catch (error) {
            console.error('[SettingsController] Get Error:', error);
            res.status(500).json({ error: 'Failed to fetch settings' });
        }
    }

    async saveSettings(req, res) {
        try {
            const { userId, settings } = req.body;

            if (!userId) {
                return res.status(400).json({ error: 'User ID is required' });
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
