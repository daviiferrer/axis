/**
 * OracleController - Handles contextual hints generation.
 * MODELO VINDO DA TABELA AGENTS via ModelService.
 */
const logger = require('../../../shared/Logger').createModuleLogger('oracle');

class OracleController {
    constructor({ geminiClient, historyService, modelService }) {
        this.geminiClient = geminiClient;
        this.historyService = historyService;
        this.modelService = modelService;
    }

    async getHint(req, res) {
        try {
            const { chatId, campaignId } = req.body;
            if (!chatId) return res.status(400).json({ error: 'Chat ID is required' });
            if (!campaignId) return res.status(400).json({ error: 'Campaign ID is required' });

            // 1. Get History
            const conversationSummary = await this.historyService.getFormattedHistoryForHint(chatId);

            // 2. Build Prompt
            const systemPrompt = `Você é o "Oracle", um consultor tático de vendas especializado em cold outreach.
Analise a conversa abaixo e forneça uma DICA CURTA (máximo 10 palavras) para o vendedor humano.
A dica deve ser prática e específica para esta conversa.`;

            // 3. MODELO VEM DA TABELA AGENTS
            const model = await this.modelService.getModelByCampaign(campaignId);

            // 4. Generate Hint
            const response = await this.geminiClient.generateSimple(model, systemPrompt, conversationSummary);
            const hint = response.text().trim();

            res.json({ hint: hint || 'Analise o histórico para contexto.' });

        } catch (error) {
            logger.error({ err: error.message }, 'getHint error');
            res.json({ hint: 'Analise o histórico para contexto.' });
        }
    }
}

module.exports = OracleController;
