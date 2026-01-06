/**
 * SplitNode - A/B Test Split
 * FSM Type: SPLIT
 * Randomly routes to one of the output edges based on percentage weights.
 */
const { NodeExecutionStateEnum } = require('../../../types/CampaignEnums');
const logger = require('../../../../shared/Logger').createModuleLogger('split-node');

class SplitNode {
    constructor(dependencies) {
        this.dependencies = dependencies;
    }

    async execute({ instance, lead, campaign, nodeConfig }) {
        const variantA_percent = nodeConfig?.data?.variantA_percent || 50;

        // Random selection
        const roll = Math.random() * 100;
        const selectedVariant = roll < variantA_percent ? 'variant_a' : 'variant_b';

        logger.info({
            instanceId: instance.id,
            roll: roll.toFixed(2),
            threshold: variantA_percent,
            selected: selectedVariant
        }, 'SplitNode: A/B Decision');

        return {
            status: NodeExecutionStateEnum.EXITED,
            edge: selectedVariant
        };
    }
}

module.exports = SplitNode;
