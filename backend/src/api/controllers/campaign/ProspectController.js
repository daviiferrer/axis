class ProspectController {
    constructor(apifyClient, leadService, supabase) {
        this.apifyClient = apifyClient;
        this.leadService = leadService;
        this.supabase = supabase;
    }

    async search(req, res) {
        try {
            const { searchTerms, location, maxResults, userId } = req.body;
            if (!userId) return res.status(400).json({ error: 'User ID is required' });

            const runId = await this.apifyClient.startGmapsSearch(userId, searchTerms, location, maxResults);
            res.json({ success: true, runId });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async poll(req, res) {
        try {
            const { runId } = req.params;
            const { userId } = req.query;
            if (!userId) return res.status(400).json({ error: 'User ID is required' });

            const results = await this.apifyClient.getRunResults(userId, runId);

            // Logic to save items to prospects table is inside apifyClient.getRunResults 
            // or should be here for consistency with "Controller calls Service"
            // Let's assume apifyClient handles the raw API and we handle orchestration here

            const items = results.items || [];
            if (items.length > 0) {
                await this.leadService.importProspects(userId, items, runId);
            }

            res.json({
                success: true,
                status: results.status,
                leadsCount: items.length,
                leads: items.map(item => this.apifyClient.normalizeItem(item, userId, runId))
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async stop(req, res) {
        try {
            const { runId, userId } = req.body;
            await this.apifyClient.stopRun(userId, runId);
            res.json({ success: true, message: 'Search stopped' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = ProspectController;
