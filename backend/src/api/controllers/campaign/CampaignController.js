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

    async createCampaign(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) return res.status(401).json({ error: 'Unauthorized' });

            const campaignData = req.body;
            const newCampaign = await this.campaignService.createCampaign(userId, campaignData);

            res.status(201).json({ success: true, campaign: newCampaign });
        } catch (error) {
            res.status(400).json({ error: error.message });
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

    async updateStatus(req, res) {
        try {
            const { id } = req.params;
            const { status } = req.body;
            // Validate status enum
            if (!['draft', 'active', 'paused', 'archived'].includes(status)) {
                return res.status(400).json({ error: 'Invalid status' });
            }

            const updated = await this.campaignService.updateCampaignStatus(id, status);
            res.json({ success: true, campaign: updated });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async getFlow(req, res) {
        try {
            const { id } = req.params;
            const flow = await this.campaignService.getFlow(id);
            res.json(flow);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async saveFlow(req, res) {
        try {
            const { id } = req.params;
            const flowData = req.body; // Expecting { nodes: [], edges: [], viewport: {} }

            const result = await this.campaignService.saveFlow(id, flowData);
            res.json({ success: true, flow: result });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async publishFlow(req, res) {
        try {
            const { id } = req.params;
            const result = await this.campaignService.publishFlow(id);
            res.json({ success: true, flow: result });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = CampaignController;
