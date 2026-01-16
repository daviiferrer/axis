/**
 * ModelService - Serviço CENTRALIZADO para busca de modelo de IA.
 * 
 * TODOS os arquivos que precisam do modelo devem usar este serviço.
 * O modelo vem EXCLUSIVAMENTE da tabela `agents` no banco de dados.
 */
const logger = require('../../../shared/Logger').createModuleLogger('model-service');

class ModelService {
    constructor(supabase) {
        this.supabase = supabase;
    }

    /**
     * Busca o modelo do agente associado à campanha.
     * ÚNICO ponto de busca de modelo no sistema.
     * 
     * @param {string} campaignId - ID da campanha
     * @returns {Promise<string>} Nome do modelo configurado na tabela agents
     * @throws {Error} Se não houver modelo configurado
     */
    async getModelByCampaign(campaignId) {
        if (!campaignId) {
            throw new Error('[ModelService] ERRO: campaignId é obrigatório.');
        }

        const { data: agent, error } = await this.supabase
            .from('agents')
            .select('model')
            .eq('campaign_id', campaignId)
            .limit(1)
            .single();

        if (error || !agent?.model) {
            const msg = `[ModelService] ERRO: Nenhum modelo encontrado para campaign_id=${campaignId}. Configure 'model' na tabela 'agents'.`;
            logger.error(msg);
            throw new Error(msg);
        }

        logger.debug({ campaignId, model: agent.model }, 'Modelo obtido do DB');
        return agent.model;
    }

    /**
     * Busca o modelo diretamente pelo ID do agente.
     * 
     * @param {string} agentId - ID do agente
     * @returns {Promise<string>} Nome do modelo
     */
    async getModelByAgent(agentId) {
        if (!agentId) {
            throw new Error('[ModelService] ERRO: agentId é obrigatório.');
        }

        const { data: agent, error } = await this.supabase
            .from('agents')
            .select('model')
            .eq('id', agentId)
            .single();

        if (error || !agent?.model) {
            const msg = `[ModelService] ERRO: Nenhum modelo encontrado para agent_id=${agentId}. Configure 'model' na tabela 'agents'.`;
            logger.error(msg);
            throw new Error(msg);
        }

        return agent.model;
    }

    /**
     * Extrai o modelo de um objeto campaign que já tem agents populado.
     * Útil quando campaign já foi buscado com select('*, agents(*)').
     * 
     * @param {object} campaign - Objeto campaign com agents
     * @returns {string} Nome do modelo
     */
    getModelFromCampaignObject(campaign) {
        const agents = campaign?.agents;
        const agent = Array.isArray(agents) ? agents[0] : agents;
        const model = agent?.model;

        if (!model) {
            const defaultModel = 'gemini-1.5-flash'; // Hard fallback only if DB/Agent fails, but no ENV system config.
            logger.warn(`[ModelService] AVISO: Modelo não configurado na campanha ${campaign?.id}. Usando fallback: ${defaultModel}`);
            return defaultModel;
        }

        return model;
    }
}

module.exports = ModelService;
