/**
 * AgentController - API Controller for AI Agents
 */
const logger = require('../../../shared/Logger').createModuleLogger('agent-controller');
const LlmFactory = require('../../../core/factories/LlmFactory');

class AgentController {
    constructor({ agentService, llmFactory, agentGraphEngine }) {
        this.agentService = agentService;
        this.llmFactory = llmFactory;
        this.agentGraphEngine = agentGraphEngine;
    }

    async listAvailable(req, res) {
        try {
            const agents = await this.agentService.listAgents();
            res.json(agents);
        } catch (error) {
            console.error('[AgentController] listAvailable Error:', error);
            res.status(500).json({ error: 'Failed to list agents', details: error.message });
        }
    }

    async getAgent(req, res) {
        try {
            const agent = await this.agentService.getAgent(req.params.id);
            if (!agent) {
                return res.status(404).json({ error: 'Agent not found' });
            }
            res.json(agent);
        } catch (error) {
            res.status(500).json({ error: 'Failed to get agent' });
        }
    }

    async createAgent(req, res) {
        try {
            const userId = req.user?.id || req.body.userId;

            // STRICT VALIDATION: Company Name is Mandatory in DNA
            const dna = req.body.dna_config || {};
            if (!dna.identity || !dna.identity.company || dna.identity.company.trim() === '') {
                return res.status(400).json({
                    error: 'VALIDATION_ERROR',
                    message: 'O nome da empresa é obrigatório na configuração do Agente (Identidade).'
                });
            }

            const agent = await this.agentService.createAgent(req.body, userId);
            res.status(201).json(agent);
        } catch (error) {
            if (error.code === 'MISSING_API_KEY') {
                return res.status(400).json({
                    error: 'MISSING_API_KEY',
                    message: `Missing API key for provider: ${error.provider}`,
                    provider: error.provider,
                    keyName: error.keyName
                });
            }
            logger.error({ error: error.message }, 'Create agent failed');
            res.status(500).json({ error: 'Failed to create agent' });
        }
    }

    async updateAgent(req, res) {
        try {
            const userId = req.user?.id || req.body.userId;

            // STRICT VALIDATION: Company Name is Mandatory in DNA (only if DNA is being updated)
            if (req.body.dna_config) {
                const dna = req.body.dna_config;
                if (!dna.identity || !dna.identity.company || dna.identity.company.trim() === '') {
                    return res.status(400).json({
                        error: 'VALIDATION_ERROR',
                        message: 'O nome da empresa é obrigatório na configuração do Agente (Identidade).'
                    });
                }
            }

            const agent = await this.agentService.updateAgent(req.params.id, req.body, userId);
            res.json(agent);
        } catch (error) {
            if (error.code === 'MISSING_API_KEY') {
                return res.status(400).json({
                    error: 'MISSING_API_KEY',
                    message: `Missing API key for provider: ${error.provider}`,
                    provider: error.provider,
                    keyName: error.keyName
                });
            }
            logger.error({ error: error.message }, 'Update agent failed');
            res.status(500).json({ error: 'Failed to update agent' });
        }
    }

    async deleteAgent(req, res) {
        try {
            await this.agentService.deleteAgent(req.params.id);
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ error: 'Failed to delete agent' });
        }
    }

    async chat(req, res) {
        try {
            const { model, history, systemPrompt, provider } = req.body;
            const userId = req.user?.id || req.body.userId;

            if (!history || history.length === 0) {
                return res.status(400).json({ error: 'History (messages) is required' });
            }

            // Get LLM client for provider
            const llmClient = await this.llmFactory.getClient(userId, provider || 'gemini');

            // Modelo DEVE ser especificado pelo cliente
            if (!model) {
                return res.status(400).json({ error: 'Modelo é obrigatório. Configure na tabela agents.' });
            }

            const response = await llmClient.generateContent(
                model,
                systemPrompt || '',
                history
            );

            res.json({
                response: response.text(),
                metrics: response._metrics
            });
        } catch (error) {
            if (error.message?.startsWith('MISSING_API_KEY')) {
                const [, provider, keyName] = error.message.split(':');
                return res.status(400).json({
                    error: 'MISSING_API_KEY',
                    provider,
                    keyName
                });
            }
            logger.error({ error: error.message }, 'Agent chat error');
            res.status(500).json({ error: 'Chat failed' });
        }
    }

    async graphChat(req, res) {
        try {
            const { messages, contextData, model } = req.body;
            logger.info({ model: model || 'default' }, '🧠 Starting Agentic Workflow');

            const result = await this.agentGraphEngine.run(messages, contextData, model);

            const lastMessage = result.messages[result.messages.length - 1];
            res.json({
                response: JSON.parse(lastMessage.content),
                state: result
            });
        } catch (error) {
            logger.error({ error: error.message }, 'Graph Agent Error');
            res.status(500).json({ error: 'Graph Execution Failed', details: error.message });
        }
    }

    /**
     * Get available LLM providers.
     */
    async getProviders(req, res) {
        try {
            const providers = LlmFactory.getAvailableProviders();
            res.json(providers);
        } catch (error) {
            res.status(500).json({ error: 'Failed to get providers' });
        }
    }
}

module.exports = AgentController;
