/**
 * ActionNode - Executes generic system actions.
 * Placeholder for future expansion (e.g., webhook triggers, CRM updates).
 */
const logger = require('../../../../shared/Logger').createModuleLogger('action-node');

const { NodeExecutionStateEnum } = require('../../../types/CampaignEnums');

class ActionNode {
    constructor(dependencies) {
        this.dependencies = dependencies;
    }

    async execute(lead, campaign, nodeConfig, graph, context) {
        logger.info({ leadId: lead?.id, action: nodeConfig?.data?.action }, 'Executing ActionNode');

        // Example: If action is "update_crm", do it.
        // For now, it's a pass-through.

        return { status: NodeExecutionStateEnum.EXITED, edge: 'default' };
    }
}

module.exports = ActionNode;
