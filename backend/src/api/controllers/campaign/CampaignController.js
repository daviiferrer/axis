/**
 * CampaignController - Handles campaign-related API requests.
 */
class CampaignController {
    constructor(campaignService, supabaseClient) {
        this.campaignService = campaignService;
        this.supabase = supabaseClient;
    }

    async listCampaigns(req, res) {
        try {
            const campaigns = await this.campaignService.listCampaigns();
            res.json(campaigns);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    // NOTE: Risk Middleware is applied at the Route level (router.js), not here directly usually.
    // However, if we want to enforce it inside the controller, we can, but middleware is cleaner.
    // I will assume the user wants me to wire it up in router.js mostly, but for now I'll adding a check here or update router.js.
    // Wait, the plan said "Modify Campaign Controller". I'll add the check here for robust code, 
    // OR I will modify the router. Let's stick to the controller method if cleaner or Router.
    // Actually, looking at server.js, there is a `createRouter` function.
    // I should probably edit `backend/src/api/router.js` to apply the middleware to the specific route.
    // BUT the task said "Modify Campaign Controller". 
    // Let's create a method checkRisk inside the controller or just rely on router. 
    // I will modify route.js (router) instead as it is the standard pattern for middlewares.
    // Updating task strategy: I will modify `backend/src/api/router.js` instead of the controller file itself for the middleware application,
    // UNLESS I can't find router.js.
    // Let me check if router.js exists. Yes, step 11 output showed `api/router`.

    // Resume Controller logic: I'll leave the controller as is and update the router.
    // If I MUST modify the controller, I'd inject the middleware logic.
    // Let's modify `backend/src/api/router.js`.

    async pauseCampaign(req, res) {
        try {
            const { id } = req.params;
            const updated = await this.campaignService.updateCampaignStatus(id, 'paused');
            res.json({ success: true, campaign: updated });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async saveStrategy(req, res) {
        try {
            const { id } = req.params;
            const { nodes, edges } = req.body;

            const updated = await this.campaignService.updateStrategy(id, { nodes, edges });
            res.json({ success: true, campaign: updated });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async updateMode(req, res) {
        try {
            const { id } = req.params;
            const { mode } = req.body;
            const userId = req.user?.id;

            if (!userId) return res.status(401).json({ error: 'Não autorizado' });

            const updated = await this.campaignService.updateCampaignMode(id, mode, userId);
            res.json({ success: true, campaign: updated });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
}

module.exports = CampaignController;
