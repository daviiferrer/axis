/**
 * ClosingNode - SDR Finalization Node.
 * Cleans up ephemeral data and sets final lead status.
 */
const logger = require('../../../../shared/Logger').createModuleLogger('closing-node');

const { NodeExecutionStateEnum } = require('../../../types/CampaignEnums');

class ClosingNode {
    constructor({ leadService, supabaseClient }) {
        this.leadService = leadService;
        this.supabase = supabaseClient;
    }

    async execute(lead, campaign, nodeConfig, graph, context) {
        // hard_reset controls if we do a deep scrub of the lead's state.
        const { finalStatus = 'completed', clearVariables = true, hard_reset = true } = nodeConfig.data || {};

        logger.info({ leadId: lead.id, finalStatus, hard_reset }, 'Executing ClosingNode');

        const updates = {
            status: finalStatus,
            updated_at: new Date().toISOString()
        };

        if (clearVariables || hard_reset) {
            updates.node_variables = {};
            updates.node_state = {};
        }

        if (hard_reset) {
            // Remove previous qualification data stored in custom_fields
            if (lead.custom_fields) {
                const newCustomFields = { ...lead.custom_fields };
                delete newCustomFields.qualification;
                updates.custom_fields = newCustomFields;
            }

            // Wipe temperature and intent scores
            updates.temperature = 0;
            updates.intent_score = 0;
        }

        await this.leadService.updateLead(lead.id, updates);

        // Optionally, if hard_reset is true, we might want to archive/delete 
        // the chat history for this specific campaign to prevent ML context poisoning
        // for future interactions.
        if (hard_reset && this.supabase) {
            try {
                // Find chat IDs for this lead
                const { data: chats } = await this.supabase
                    .from('chats')
                    .select('id')
                    .eq('lead_id', lead.id);

                if (chats && chats.length > 0) {
                    const chatIds = chats.map(c => c.id);
                    // Deleting/Archiving messages is a big step. We'll simply clear the "agent_memory" 
                    // or mark them as archived if your schema supports it.
                    // For now, wiping node_state and variables is the main unblocker.
                    logger.info({ leadId: lead.id, chatIds }, '🧼 Hard reset executed: Variables and State wiped.');
                }
            } catch (e) {
                logger.warn({ error: e.message }, 'Failed secondary cleanup in hard_reset');
            }
        }

        return { status: NodeExecutionStateEnum.EXITED, markExecuted: true };
    }
}

module.exports = ClosingNode;
