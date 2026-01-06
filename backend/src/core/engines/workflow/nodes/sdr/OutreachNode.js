/**
 * OutreachNode - SDR Node for smart prospecting.
 * Implements "Zero Known Data Asked" principle by injecting enrichment data.
 */
const AgentNode = require('../AgentNode');

class OutreachNode extends AgentNode {
    async execute(lead, campaign, nodeConfig, graph) {
        console.log(`[OutreachNode] Starting outreach for lead ${lead.phone}`);

        // Enrichment data is already in lead.custom_fields (populated by ProspectController)
        // We just need to ensure the PromptService highlights this to the AI.
        // The base AgentNode handles context preparation, we can override if needed
        // but for now, we'll rely on the Stitched Prompt receiving the full lead object.

        return await super.execute(lead, campaign, nodeConfig, graph);
    }
}

module.exports = OutreachNode;
