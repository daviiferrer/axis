/**
 * GotoNode - Jump to another node
 * FSM Type: GOTO
 * Returns the target node ID to redirect flow.
 */
const { NodeExecutionStateEnum } = require('../../../types/CampaignEnums');
const logger = require('../../../../shared/Logger').createModuleLogger('goto-node');

class GotoNode {
    constructor(dependencies) {
        this.dependencies = dependencies;
    }

    async execute({ instance, lead, campaign, nodeConfig }) {
        const targetNodeId = nodeConfig?.data?.targetNodeId;

        if (!targetNodeId) {
            logger.warn({ instanceId: instance.id }, 'GotoNode: No target node configured');
            return {
                status: NodeExecutionStateEnum.FAILED,
                error: 'No target node configured'
            };
        }

        logger.info({
            instanceId: instance.id,
            targetNodeId
        }, 'GotoNode: Jumping to target');

        // GOTO returns EXITED with a special 'goto' edge
        // The engine should interpret this and set current_node_id to targetNodeId
        return {
            status: NodeExecutionStateEnum.EXITED,
            edge: 'goto',
            gotoTarget: targetNodeId
        };
    }
}

module.exports = GotoNode;
