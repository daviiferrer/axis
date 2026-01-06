class WahaSessionController {
    constructor(wahaClient) {
        this.waha = wahaClient;
    }

    async getSessions(req, res) {
        try {
            const all = req.query.all === 'true';
            const result = await this.waha.getSessions(all);
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async getSession(req, res) {
        try {
            const result = await this.waha.getSession(req.params.session);
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async getSessionMe(req, res) {
        try {
            const result = await this.waha.getSessionMe(req.params.session);
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async createSession(req, res) {
        try {
            const result = await this.waha.createSession(req.body);
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async updateSession(req, res) {
        try {
            const result = await this.waha.updateSession(req.params.session, req.body);
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async deleteSession(req, res) {
        try {
            const result = await this.waha.deleteSession(req.params.session);
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async startSession(req, res) {
        try {
            const result = await this.waha.startSession(req.params.session);
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async stopSession(req, res) {
        try {
            const result = await this.waha.stopSession(req.params.session);
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async logoutSession(req, res) {
        try {
            const result = await this.waha.logoutSession(req.params.session);
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async restartSession(req, res) {
        try {
            const result = await this.waha.restartSession(req.params.session);
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = WahaSessionController;
