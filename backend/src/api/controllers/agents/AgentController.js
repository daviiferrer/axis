/**
 * AgentController - API Controller for AI Agents
 */
const logger = require('../../../shared/Logger').createModuleLogger('agent-controller');
const LlmFactory = require('../../../core/factories/LlmFactory');

class AgentController {
    constructor({ agentService, llmFactory, voiceService }) {
        this.agentService = agentService;
        this.llmFactory = llmFactory;
        this.voiceService = voiceService;
    }

    async listAvailable(req, res) {
        try {
            const agents = await this.agentService.listAgents();
            res.json(agents);
        } catch (error) {
            logger.error({ err: error }, 'listAvailable Error');
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
            logger.error({ id: req.params.id, err: error.message }, '❌ Failed to get agent');
            res.status(500).json({ error: 'Failed to get agent', details: error.message });
        }
    }

    async createAgent(req, res) {
        try {
            const userId = req.user?.id || req.body.userId;

            // STRICT VALIDATION: Company Name Removed (Legacy)
            const dna = req.body.dna_config || {};
            // if (!dna.identity || !dna.identity.company || dna.identity.company.trim() === '') { ... }

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

            // STRICT VALIDATION: Company Name Removed (Legacy)
            // if (!dna.identity || !dna.identity.company || dna.identity.company.trim() === '') { ... }

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



    /**
     * Voice Enrollment (Cloning) via TTS Provider.
     */
    async enrollVoice(req, res) {
        try {
            const { audioBase64, voiceName, description, provider, agentId } = req.body;
            if (!audioBase64) return res.status(400).json({ error: 'audioBase64 is required' });
            if (!this.voiceService) return res.status(503).json({ error: 'Voice Service unavailable' });

            const userId = req.user?.id;
            const result = await this.voiceService.enrollVoice(audioBase64, voiceName, description, provider, userId, agentId);
            res.json(result);
        } catch (error) {
            logger.error({ error: error.message }, 'Voice Enrollment Failed');
            res.status(500).json({ error: 'Voice Enrollment Failed', details: error.message });
        }
    }

    /**
     * List cloned voices for the current user.
     */
    async listVoices(req, res) {
        try {
            if (!this.voiceService) return res.status(503).json({ error: 'Voice Service unavailable' });

            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ error: 'User ID not found in session' });
            }

            const agentId = req.query.agentId;
            logger.info({ userId, agentId }, '🔍 Listing voices...');

            const voices = await this.voiceService.listVoices(userId, agentId);
            res.json(voices);
        } catch (error) {
            logger.error({ error: error.message }, '❌ List Voices Failed');
            res.status(500).json({ error: 'Failed to list voices', details: error.message });
        }
    }

    /**
     * Delete a cloned voice.
     */
    async deleteVoice(req, res) {
        try {
            if (!this.voiceService) return res.status(503).json({ error: 'Voice Service unavailable' });
            const userId = req.user?.id;
            const success = await this.voiceService.deleteVoice(req.params.voiceId, userId);
            res.json({ success });
        } catch (error) {
            logger.error({ error: error.message }, 'Delete Voice Failed');
            res.status(500).json({ error: 'Failed to delete voice', details: error.message });
        }
    }

    /**
     * Generate a voice preview.
     */
    async previewVoice(req, res) {
        try {
            if (!this.voiceService) return res.status(503).json({ error: 'Voice Service unavailable' });
            let { voiceId, text, provider } = req.body;

            // DEBUG: Log exactly what we received to find "Cherry" source
            logger.info({
                body: req.body,
                receivedVoiceId: voiceId,
                userId: req.user?.id
            }, '🔍 PREVIEW REQUEST DEBUG');

            if (!voiceId) return res.status(400).json({ error: 'voiceId is required' });

            const userId = req.user?.id;

            // FALLBACK REMOVED: User requested strict behavior.

            const previewText = text || 'Olá! Esta é uma prévia da minha voz clonada. Como você está?';
            const audioBase64 = await this.voiceService.previewVoice(voiceId, previewText, provider, {
                userId,
                agentId: req.body.agentId
            });
            if (!audioBase64) return res.status(500).json({ error: 'Preview generation failed' });

            res.json({ audio_base64: audioBase64 });
        } catch (error) {
            logger.error({ error: error.message }, 'Voice Preview Failed');
            res.status(500).json({ error: 'Voice Preview Failed', details: error.message });
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
