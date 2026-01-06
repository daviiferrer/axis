/**
 * ChatController - MODELO VINDO DA TABELA AGENTS via ModelService.
 */
class ChatController {
    constructor(chatService, wahaClient, historyService, geminiClient, modelService) {
        this.chatService = chatService;
        this.wahaClient = wahaClient;
        this.historyService = historyService;
        this.geminiClient = geminiClient;
        this.modelService = modelService;
    }

    async getSessions(req, res) {
        try {
            const sessions = await this.wahaClient.getSessions();
            res.json(sessions);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch sessions' });
        }
    }

    async sendMessage(req, res) {
        try {
            const { session, chatId, text } = req.body;
            const userId = req.user?.id;

            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized: User required for Billing' });
            }

            const result = await this.chatService.sendMessage(session, chatId, text, userId);
            res.json(result);
        } catch (error) {
            if (error.message === 'Insufficient credits') {
                return res.status(402).json({ error: 'Insufficient credits' });
            }
            console.error(error);
            res.status(500).json({ error: 'Failed to send message: ' + error.message });
        }
    }

    async getOracleHint(req, res) {
        try {
            const { chatId, campaignId } = req.body;
            if (!campaignId) {
                return res.status(400).json({ error: 'Campaign ID is required' });
            }

            const history = await this.historyService.getFormattedHistoryForHint(chatId);

            const systemPrompt = `Você é um assistente de vendas experiente. Analise a conversa e gere UMA ÚNICA frase curta (máximo 60 caracteres) com uma dica tática.`;

            // MODELO VEM DA TABELA AGENTS
            const model = await this.modelService.getModelByCampaign(campaignId);
            const hint = await this.geminiClient.generateSimpleText(model, systemPrompt, `Conversa:\n${history}`);

            res.json({ hint: hint.trim() });
        } catch (error) {
            console.error('[ChatController] getOracleHint error:', error.message);
            res.json({ hint: 'Analise o histórico para contexto.' });
        }
    }

    async getPresence(req, res) {
        try {
            const { id } = req.params;
            res.json({ status: 'online' });
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch presence' });
        }
    }
}

module.exports = ChatController;
