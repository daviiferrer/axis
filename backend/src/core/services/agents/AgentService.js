/**
 * AgentService - Core Service for AI Agent Management
 */
const logger = require('../../../shared/Logger').createModuleLogger('agent-service');

class AgentService {
    constructor(supabase, settingsService) {
        this.supabase = supabase;
        this.settingsService = settingsService;
    }

    async listAgents() {
        const { data, error } = await this.supabase
            .from('agents')
            .select('*')
            .order('name', { ascending: true });

        if (error) throw error;
        return data || [];
    }

    async getAgent(id) {
        const { data, error } = await this.supabase
            .from('agents')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Create a new agent with provider validation.
     */
    async createAgent(agentData, userId) {
        const provider = agentData.provider || 'gemini';

        // Validate API key exists for provider
        if (this.settingsService) {
            const validation = await this.settingsService.validateProviderKey(userId, provider);
            if (!validation.valid) {
                const err = new Error(`Missing API key for provider: ${provider}`);
                err.code = 'MISSING_API_KEY';
                err.provider = provider;
                err.keyName = validation.keyName;
                throw err;
            }
        }

        const { data, error } = await this.supabase
            .from('agents')
            .insert({
                ...agentData,
                provider: provider,
                model: agentData.model || this.#getDefaultModel(provider)
            })
            .select()
            .single();

        if (error) throw error;
        logger.info({ agentId: data.id, provider }, 'Agent created');
        return data;
    }

    /**
     * Update an existing agent with provider validation.
     */
    async updateAgent(id, updates, userId) {
        // If changing provider, validate new API key
        if (updates.provider && this.settingsService) {
            const validation = await this.settingsService.validateProviderKey(userId, updates.provider);
            if (!validation.valid) {
                const err = new Error(`Missing API key for provider: ${updates.provider}`);
                err.code = 'MISSING_API_KEY';
                err.provider = updates.provider;
                err.keyName = validation.keyName;
                throw err;
            }
        }

        const { data, error } = await this.supabase
            .from('agents')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        logger.info({ agentId: id, updates: Object.keys(updates) }, 'Agent updated');
        return data;
    }

    /**
     * Get DNA configuration for an agent.
     * DNA = immutable identity, brand voice, compliance rules.
     */
    async getDnaConfig(agentId) {
        const { data, error } = await this.supabase
            .from('agents')
            .select('dna_config')
            .eq('id', agentId)
            .single();

        if (error) throw error;

        // Return with defaults if not configured
        return data?.dna_config || {
            identity: { name: '', role: '', company: '' },
            brand_voice: { tone: [], prohibited_words: [], emojis_allowed: true },
            compliance: { legal_rules: [], data_handling: '' }
        };
    }

    /**
     * Update DNA configuration for an agent.
     */
    async updateDnaConfig(agentId, dnaConfig) {
        const { data, error } = await this.supabase
            .from('agents')
            .update({ dna_config: dnaConfig })
            .eq('id', agentId)
            .select()
            .single();

        if (error) throw error;
        logger.info({ agentId }, 'Agent DNA config updated');
        return data.dna_config;
    }

    /**
     * Delete an agent.
     */
    async deleteAgent(id) {
        const { error } = await this.supabase
            .from('agents')
            .delete()
            .eq('id', id);

        if (error) throw error;
        logger.info({ agentId: id }, 'Agent deleted');
        return true;
    }

    /**
     * O modelo DEVE ser especificado pelo usuário ao criar o agente.
     * Não há modelo padrão hardcoded.
     */
    #getDefaultModel(provider) {
        // Modelos disponíveis por provedor (apenas para referência/validação)
        const available = {
            'gemini': ['gemini-2.5-pro-preview-05-06', 'gemini-2.0-flash', 'gemini-1.5-pro'],
            'openai': ['gpt-4o-mini', 'gpt-4o'],
            'anthropic': ['claude-3-sonnet']
        };

        // NÃO retorna default - exige que o usuário configure
        throw new Error(`ERRO: Modelo não especificado. Informe 'model' ao criar o agente. Opções para ${provider}: ${available[provider?.toLowerCase()]?.join(', ') || 'N/A'}`);
    }
}

module.exports = AgentService;
