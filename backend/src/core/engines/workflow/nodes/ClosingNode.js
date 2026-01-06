/**
 * ClosingNode - SDR Finalization Node.
 * Cleans up ephemeral data and sets final lead status.
 */
const logger = require('../../../../shared/Logger').createModuleLogger('closing-node');

class ClosingNode {
    constructor({ leadService }) {
        this.leadService = leadService;
    }

    async execute(lead, campaign, nodeConfig) {
        const { finalStatus = 'completed', clearVariables = true } = nodeConfig.data || {};

        logger.info({ leadId: lead.id, finalStatus }, 'Executing ClosingNode');

        const updates = { status: finalStatus };
        if (clearVariables) {
            // We only try to clear node_variables if the schema supports it.
            // The catch block in WorkflowEngine will handle errors if the column is missing,
            // but we can be proactive here.
            try {
                updates.node_variables = {};
            } catch (e) {
                logger.warn('Could not clear node_variables, skipping');
            }
        }

        await this.leadService.updateLead(lead.id, updates);

        return { status: 'success', markExecuted: true };
    }
}

module.exports = ClosingNode;
