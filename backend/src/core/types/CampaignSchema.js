/**
 * CampaignSchema.js
 * 
 * THE FORMAL CONTRACT FOR CAMPAIGN GRAPHS
 * =======================================
 * This schema defines what a valid campaign graph looks like.
 * Any graph that doesn't match this schema is INVALID.
 */

const {
    NodeTypeEnum,
    EdgeTypeEnum,
    AgentCapabilityEnum,
    CampaignExpectationEnum
} = require('./CampaignEnums');

/**
 * NODE SCHEMA
 * Each node in the graph must conform to this structure.
 */
const NodeSchema = {
    // Required fields
    id: { type: 'string', required: true },
    type: { type: 'enum', values: Object.values(NodeTypeEnum), required: true },

    // Position (for visual editor)
    position: { type: 'object', required: false },

    // Node-specific data
    data: {
        type: 'object',
        required: false,
        properties: {
            // Display
            label: { type: 'string' },
            description: { type: 'string' },

            // AI Node Config
            agentId: { type: 'string' },
            model: { type: 'string' },
            systemPrompt: { type: 'string' },

            // Wait Config
            timeout: { type: 'number' },      // Seconds
            timeoutAction: { type: 'enum', values: ['continue', 'retry', 'handoff'] },

            // Condition Config
            condition: { type: 'string' },    // Expression to evaluate
            conditionType: { type: 'enum', values: ['intent', 'sentiment', 'custom'] },
            targetIntent: { type: 'enum', values: Object.values(require('./CampaignEnums').IntentEnum) },

            // Split Config
            variants: { type: 'array' },      // [{ id, percentage }]

            // Goto Config
            targetNodeId: { type: 'string' },

            // Message Config
            messageTemplate: { type: 'string' },

            // Webhook Config
            webhookUrl: { type: 'string' },
            webhookMethod: { type: 'enum', values: ['GET', 'POST', 'PUT'] }
        }
    }
};

/**
 * EDGE SCHEMA
 * Each edge in the graph must conform to this structure.
 */
const EdgeSchema = {
    id: { type: 'string', required: true },
    source: { type: 'string', required: true },      // Source node ID
    target: { type: 'string', required: true },      // Target node ID
    sourceHandle: { type: 'string', required: false }, // Output handle ID
    targetHandle: { type: 'string', required: false }, // Input handle ID
    label: { type: 'enum', values: Object.values(EdgeTypeEnum), required: false }
};

/**
 * CAMPAIGN GRAPH SCHEMA
 * The complete structure of a campaign.
 */
const CampaignGraphSchema = {
    // Required
    nodes: { type: 'array', items: NodeSchema, required: true },
    edges: { type: 'array', items: EdgeSchema, required: true },

    // Optional Metadata
    version: { type: 'string', required: false },
    createdAt: { type: 'string', required: false },
    updatedAt: { type: 'string', required: false }
};

/**
 * AGENT ↔ CAMPAIGN CONTRACT
 * Defines what the Campaign expects and what the Agent provides.
 */
const AgentCampaignContract = {
    /**
     * When Campaign calls Agent, it specifies:
     */
    request: {
        nodeType: 'NodeTypeEnum',              // What kind of node is calling
        expectations: ['CampaignExpectationEnum'], // What Campaign needs back
        context: {
            lead: 'object',                    // Lead data
            campaign: 'object',                // Campaign config
            history: 'array',                  // Chat history
            variables: 'object'                // Node variables
        }
    },

    /**
     * Agent responds with:
     */
    response: {
        status: 'NodeExecutionStateEnum',      // EXITED, AWAITING_ASYNC, FAILED
        output: {
            intent: 'IntentEnum',              // Classified intent (if NEED_INTENT)
            sentiment: 'SentimentEnum',        // Classified sentiment (if NEED_SENTIMENT)
            sentiment_score: 'number',         // Raw score 0-1
            confidence_score: 'number',        // Confidence 0-1
            response: 'string',                // Generated text (if NEED_RESPONSE)
            extracted: 'object',               // Extracted data (if NEED_EXTRACTION)
            thought: 'string'                  // Internal reasoning (for debugging)
        },
        edge: 'EdgeTypeEnum'                   // ONLY for EXITED status
    }
};

/**
 * TRANSITION RULES
 * Formal rules for what edges are valid from each node type.
 */
const TransitionRules = {
    [NodeTypeEnum.TRIGGER]: {
        allowedOutputs: [EdgeTypeEnum.DEFAULT]
    },
    [NodeTypeEnum.LEAD_ENTRY]: {
        allowedOutputs: [EdgeTypeEnum.DEFAULT]
    },
    [NodeTypeEnum.AI_RESPOND]: {
        allowedOutputs: [EdgeTypeEnum.DEFAULT, EdgeTypeEnum.HANDOFF, EdgeTypeEnum.ERROR]
    },
    [NodeTypeEnum.AI_CLASSIFY]: {
        allowedOutputs: [EdgeTypeEnum.INTERESTED, EdgeTypeEnum.NOT_INTERESTED, EdgeTypeEnum.QUESTION, EdgeTypeEnum.OBJECTION, EdgeTypeEnum.DEFAULT]
    },
    [NodeTypeEnum.WAIT_REPLY]: {
        allowedOutputs: [EdgeTypeEnum.DEFAULT, EdgeTypeEnum.TIMEOUT]
    },
    [NodeTypeEnum.WAIT_TIME]: {
        allowedOutputs: [EdgeTypeEnum.DEFAULT]
    },
    [NodeTypeEnum.CONDITION]: {
        allowedOutputs: [EdgeTypeEnum.TRUE, EdgeTypeEnum.FALSE]
    },
    [NodeTypeEnum.SPLIT]: {
        // Dynamic based on variants
        allowedOutputs: ['variant_a', 'variant_b', 'variant_c']
    },
    [NodeTypeEnum.GOTO]: {
        allowedOutputs: [] // No outputs, redirects internally
    },
    [NodeTypeEnum.HANDOFF]: {
        allowedOutputs: [] // Terminal
    },
    [NodeTypeEnum.END]: {
        allowedOutputs: [] // Terminal
    }
};

/**
 * Validate a campaign graph against the schema.
 */
function validateCampaignGraph(graph) {
    const errors = [];

    // Check required fields
    if (!graph.nodes || !Array.isArray(graph.nodes)) {
        errors.push('Graph must have nodes array');
    }
    if (!graph.edges || !Array.isArray(graph.edges)) {
        errors.push('Graph must have edges array');
    }

    // Check each node
    for (const node of (graph.nodes || [])) {
        if (!node.id) errors.push(`Node missing id`);
        if (!node.type) errors.push(`Node ${node.id} missing type`);
        if (!Object.values(NodeTypeEnum).includes(node.type)) {
            errors.push(`Node ${node.id} has invalid type: ${node.type}`);
        }
    }

    // Check each edge
    for (const edge of (graph.edges || [])) {
        if (!edge.source) errors.push(`Edge missing source`);
        if (!edge.target) errors.push(`Edge missing target`);

        // Verify source node exists
        const sourceExists = graph.nodes.some(n => n.id === edge.source);
        if (!sourceExists) {
            errors.push(`Edge references non-existent source: ${edge.source}`);
        }

        // Verify target node exists
        const targetExists = graph.nodes.some(n => n.id === edge.target);
        if (!targetExists) {
            errors.push(`Edge references non-existent target: ${edge.target}`);
        }
    }

    // Check for entry point
    const hasEntry = graph.nodes?.some(n =>
        n.type === NodeTypeEnum.TRIGGER ||
        n.type === NodeTypeEnum.LEAD_ENTRY ||
        n.data?.isEntry
    );
    if (!hasEntry) {
        errors.push('Graph must have at least one entry node (TRIGGER or LEAD_ENTRY)');
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

module.exports = {
    NodeSchema,
    EdgeSchema,
    CampaignGraphSchema,
    AgentCampaignContract,
    TransitionRules,
    validateCampaignGraph
};
