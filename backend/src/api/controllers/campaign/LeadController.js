/**
 * LeadController - Handles lead-specific API requests.
 */
class LeadController {
    constructor(workflowEngine, leadService) {
        this.workflowEngine = workflowEngine;
        this.leadService = leadService;
    }

    async importLeads(req, res) {
        try {
            const { campaignId, leads, userId } = req.body;
            const result = await this.leadService.importLeads(campaignId, leads, userId);
            res.json({ success: true, imported: result.count });
        } catch (error) {
            res.status(500).json({ error: 'Failed to import leads' });
        }
    }

    async stopLead(req, res) {
        try {
            const { id } = req.params;
            const { chatId } = req.body;

            const updatedLead = await this.leadService.updateLead(id, {
                status: 'manual_intervention',
                owner: 'human'
            });

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

            const lead = await this.leadService.getLead(id);
            if (!lead) return res.status(404).json({ error: 'Lead not found' });

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
