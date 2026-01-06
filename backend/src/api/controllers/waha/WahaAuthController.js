class WahaAuthController {
    constructor(wahaClient) {
        this.waha = wahaClient;
    }

    async getQR(req, res) {
        try {
            const result = await this.waha.getQR(req.params.session);
            // Assuming getQR returns base64 or object, adjust based on WahaClient
            res.json(result);
        } catch (error) {
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
