const { NodeExecutionStateEnum, EdgeTypeEnum, IntentEnum } = require('../../../types/CampaignEnums');
const logger = require('../../../../shared/Logger').createModuleLogger('logic-node');

class LogicNode {
    /**
     * LogicNode 2.0 - The Enum Router
     * 
     * Responsibilities:
     * - READ context.lastIntent and context.lastSentiment
     * - DECIDE the next edge based on configured rules
     * - DO NOT call AI (AI classification happens in AgentNode)
     */
    async execute(lead, campaign, nodeConfig, graph) {
        // We use instance.context, but lead might have some of it
        // In WorkflowEngine.js, we pass the instance context when calling nodes
        // but currently we just pass lead and campaign.
        // Let's assume the engine populates context in the lead object for convenience 
        // or we check the lead's state.

        const context = lead.context || {};
        const lastIntent = context.lastIntent || IntentEnum.UNKNOWN;

        logger.info({ leadId: lead.id, lastIntent }, 'LogicNode: Routing based on intent');

        // Logic nodes evaluate immediately and exit
        return {
            status: NodeExecutionStateEnum.EXITED,
            output: { routedIntent: lastIntent },
            output: { routedIntent: lastIntent },
            edge: this._resolveEdge(lastIntent),
            action: this._resolveEdge(lastIntent) // Compatibility with Legacy Engine
        };
    }

    _resolveEdge(intent) {
        // Map common intents to formal edges
        switch (intent) {
            case IntentEnum.INTERESTED:
            case IntentEnum.VERY_INTERESTED:
            case IntentEnum.READY_TO_BUY:
                return EdgeTypeEnum.INTERESTED;

            case IntentEnum.NOT_INTERESTED:
            case IntentEnum.CONFIRMATION_NO:
                return EdgeTypeEnum.NOT_INTERESTED;

            case IntentEnum.QUESTION:
            case IntentEnum.PRICING_QUERY:
            case IntentEnum.FEATURE_QUERY:
                return EdgeTypeEnum.QUESTION;

            case IntentEnum.HANDOFF_REQUEST:
            case IntentEnum.COMPLAINT:
                return EdgeTypeEnum.HANDOFF;

            default:
                return EdgeTypeEnum.DEFAULT;
        }
    }
}

module.exports = LogicNode;
