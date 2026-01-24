class WahaAuthController {
    constructor(wahaClient) {
        this.waha = wahaClient;
    }

    async getQR(req, res) {
        try {
            // Correct method name is getAuthQR in WahaClient
            const result = await this.waha.getAuthQR(req.params.session);
            res.json(result);
        } catch (error) {
            console.error('[WahaAuthController] getQR error:', error.message);

            // Check for connection/timeout errors (Offline)
            if (error.message.includes('WAHA Connection Error') || error.message.includes('ECONNREFUSED')) {
                return res.status(503).json({
                    error: 'Service Unavailable',
                    message: 'WAHA service is offline. Please check Docker.'
                });
            }

            if (error.response) {
                return res.status(error.response.status || 500).json({ error: error.message, details: error.response.data });
            }
            res.status(500).json({ error: error.message });
        }
    }

    async requestCode(req, res) {
        try {
            const { session } = req.params;
            const { phoneNumber } = req.body;
            const result = await this.waha.requestCode(session, phoneNumber);
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = WahaAuthController;
