class WahaScreenshotController {
    constructor(wahaClient) {
        this.waha = wahaClient;
    }

    async getScreenshot(req, res) {
        try {
            const session = req.params.session || req.query.session || 'default';
            const base64 = await this.waha.getScreenshot(session);

            // Convert base64 back to buffer to serve as image
            const imgBuffer = Buffer.from(base64, 'base64');

            res.writeHead(200, {
                'Content-Type': 'image/png',
                'Content-Length': imgBuffer.length
            });
            res.end(imgBuffer);
        } catch (error) {
            console.error('[WahaScreenshotController] Error:', error.message);
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = WahaScreenshotController;
