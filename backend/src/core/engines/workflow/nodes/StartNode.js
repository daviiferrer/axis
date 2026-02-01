/**
 * StartNode - The entry point for specific campaigns.
 * Configures WHICH session (WhatsApp Number) executes this flow.
 */
const { NodeExecutionStateEnum } = require('../../../types/CampaignEnums');

class StartNode {
    constructor() { }

    async execute(lead, campaign, nodeConfig, graph, context) {
        // 1. Session Binding
        // If node defines a specific Waha Session, we log it.
        // Future: Could trigger a context switch if the lead came from a different session.
        const targetSession = nodeConfig.data?.sessionName || nodeConfig.data?.session_name;

        // 2. Source Validation (Security & Logic)
        // User selects: "Allow: [Apify, Manual]" -> Blocks "Inbound" or "Webform"
        const allowedSources = nodeConfig.data?.allowedSources; // e.g. ['apify', 'manual', 'inbound']

        if (allowedSources && Array.isArray(allowedSources) && allowedSources.length > 0) {
            const leadSource = lead.source || 'manual'; // Default to manual if undefined

            if (!allowedSources.includes(leadSource)) {
                // REJECT execution if source is not allowed logic
                console.warn(`[StartNode] ⛔ Blocked Lead ${lead.id} from Source '${leadSource}'. Allowed: ${allowedSources.join(', ')}`);

                return {
                    status: NodeExecutionStateEnum.FAILED, // Standardized Enum
                    markExecuted: false, // Do not mark as "Success"
                    reason: `Source '${leadSource}' not allowed by Start Node configuration.`
                };
            }
        }

        return {
            status: NodeExecutionStateEnum.EXITED, // Standardized Enum (replaces 'success')
            markExecuted: true,
            nodeState: {
                entered_at: new Date().toISOString(),
                session_used: targetSession || campaign.session_name,
                source_validated: true
            },
            action: 'default' // Always proceed to next node
        };
    }
}

module.exports = StartNode;
