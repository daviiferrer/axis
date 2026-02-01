class WahaObservabilityController {
    constructor({ wahaClient }) {
        this.waha = wahaClient;
    }

    async ping(req, res) {
        try {
            const result = await this.waha.getPing();
            res.json({ result });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async health(req, res) {
        try {
            const result = await this.waha.getHealth();
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async version(req, res) {
        try {
            const result = await this.waha.getVersion();
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async serverStatus(req, res) {
        try {
            // Proxy to getSessions assuming it reflects server status if reachable
            const result = await this.waha.getSessions();
            res.json({ status: 'running', sessions: result.length });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async stopServer(req, res) {
        try {
            // WARNING: destructive
            res.status(501).json({ error: 'Server stop via API not enabled' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async debugCpu(req, res) {
        try {
            res.json(process.cpuUsage());
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = WahaObservabilityController;
