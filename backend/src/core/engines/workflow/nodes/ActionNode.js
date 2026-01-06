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

    async execute({ instance, lead, campaign, nodeConfig }) {
        // Fallback for legacy calls
        const _lead = lead || arguments[0];
        const _nodeConfig = nodeConfig || arguments[2];

        logger.info({ leadId: _lead?.id, action: _nodeConfig?.data?.action }, 'Executing ActionNode');

        // Example: If action is "update_crm", do it.
        // For now, it's a pass-through.

        return { status: NodeExecutionStateEnum.EXITED, edge: 'default' };
    }
}

module.exports = ActionNode;
