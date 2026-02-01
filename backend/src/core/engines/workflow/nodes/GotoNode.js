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

    async execute(lead, campaign, nodeConfig, graph, context) {
        // Unpack instance from context if needed, or rely on lead.instance_id logic in engine
        const instanceId = lead.instance_id || 'stateless';
        const targetNodeId = nodeConfig?.data?.targetNodeId;

        if (!targetNodeId) {
            logger.warn({ leadId: lead.id }, 'GotoNode: No target node configured');
            return {
                status: NodeExecutionStateEnum.FAILED,
                error: 'No target node configured'
            };
        }

        logger.info({
            leadId: lead.id,
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
