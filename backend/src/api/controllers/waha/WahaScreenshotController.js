class WahaScreenshotController {
    constructor(wahaClient) {
        this.waha = wahaClient;
    }

    async getScreenshot(req, res) {
        try {
            const result = await this.waha.getScreenshot(req.query.session || 'default');
            res.json({ base64: result });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = WahaScreenshotController;
