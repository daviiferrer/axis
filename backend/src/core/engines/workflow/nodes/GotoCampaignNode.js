/**
 * GotoCampaignNode - Transfers the lead to a different campaign.
 * Useful for Triage -> Sales Funnel transitions.
 */
class GotoCampaignNode {
    constructor({ leadService }) {
        this.leadService = leadService;
    }

    async execute(lead, campaign, nodeConfig) {
        const targetCampaignId = nodeConfig.data?.target_campaign_id;

        if (!targetCampaignId) {
            return {
                status: 'error',
                error: 'Target Campaign ID is required for GotoCampaignNode'
            };
        }

        // We don't perform the transfer here directly because that involves
        // changing the 'Active Campaign' context in the Engine.
        // Instead, we return a special action/state that the Engine understands.

        return {
            status: 'success',
            markExecuted: true,
            // The Engine will see this action and handle the DB migration
            action: 'transfer_campaign',
            output: {
                targetCampaignId: targetCampaignId,
                reason: nodeConfig.data?.reason || 'automated_triage'
            },
            nodeState: {
                transferred_at: new Date().toISOString(),
                target: targetCampaignId
            }
        };
    }
}

module.exports = GotoCampaignNode;
