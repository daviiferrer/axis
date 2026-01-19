/**
 * QualificationNode - SDR Node for SPIN/BANT qualification.
 * Extends AgentNode to handle specialized sales-qualification logic.
 */
const AgentNode = require('../AgentNode');

class QualificationNode extends AgentNode {
    async execute(lead, campaign, nodeConfig, graph) {
        console.log(`[QualificationNode] Qualifying lead ${lead.phone} via SPIN/BANT`);

        // 1. Process via Base Agent Logic (Generates Response & Sends Msg)
        const result = await super.execute(lead, campaign, nodeConfig, graph);

        if (result.status === 'success' && result.response) {
            const aiResponse = result.response;

            // 2. Extract Qualification Slots (SPIN/BANT)
            if (aiResponse.qualification_slots) {
                await this.#updateQualificationData(lead.id, aiResponse.qualification_slots);
            }

            // 3. Logic: Should lead advance?
            // "O lead só avança se os slots críticos deixarem de ser null."
            const criticalSlots = nodeConfig.data?.criticalSlots || ['need', 'authority'];
            const allFilled = criticalSlots.every(slot =>
                aiResponse.qualification_slots &&
                aiResponse.qualification_slots[slot] &&
                aiResponse.qualification_slots[slot] !== 'unknown'
            );

            // EARLY EXIT: If lead wants to close, bypass slots
            if (aiResponse.ready_to_close === true || allFilled) {
                console.log(`[QualificationNode] Qualification finished (Ready: ${aiResponse.ready_to_close}, Slots: ${allFilled}). Advancing.`);
                return { ...result, status: 'success' }; // Signal engine to transition
            } else {
                console.log(`[QualificationNode] Qualification incomplete. Waiting for more data.`);
                return { ...result, status: 'waiting' }; // Stay in this node
            }
        }

        return result;
    }

    async #updateQualificationData(leadId, slots) {
        try {
            // Get current custom_fields
            const { data: lead } = await this.supabase
                .from('leads')
                .select('custom_fields')
                .eq('id', leadId)
                .single();

            const currentFields = lead?.custom_fields || {};

            // Merge slots into custom_fields
            const updatedFields = {
                ...currentFields,
                qualification: {
                    ...(currentFields.qualification || {}),
                    ...slots,
                    last_updated: new Date().toISOString()
                },
                // Flatten critical ones for easy filtering later if needed
                budget: slots.budget || currentFields.budget,
                authority: slots.authority || currentFields.authority,
                need: slots.need || currentFields.need,
                timeline: slots.timeline || currentFields.timeline
            };

            await this.supabase
                .from('leads')
                .update({ custom_fields: updatedFields })
                .eq('id', leadId);

            console.log(`[QualificationNode] Updated slots for lead ${leadId}`);
        } catch (error) {
            console.error(`[QualificationNode] Error updating lead data:`, error.message);
        }
    }
}

module.exports = QualificationNode;
