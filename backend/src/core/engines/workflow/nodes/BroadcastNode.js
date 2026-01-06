/**
 * BroadcastNode - SDR Node for Mass Outreach.
 * Uses Spintax and templates for deterministic messaging.
 */
const logger = require('../../../../shared/Logger').createModuleLogger('broadcast-node');

class BroadcastNode {
    constructor({ wahaClient, supabase }) {
        this.wahaClient = wahaClient;
        this.supabase = supabase;
    }

    async execute(lead, campaign, nodeConfig) {
        logger.info({ leadId: lead.id, node: nodeConfig.id }, 'Executing BroadcastNode');

        const { messageTemplate, spintaxEnabled } = nodeConfig.data || {};

        // 1. Process Message (Spintax + Replacement)
        let message = messageTemplate || "Olá!";

        // Replace variables first to avoid Spintax stripping double braces
        message = this.#replaceVariables(message, lead);

        if (spintaxEnabled) {
            message = this.#parseSpintax(message);
        }

        // 2. Send via WAHA
        const chatId = this.#getChatId(lead.phone);
        const isSimulation = campaign.mode === 'simulation';

        try {
            let sentId = `sim_${Date.now()}`;

            if (!isSimulation) {
                const sent = await this.wahaClient.sendText(campaign.session_name, chatId, message);
                sentId = sent.id;
            } else {
                logger.info({ leadId: lead.id, session: campaign.session_name }, 'SDR: Simulation Mode - Skipping WAHA');
            }

            // 3. Log Message
            await this.supabase.from('messages').insert({
                message_id: sentId,
                chat_id: await this.#getChatIdFromDb(lead.id),
                body: message,
                from_me: true,
                is_ai: false,
                is_demo: isSimulation
            });

            return {
                status: 'success',
                markExecuted: true,
                mode: isSimulation ? 'simulation' : 'live',
                nodeState: { last_outbound_at: new Date().toISOString() }
            };
        } catch (error) {
            logger.error({ error: error.message }, 'Broadcast send failed');
            return { status: 'error', error: error.message };
        }
    }

    #parseSpintax(text) {
        return text.replace(/{([^{}]+)}/g, (match, options) => {
            const choices = options.split('|');
            return choices[Math.floor(Math.random() * choices.length)];
        });
    }

    #replaceVariables(text, lead) {
        return text.replace(/\{\{name\}\}/gi, lead.name || 'amigo(a)')
            .replace(/\{\{company\}\}/gi, lead.company || 'sua empresa');
    }

    #getChatId(phone) {
        let clean = phone.replace(/\D/g, '');
        if (clean.length >= 10 && clean.length <= 11) clean = '55' + clean;
        return `${clean}@s.whatsapp.net`;
    }

    async #getChatIdFromDb(leadId) {
        const { data } = await this.supabase
            .from('chats')
            .select('id')
            .eq('lead_id', leadId)
            .single();
        return data?.id;
    }
}

module.exports = BroadcastNode;
