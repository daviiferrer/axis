/**
 * ObjectionNode - SDR Node for handling objections reactively.
 */
const AgentNode = require('../AgentNode');

class ObjectionNode extends AgentNode {
    async execute(lead, campaign, nodeConfig, graph) {
        console.log(`[ObjectionNode] Handling objection for lead ${lead.phone}`);

        // This node might be triggered when the sentiment is low or specific objection crm_actions are detected.
        // It forces the AI to focus on the Objection Playbook.

        return await super.execute(lead, campaign, nodeConfig, graph);
    }
}

module.exports = ObjectionNode;
