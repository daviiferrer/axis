/**
 * HandoffNode - SDR Transition Node.
 * Manages transitions between AI, Human, and different campaign stages.
 */
const logger = require('../../../../shared/Logger').createModuleLogger('handoff-node');

class HandoffNode {
    constructor({ supabaseClient, campaignSocket, historyService, geminiClient }) {
        this.supabase = supabaseClient;
        this.campaignSocket = campaignSocket;
        this.historyService = historyService;
        this.geminiClient = geminiClient;
    }

    async execute(lead, campaign, nodeConfig) {
        const { target = 'human', reason = 'AI requested help' } = nodeConfig.data || {};

        logger.info({ leadId: lead.id, target }, 'Executing HandoffNode');

        if (target === 'campaign') {
            const { targetCampaignId } = nodeConfig.data || {};
            if (!targetCampaignId) {
                logger.error({ leadId: lead.id }, 'HandoffNode: Missing targetCampaignId');
                return { status: 'error', error: 'Missing targetCampaignId' };
            }

            // Transfer Lead to New Campaign
            const { error } = await this.supabase.from('leads').update({
                campaign_id: targetCampaignId,
                current_node_id: null, // Reset to allow entry node pickup
                status: 'new',         // Reset status to new for processing
                source: 'handoff',     // Mark source as handoff (internal transfer)
                updated_at: new Date().toISOString()
            }).eq('id', lead.id);

            if (error) {
                logger.error({ error, leadId: lead.id }, 'HandoffNode: Database Update Failed');
                throw error;
            }

            logger.info({ leadId: lead.id, targetCampaignId }, 'HandoffNode: Transferred to Campaign');
            return { status: 'success', markExecuted: true, action: 'transferred' };
        }

        if (target === 'human') {
            let summary = 'Resumo não disponível';

            // 1. Context Compression (Optional AI Feature)
            // Disable by default to prevent unexpected AI calls
            if (nodeConfig.data?.enableSummary && this.historyService && this.geminiClient) {
                try {
                    // Resolve chat_id from phone (UUID lookup)
                    const { data: chatData } = await this.supabase
                        .from('chats')
                        .select('id')
                        .eq('chat_id', `${lead.phone}@s.whatsapp.net`) // JID format
                        .maybeSingle();

                    const targetChatId = chatData?.id;

                    if (targetChatId) {
                        const history = await this.historyService.getFormattedHistoryForHint(targetChatId, 10);
                        if (history && history !== 'Novo lead - inicie a conversa!') {
                            const systemInstruction = "Você é um assistente sênior de suporte. Seu objetivo é resumir conversas para que um humano assuma o atendimento.";
                            const prompt = `Resuma a seguinte conversa em uma única frase focando na intenção do lead e o motivo do transbordo:\n\n${history}`;

                            // Extract model from campaign (using logic similar to ModelService)
                            const agents = campaign?.agents;
                            const agent = Array.isArray(agents) ? agents[0] : agents;
                            const model = agent?.model || 'gemini-1.5-flash';

                            const response = await this.geminiClient.generateSimple(model, systemInstruction, prompt);
                            summary = response.text() || summary;
                        }
                    } else {
                        logger.warn({ phone: lead.phone }, 'HandoffNode: Chat UUID not found for history summary');
                    }
                } catch (e) {
                    logger.warn({ error: e.message }, 'Failed to generate handoff summary');
                }
            }

            // 2. Update status
            await this.supabase.from('leads').update({
                status: 'manual_intervention',
                updated_at: new Date().toISOString(),
                node_variables: { last_handoff_summary: summary } // Persist summary
            }).eq('id', lead.id);

            // 3. Emit Event
            if (this.campaignSocket) {
                this.campaignSocket.emit('lead.handoff', {
                    leadId: lead.id,
                    leadName: lead.name,
                    campaignId: campaign.id,
                    reason,
                    summary // Send context summary to UI
                });
            }
        }

        return { status: 'success', markExecuted: true };
    }
}

module.exports = HandoffNode;
