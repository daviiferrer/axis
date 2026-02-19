const { NodeExecutionStateEnum, EdgeTypeEnum, IntentEnum } = require('../../../types/CampaignEnums');
const logger = require('../../../../shared/Logger').createModuleLogger('logic-node');

/**
 * LogicNode 3.0 — Conditional Router
 * 
 * Supports TWO modes:
 * 
 * 1. USER-DEFINED CONDITIONS (new):
 *    Evaluates conditions[] from nodeConfig.data against lead slot values.
 *    Each condition maps to an output handle (output-0, output-1, ...).
 *    The FIRST matching condition wins. If none match → output-else.
 * 
 * 2. INTENT-BASED ROUTING (legacy fallback):
 *    If no conditions[] are defined, falls back to the original behavior
 *    of routing based on context.lastIntent.
 * 
 * Condition format (stored in flow JSON):
 *   conditions: [
 *     { variable: "duracao", operator: ">=", value: "10" },
 *     { variable: "tipo_imovel", operator: "==", value: "apartamento" }
 *   ]
 * 
 * Supported operators:
 *   ==, !=, >, <, >=, <=, contains, not_contains, exists, not_exists
 */
class LogicNode {
    constructor(dependencies) {
        this.dependencies = dependencies;
    }

    async execute(lead, campaign, nodeConfig, graph, context) {
        const conditions = nodeConfig?.data?.conditions || [];

        // ─── MODE 1: User-defined conditions ────────────────────────────
        if (conditions.length > 0) {
            return this._evaluateConditions(lead, conditions, context);
        }

        // ─── MODE 2: Legacy intent-based routing ────────────────────────
        return this._routeByIntent(lead, context);
    }

    // =====================================================================
    // MODE 1: Condition Evaluation Engine
    // =====================================================================

    _evaluateConditions(lead, conditions, context) {
        const slots = context?.qualification_slots || {};

        logger.info({
            leadId: lead.id,
            conditionCount: conditions.length,
            availableSlots: Object.keys(slots)
        }, '🔀 LogicNode: Evaluating user-defined conditions');

        // Evaluate each condition in order — first match wins
        for (let i = 0; i < conditions.length; i++) {
            const cond = conditions[i];
            const resolvedValue = this._resolveVariable(cond.variable, lead, context, slots);

            const match = this._evaluate(resolvedValue, cond.operator, cond.value);

            logger.debug({
                leadId: lead.id,
                condition: `${cond.variable} ${cond.operator} ${cond.value}`,
                resolvedValue,
                match,
                outputHandle: `output-${i}`
            }, `  Condition ${i}: ${match ? '✅ MATCH' : '❌ no match'}`);

            if (match) {
                return {
                    status: NodeExecutionStateEnum.EXITED,
                    edge: `output-${i}`,
                    output: {
                        matchedCondition: i,
                        conditionLabel: `${cond.variable} ${cond.operator} ${cond.value}`,
                        resolvedValue
                    }
                };
            }
        }

        // No condition matched → else path
        logger.info({ leadId: lead.id }, '🔀 LogicNode: No condition matched → ELSE path');
        return {
            status: NodeExecutionStateEnum.EXITED,
            edge: `output-${conditions.length}`, // Last handle = else
            output: { matchedCondition: -1, conditionLabel: 'else' }
        };
    }

    /**
     * Resolve a variable name to its actual value from lead data.
     * Search order:
     *   1. qualification_slots (most common — data collected by AgenticNode)
     *   2. context root (for system-level values like lastIntent)
     *   3. lead fields (phone, name, etc.)
     */
    _resolveVariable(variable, lead, context, slots) {
        // 1. Qualification slots (collected by AgenticNode)
        if (slots[variable] !== undefined) return slots[variable];

        // 2. Context root
        if (context?.[variable] !== undefined) return context[variable];

        // 3. Lead-level fields
        if (lead[variable] !== undefined) return lead[variable];

        return undefined;
    }

    /**
     * Evaluate a single condition: resolvedValue <operator> expectedValue
     * Handles type coercion (string "10" vs number 10) gracefully.
     */
    _evaluate(resolvedValue, operator, expectedValue) {
        // Handle exists/not_exists first (don't need value comparison)
        if (operator === 'exists') {
            return resolvedValue !== undefined && resolvedValue !== null && resolvedValue !== '';
        }
        if (operator === 'not_exists') {
            return resolvedValue === undefined || resolvedValue === null || resolvedValue === '';
        }

        // If the variable doesn't exist, all comparisons fail (except not_exists above)
        if (resolvedValue === undefined || resolvedValue === null) return false;

        const actual = String(resolvedValue).trim().toLowerCase();
        const expected = String(expectedValue).trim().toLowerCase();

        // Try numeric comparison if both sides look like numbers
        const numActual = parseFloat(actual);
        const numExpected = parseFloat(expected);
        const bothNumeric = !isNaN(numActual) && !isNaN(numExpected);

        switch (operator) {
            case '==':
            case '=':
                return bothNumeric ? numActual === numExpected : actual === expected;

            case '!=':
                return bothNumeric ? numActual !== numExpected : actual !== expected;

            case '>':
                return bothNumeric ? numActual > numExpected : actual > expected;

            case '<':
                return bothNumeric ? numActual < numExpected : actual < expected;

            case '>=':
                return bothNumeric ? numActual >= numExpected : actual >= expected;

            case '<=':
                return bothNumeric ? numActual <= numExpected : actual <= expected;

            case 'contains':
                return actual.includes(expected);

            case 'not_contains':
                return !actual.includes(expected);

            default:
                logger.warn({ operator }, 'LogicNode: Unknown operator, defaulting to false');
                return false;
        }
    }

    // =====================================================================
    // MODE 2: Legacy Intent Routing (backward compatibility)
    // =====================================================================

    _routeByIntent(lead, context) {
        const lastIntent = context?.lastIntent || IntentEnum.UNKNOWN;
        logger.info({ leadId: lead.id, lastIntent }, 'LogicNode: Legacy routing by intent');

        const edge = this._resolveIntentEdge(lastIntent);
        return {
            status: NodeExecutionStateEnum.EXITED,
            output: { routedIntent: lastIntent },
            edge,
            action: edge
        };
    }

    _resolveIntentEdge(intent) {
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
