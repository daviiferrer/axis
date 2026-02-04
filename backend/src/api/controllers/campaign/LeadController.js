const { getRequestClient } = require('../../shared/SupabaseHelper');

/**
 * LeadController - Handles lead-specific API requests.
 */
class LeadController {
    constructor({ workflowEngine, leadService, csvParserService, supabaseClient }) {
        this.workflowEngine = workflowEngine;
        this.leadService = leadService;
        this.csvParserService = csvParserService;
        this.supabase = supabaseClient;
    }

    async importLeads(req, res) {
        try {
            const { campaignId } = req.params; // Changed to params as route is /:campaignId/import usually, or check route definition
            // Route def: router.post('/import', ...) -> No campaignId in params?
            // Actually user request implies specific campaign. 
            // Previous code: const { campaignId, leads, userId } = req.body;
            // Let's support both.

            let targetCampaignId = req.params.campaignId || req.body.campaignId;
            const userId = req.user.id;

            let leadsToImport = [];

            if (req.file) {
                if (!this.csvParserService) {
                    return res.status(500).json({ error: 'CSV Parser not available' });
                }
                leadsToImport = await this.csvParserService.parse(req.file.buffer);
            } else if (req.body.leads && Array.isArray(req.body.leads)) {
                leadsToImport = req.body.leads;
            } else {
                return res.status(400).json({ error: 'No leads provided (file or json)' });
            }

            if (!targetCampaignId) {
                return res.status(400).json({ error: 'Campaign ID missing' });
            }

            const scopedClient = getRequestClient(req, this.supabase);
            const result = await this.leadService.importLeads(targetCampaignId, leadsToImport, userId, scopedClient);
            res.json({ success: true, imported: result.count });
        } catch (error) {
            console.error('[LeadController] Import Error:', error);
            res.status(500).json({ error: 'Failed to import leads' });
        }
    }

    async stopLead(req, res) {
        try {
            const { id } = req.params;
            const { chatId } = req.body;

            const scopedClient = getRequestClient(req, this.supabase);
            const updatedLead = await this.leadService.updateLead(id, {
                status: 'manual_intervention',
                owner: 'human'
            }, scopedClient);

            // Emit update to socket
            this.workflowEngine.socketService.emit('lead.update', {
                leadId: id,
                chatId: chatId,
                status: 'manual_intervention',
                owner: 'human'
            });

            res.json({ success: true, lead: updatedLead });
        } catch (error) {
            res.status(500).json({ error: 'Failed to stop lead' });
        }
    }

    async triggerAi(req, res) {
        try {
            const { id } = req.params;
            const { force } = req.body;

            const scopedClient = getRequestClient(req, this.supabase);
            const lead = await this.leadService.getLead(id, scopedClient);
            if (!lead) return res.status(404).json({ error: 'Lead not found' });

            // Note: processLead is an Engine method, it likely uses its own admin access or we might need to verify if it needs scoping.
            // Engine usually needs full access to execute flow. The permission check is done at 'getLead' above.
            await this.workflowEngine.processLead(lead, { forceTrigger: true, ignoreManualStop: force === true });

            res.json({ success: true, message: 'AI Triggered' });
        } catch (error) {
            console.error('[LeadController] Trigger AI Error:', error);
            res.status(500).json({ error: 'Failed to trigger AI' });
        }
    }

    async getPresence(req, res) {
        // ... Logic for presence check
        res.json({ status: 'unknown' });
    }
}

module.exports = LeadController;
