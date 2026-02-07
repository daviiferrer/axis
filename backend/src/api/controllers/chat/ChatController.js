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
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            // 1. Fetch ALL active sessions from WAHA (Physical State)
            const allSessions = await this.wahaClient.getSessions();

            // 2. Fetch User's Owned Sessions from DB (Logical State)
            const { data: userSessions, error } = await this.modelService.supabase
                .from('sessions')
                .select('session_name')
                .eq('user_id', userId);

            if (error) {
                console.error('[ChatController] Error fetching user sessions:', error);
                throw error;
            }

            const allowedSessionNames = new Set(userSessions?.map(s => s.session_name) || []);

            // 3. Filter: Only return sessions that verify: WAHA_EXIST && USER_OWNS
            const filteredSessions = allSessions.filter(session => allowedSessionNames.has(session.name));

            console.log(`[ChatController] getSessions: User ${userId} requested sessions. Returning ${filteredSessions.length} of ${allSessions.length} available.`);

            res.json(filteredSessions);
        } catch (error) {
            console.error('[ChatController] getSessions error:', error);
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

    async updateTags(req, res) {
        try {
            const { session, chatId, tags } = req.body;
            if (!Array.isArray(tags)) {
                return res.status(400).json({ error: 'Tags must be an array' });
            }

            const result = await this.chatService.updateTags(chatId, session, tags);
            res.json({ tags: result });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Failed to update tags' });
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

            // Recupere o userId da campanha ou do request
            const userId = req.user?.id; // Autenticado

            const hint = await this.geminiClient.generateSimple(
                model,
                systemPrompt,
                `Conversa:\n${history}`,
                { userId } // Passando contexto para recuperar API Key
            );

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
