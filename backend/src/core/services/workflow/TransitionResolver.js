/**
 * TransitionResolver.js
 * 
 * THE DECLARATIVE FSM ENGINE
 * ==========================
 * This service determines the next transition based on the formal TransitionTable
 * and Node execution results. It removes logic from the nodes and centralizes it.
 */

const {
    TransitionTable,
    EventTypeEnum,
    EdgeTypeEnum,
    NodeExecutionStateEnum,
    NodeTypeEnum,
    IntentEnum
} = require('../../types/CampaignEnums');

class TransitionResolver {
    /**
     * Resolve the next node transition.
     * 
     * @param {Object} node - Current node configuration
     * @param {Object} result - Execution result (status, output, etc.)
     * @param {string} eventType - The event that triggered this check (optional)
     * @returns {string|null} - The edge label to follow
     */
    resolve(node, result, eventType = null) {
        const { type: nodeType } = node;
        const { status, output, edge: explicitEdge } = result;

        console.debug(`[TransitionResolver] Node:${nodeType} Status:${status} Event:${eventType}`);

        // 1. Explicit Edge (Node Decided)
        // Note: In 2.0, nodes should rarely decide edges, but we keep it for flexibility.
        if (explicitEdge) return explicitEdge;

        // 2. Logic Node Branching
        if (nodeType === NodeTypeEnum.CONDITION || nodeType === NodeTypeEnum.AI_CLASSIFY) {
            return this._resolveLogicBranch(node, result);
        }

        // 3. Status-based Transitions (The Default FSM)
        if (status === NodeExecutionStateEnum.EXITED) {
            return EdgeTypeEnum.DEFAULT;
        }

        if (status === NodeExecutionStateEnum.FAILED) {
            return EdgeTypeEnum.ERROR;
        }

        // 4. Event-based Transitions (Wait/Async)
        if (eventType) {
            const tableEntry = TransitionTable[nodeType];
            if (tableEntry && tableEntry[eventType]) {
                return tableEntry[eventType];
            }
        }

        return null; // Stay in current node
    }

    /**
     * Logic for branching nodes.
     */
    _resolveLogicBranch(node, result) {
        const { output } = result;
        const { intent } = output || {};

        // If node defined a specific intent-to-edge mapping, use it
        if (intent && EdgeTypeEnum[intent]) {
            return EdgeTypeEnum[intent];
        }

        // Fallback for AI_CLASSIFY
        if (intent === IntentEnum.INTERESTED) return EdgeTypeEnum.INTERESTED;
        if (intent === IntentEnum.NOT_INTERESTED) return EdgeTypeEnum.NOT_INTERESTED;
        if (intent === IntentEnum.QUESTION) return EdgeTypeEnum.QUESTION;
        if (intent === IntentEnum.HANDOFF_REQUEST) return EdgeTypeEnum.HANDOFF;

        return EdgeTypeEnum.DEFAULT;
    }
}

module.exports = new TransitionResolver();
