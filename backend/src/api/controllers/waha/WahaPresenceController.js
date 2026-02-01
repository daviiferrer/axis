class WahaPresenceController {
    constructor({ wahaClient }) {
        this.waha = wahaClient;
    }

    async setPresence(req, res) {
        try {
            // POST /:session
            // Body: { chatId, presence }
            const { chatId, presence } = req.body;
            const result = await this.waha.setPresence(req.params.session, chatId, presence);
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async getPresence(req, res) {
        try {
            // GET /:session
            // This might imply getting presence of self or general status?
            // Or getting presence of a specific chat via query param?
            // Using getSessionMe as fallback if no specific user query
            const result = await this.waha.getSessionMe(req.params.session);
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async getChatPresence(req, res) {
        try {
            // GET /:session/:chatId
            const result = await this.waha.getPresence(req.params.session, req.params.chatId);
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async subscribePresence(req, res) {
        try {
            // POST /:session/:chatId/subscribe
            const result = await this.waha.subscribePresence(req.params.session, req.params.chatId);
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = WahaPresenceController;
