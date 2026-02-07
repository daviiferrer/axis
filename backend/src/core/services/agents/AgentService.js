/**
 * AgentService - Core Service for AI Agent Management
 */
const logger = require('../../../shared/Logger').createModuleLogger('agent-service');
const { AgentModels } = require('../../../config/AgentModels');

class AgentService {
    constructor({ supabaseClient, settingsService }) {
        this.supabase = supabaseClient;
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

        // FIX: Remove 'status' field that doesn't exist in DB
        const cleanedData = { ...agentData };
        delete cleanedData.status;

        const { data, error } = await this.supabase
            .from('agents')
            .insert({
                ...cleanedData,
                user_id: userId, // CRITICAL: Assign ownership
                created_by: userId, // REQUIRED by RLS Policy
                provider: provider,
                model: cleanedData.model || this.#getDefaultModel(provider)
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

        // Fix: Map 'status' (frontend) to 'is_active' (db)
        if (updates.status) {
            updates.is_active = updates.status === 'active';
            delete updates.status;
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
     * Retorna modelo padrão para o provedor.
     * Atualizado para Gemini 2.5 Flash (Melhor custo-benefício)
     */
    #getDefaultModel(provider) {
        // Simple mapping for now, assuming Gemini is main focus
        if (provider === 'gemini') {
            return AgentModels.GEMINI_2_5_FLASH;
        }

        const defaults = {
            'openai': 'gpt-4o-mini',
            'anthropic': 'claude-3-sonnet'
        };

        const defaultModel = defaults[provider?.toLowerCase()];
        if (defaultModel) {
            return defaultModel;
        }

        // Default global fallback
        return AgentModels.GEMINI_2_5_FLASH;
    }
}

module.exports = AgentService;
