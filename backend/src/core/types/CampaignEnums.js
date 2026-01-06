/**
 * CampaignEnums.js
 * 
 * THE DISCRETE-FIRST ONTOLOGY
 * ===========================
 * This file defines the CLOSED language of the Campaign FSM.
 * Nothing exists outside these enums. If it's not here, it's not valid.
 */

// ============================================================================
// 1. NODE TYPES (Closed Set - The only valid node types)
// ============================================================================
const NodeTypeEnum = {
    // Entry Points
    TRIGGER: 'TRIGGER',           // Campaign entry (e.g., lead enters)
    LEAD_ENTRY: 'LEAD_ENTRY',     // Explicit lead entry node

    // AI Nodes (Agent capabilities)
    AI_RESPOND: 'AI_RESPOND',     // Generate and send AI response
    AI_CLASSIFY: 'AI_CLASSIFY',   // Classify intent without responding
    AI_EXTRACT: 'AI_EXTRACT',     // Extract structured data (slot-filling)

    // Wait/Async Nodes
    WAIT_REPLY: 'WAIT_REPLY',     // Wait for user to reply
    WAIT_TIME: 'WAIT_TIME',       // Wait for duration (delay)
    WAIT_EVENT: 'WAIT_EVENT',     // Wait for external webhook/event

    // Control Flow Nodes
    CONDITION: 'CONDITION',       // If/else based on context
    SPLIT: 'SPLIT',               // A/B testing
    GOTO: 'GOTO',                 // Jump to another node

    // Action Nodes
    SEND_MESSAGE: 'SEND_MESSAGE', // Send static message
    UPDATE_LEAD: 'UPDATE_LEAD',   // Update lead fields
    WEBHOOK: 'WEBHOOK',           // Call external API
    TAG: 'TAG',                   // Add/remove tags

    // Terminal Nodes
    HANDOFF: 'HANDOFF',           // Transfer to human
    END: 'END',                   // End campaign for this lead

    // Legacy (for backward compatibility)
    ACTION: 'ACTION',
    DELAY: 'DELAY',
    AGENTIC: 'AGENTIC'
};

// ============================================================================
// 2. NODE EXECUTION STATES (The FSM states of a node execution)
// ============================================================================
const NodeExecutionStateEnum = {
    IDLE: 'IDLE',                 // Not yet entered
    ENTERED: 'ENTERED',           // Just entered, about to execute
    PROCESSING: 'PROCESSING',     // Executing logic
    AWAITING_ASYNC: 'AWAITING_ASYNC', // Waiting for external event (user reply, webhook)
    EXITED: 'EXITED',             // Completed, ready to transition
    FAILED: 'FAILED',             // Execution failed
    SKIPPED: 'SKIPPED'            // Skipped (e.g., condition not met)
};

// ============================================================================
// 3. EDGE TYPES (The only valid transition labels)
// ============================================================================
const EdgeTypeEnum = {
    DEFAULT: 'DEFAULT',           // Default path
    TRUE: 'TRUE',                 // Condition true
    FALSE: 'FALSE',               // Condition false
    TIMEOUT: 'TIMEOUT',           // Wait timed out
    ERROR: 'ERROR',               // Error occurred
    HANDOFF: 'HANDOFF',           // Handoff requested

    // Intent-based edges (Campaign reads Agent output)
    INTERESTED: 'INTERESTED',
    NOT_INTERESTED: 'NOT_INTERESTED',
    QUESTION: 'QUESTION',
    OBJECTION: 'OBJECTION'
};

// ============================================================================
// 4. EVENT TYPES (Event Sourcing - What triggers transitions)
// ============================================================================
const EventTypeEnum = {
    // Campaign Lifecycle
    CAMPAIGN_START: 'CAMPAIGN_START',
    CAMPAIGN_PAUSE: 'CAMPAIGN_PAUSE',
    CAMPAIGN_RESUME: 'CAMPAIGN_RESUME',
    CAMPAIGN_END: 'CAMPAIGN_END',

    // Node Lifecycle
    NODE_ENTER: 'NODE_ENTER',
    NODE_EXIT: 'NODE_EXIT',
    NODE_FAIL: 'NODE_FAIL',

    // External Events
    USER_REPLY: 'USER_REPLY',     // User sent a message
    WEBHOOK_RECEIVED: 'WEBHOOK_RECEIVED',
    TIMEOUT: 'TIMEOUT',           // Timer expired

    // Transitions
    TRANSITION: 'TRANSITION',     // Move to next node

    // Actions
    MESSAGE_SENT: 'MESSAGE_SENT',
    MESSAGE_DELIVERED: 'MESSAGE_DELIVERED',
    MESSAGE_READ: 'MESSAGE_READ',

    // Errors
    ERROR_OCCURRED: 'ERROR_OCCURRED'
};

// ============================================================================
// 5. CAMPAIGN STATUS (The FSM states of a campaign instance)
// ============================================================================
const CampaignStatusEnum = {
    DRAFT: 'DRAFT',
    SCHEDULED: 'SCHEDULED',
    RUNNING: 'RUNNING',
    PAUSED_MANUALLY: 'PAUSED_MANUALLY',
    PAUSED_SYSTEM_ERROR: 'PAUSED_SYSTEM_ERROR',
    COMPLETED: 'COMPLETED',
    ARCHIVED: 'ARCHIVED'
};

// ============================================================================
// 6. AGENT CAPABILITIES (What the Agent can do)
// ============================================================================
const AgentCapabilityEnum = {
    SEND_TEXT: 'SEND_TEXT',               // Generate and send text
    WAIT_REPLY: 'WAIT_REPLY',             // Set up reply wait
    CLASSIFY_INTENT: 'CLASSIFY_INTENT',   // Classify user intent
    CLASSIFY_SENTIMENT: 'CLASSIFY_SENTIMENT', // Classify sentiment
    EXTRACT_SLOTS: 'EXTRACT_SLOTS',       // Extract structured data
    HUMANIZE_DELAY: 'HUMANIZE_DELAY',     // Add realistic typing delay
    HANDLE_OBJECTION: 'HANDLE_OBJECTION', // Counter objections
    REMEMBER_CONTEXT: 'REMEMBER_CONTEXT'  // Use conversation history
};

// ============================================================================
// 7. CAMPAIGN EXPECTATIONS (What Campaign needs from Agent)
// ============================================================================
const CampaignExpectationEnum = {
    NEED_INTENT: 'NEED_INTENT',           // Need to know user intent
    NEED_SENTIMENT: 'NEED_SENTIMENT',     // Need sentiment score
    NEED_RESPONSE: 'NEED_RESPONSE',       // Need generated response
    NEED_EXTRACTION: 'NEED_EXTRACTION',   // Need slot extraction
    NEED_CONFIRMATION: 'NEED_CONFIRMATION', // Need yes/no confirmation
    NEED_HANDOFF_CHECK: 'NEED_HANDOFF_CHECK' // Check if handoff needed
};

// ============================================================================
// 8. INTENT ENUM (Agent classifies → Campaign decides)
// ============================================================================
const IntentEnum = {
    // Positive
    INTERESTED: 'INTERESTED',
    VERY_INTERESTED: 'VERY_INTERESTED',
    READY_TO_BUY: 'READY_TO_BUY',
    WANTS_DEMO: 'WANTS_DEMO',
    WANTS_CALLBACK: 'WANTS_CALLBACK',
    CONFIRMATION_YES: 'CONFIRMATION_YES',

    // Neutral
    QUESTION: 'QUESTION',
    PRICING_QUERY: 'PRICING_QUERY',
    FEATURE_QUERY: 'FEATURE_QUERY',
    CLARIFICATION: 'CLARIFICATION',
    GREETING: 'GREETING',

    // Negative
    NOT_INTERESTED: 'NOT_INTERESTED',
    CONFIRMATION_NO: 'CONFIRMATION_NO',
    OBJECTION_PRICE: 'OBJECTION_PRICE',
    OBJECTION_TIME: 'OBJECTION_TIME',
    OBJECTION_COMPETITOR: 'OBJECTION_COMPETITOR',

    // Special
    HANDOFF_REQUEST: 'HANDOFF_REQUEST',
    COMPLAINT: 'COMPLAINT',
    SPAM_DETECTION: 'SPAM_DETECTION',
    OFF_TOPIC: 'OFF_TOPIC',

    UNKNOWN: 'UNKNOWN'
};

// ============================================================================
// 9. SENTIMENT ENUM
// ============================================================================
const SentimentEnum = {
    VERY_NEGATIVE: 'VERY_NEGATIVE',
    NEGATIVE: 'NEGATIVE',
    NEUTRAL: 'NEUTRAL',
    POSITIVE: 'POSITIVE',
    VERY_POSITIVE: 'VERY_POSITIVE'
};

// ============================================================================
// 10. TRANSITION TABLE (The formal contract for state transitions)
// ============================================================================
/**
 * TransitionTable defines what happens when an event occurs in a given state.
 * Format: { [NodeType]: { [Event]: EdgeType } }
 * 
 * Usage: 
 *   const edge = TransitionTable[nodeType][eventType];
 *   // edge is the label to follow
 */
const TransitionTable = {
    [NodeTypeEnum.AI_RESPOND]: {
        [EventTypeEnum.USER_REPLY]: EdgeTypeEnum.DEFAULT, // Re-enter to respond
        [EventTypeEnum.TIMEOUT]: EdgeTypeEnum.TIMEOUT
    },
    [NodeTypeEnum.WAIT_REPLY]: {
        [EventTypeEnum.USER_REPLY]: EdgeTypeEnum.DEFAULT,
        [EventTypeEnum.TIMEOUT]: EdgeTypeEnum.TIMEOUT
    },
    [NodeTypeEnum.WAIT_TIME]: {
        [EventTypeEnum.TIMEOUT]: EdgeTypeEnum.DEFAULT
    },
    [NodeTypeEnum.CONDITION]: {
        // Condition evaluates and exits immediately with TRUE or FALSE
    },
    [NodeTypeEnum.HANDOFF]: {
        // Terminal - no transitions
    },
    [NodeTypeEnum.END]: {
        // Terminal - no transitions
    }
};

// ============================================================================
// 11. DOMAIN ENUMS (Channel, Message, etc.)
// ============================================================================
const ChannelTypeEnum = {
    WHATSAPP: 'WHATSAPP',
    SMS: 'SMS',
    RCS: 'RCS',
    EMAIL: 'EMAIL'
};

const MessageTypeEnum = {
    TEXT: 'TEXT',
    TEMPLATE: 'TEMPLATE',
    IMAGE: 'IMAGE',
    AUDIO: 'AUDIO',
    VIDEO: 'VIDEO',
    DOCUMENT: 'DOCUMENT',
    INTERACTIVE_BUTTON: 'INTERACTIVE_BUTTON',
    LIST_MESSAGE: 'LIST_MESSAGE'
};

const ConsentStatusEnum = {
    UNKNOWN: 'UNKNOWN',
    OPT_IN_SINGLE: 'OPT_IN_SINGLE',
    OPT_IN_DOUBLE: 'OPT_IN_DOUBLE',
    OPT_OUT: 'OPT_OUT'
};

// ============================================================================
// 12. OPERATIONAL & SAFETY ENUMS
// ============================================================================
const CampaignModeEnum = {
    SIMULATION: 'simulation',     // Sandbox mode (no real messages)
    LIVE: 'live'                  // Production mode
};

const SafetyRiskLevelEnum = {
    LOW: 'low',                   // Green (Safe)
    MEDIUM: 'medium',             // Yellow (Caution)
    HIGH: 'high'                  // Red (Critical/Ban Risk)
};

const OnboardingStepEnum = {
    IDENTITY: 0,                  // Step 0: Name & Company
    WHATSAPP: 1,                  // Step 1: Safety & Instance
    AGENT: 2,                     // Step 2: Persona DNA
    CAMPAIGN: 3,                  // Step 3: Simulation Ingestion
    WORKFLOW: 4                   // Step 4: Logic Activation
};

// ============================================================================
// 13. ERROR & RECOVERY ENUMS
// ============================================================================
const WindowStatusEnum = {
    OPEN_24H: 'OPEN_24H',
    CLOSED: 'CLOSED',
    EXTENDED_FREE_TIER: 'EXTENDED_FREE_TIER'
};

const WhatsAppErrorEnum = {
    RATE_LIMIT_HIT: 'RATE_LIMIT_HIT',
    SPAM_RATE_LIMIT: 'SPAM_RATE_LIMIT',
    MSG_UNDELIVERABLE: 'MSG_UNDELIVERABLE',
    PAYMENT_ISSUE: 'PAYMENT_ISSUE',
    REENGAGEMENT_NEEDED: 'REENGAGEMENT_NEEDED'
};

const RecoveryStrategyEnum = {
    BACKOFF_EXPONENTIAL: 'BACKOFF_EXPONENTIAL',
    CIRCUIT_BREAK_CAMPAIGN: 'CIRCUIT_BREAK_CAMPAIGN',
    MARK_INVALID_CONTACT: 'MARK_INVALID_CONTACT',
    PAUSE_ACCOUNT: 'PAUSE_ACCOUNT',
    FALLBACK_TO_TEMPLATE: 'FALLBACK_TO_TEMPLATE'
};

// ============================================================================
// EXPORTS
// ============================================================================
module.exports = {
    // Node & Graph
    NodeTypeEnum,
    NodeExecutionStateEnum,
    EdgeTypeEnum,

    // Events
    EventTypeEnum,

    // Campaign
    CampaignStatusEnum,

    // Agent ↔ Campaign Contract
    AgentCapabilityEnum,
    CampaignExpectationEnum,

    // Classifications
    IntentEnum,
    SentimentEnum,

    // Transition Logic
    TransitionTable,

    // Domain
    ChannelTypeEnum,
    MessageTypeEnum,
    ConsentStatusEnum,

    // Operational & Safety
    CampaignModeEnum,
    SafetyRiskLevelEnum,
    OnboardingStepEnum,

    // Errors
    WindowStatusEnum,
    WhatsAppErrorEnum,
    RecoveryStrategyEnum
};
