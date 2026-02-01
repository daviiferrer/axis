const { resolveDNA, SAFETY_DEFAULTS } = require('../../../config/AgentDNA');
const { NodeExecutionStateEnum } = require('../../../types/CampaignEnums');
const logger = require('../../../../shared/Logger').createModuleLogger('agent-node');

/**
 * AgentNode - Executor for AI Agent nodes.
 * FSM Compliant: Returns NodeExecutionStateEnum.
 */
class AgentNode {
    /**
     * @param {object} params
     * @param {object} params.services - Core services (PromptService, HistoryService, etc.)
     * @param {object} params.clients - Infrastructure clients (GeminiClient, WahaClient)
     */
    constructor(dependencies) {
        this.supabase = dependencies.supabaseClient;
        this.geminiClient = dependencies.geminiClient;
        this.wahaClient = dependencies.wahaClient;
        this.promptService = dependencies.promptService;
        this.historyService = dependencies.historyService;
        this.agentService = dependencies.agentService;
        this.chatService = dependencies.chatService;
        this.leadService = dependencies.leadService;
        this.modelService = dependencies.modelService;
        this.campaignSocket = dependencies.campaignSocket;
    }

    async execute(lead, campaign, nodeConfig, graph, context) {
        logger.info({
            leadId: lead.id,
            phone: lead.phone,
            campaignKeys: Object.keys(campaign),
            session_name: campaign.session_name,
            waha_session_name: campaign.waha_session_name,
            nodeConfigData: nodeConfig.data
        }, '🔍 DEBUG: Executing AgentNode - Inspection');

        // Extract Node Configuration (Fluid Context)
        const sessionName = nodeConfig.data?.sessionName || campaign.session_name || campaign.waha_session_name;
        // Check legacy or new location for tenantId
        const tenantId = nodeConfig.data?.tenantId || campaign.company_id || 'default';

        logger.info({ sessionName, tenantId, nodeId: nodeConfig.id }, '✅ AgentNode Context Resolved');

        // Resolve DNA Configuration
        const dna = resolveDNA(campaign.agents?.dna_config);

        // 1. Ensure Chat/JID exists
        const chatId = this.getChatId(lead.phone);
        const chat = await this.chatService.ensureChat(chatId, campaign.session_id, campaign.user_id, {
            lead_id: lead.id,
            campaign_id: campaign.id,
            name: lead.name
        });

        if (!chat) {
            throw new Error(`[AgentNode] Failed to get or create chat for lead ${lead.id}`);
        }

        // 2. Get History
        const history = await this.historyService.getChatHistory(chat.id);
        const lastMsg = history[history.length - 1];

        // 3. Decision: Should we reply?
        if (lastMsg && lastMsg.role === 'assistant') {
            logger.debug({ leadId: lead.id }, 'Last message was from assistant. Waiting for lead.');
            return { status: NodeExecutionStateEnum.AWAITING_ASYNC };
        }

        // 4. Build Context and Prompt
        const contextData = {
            ...this.prepareContext(lead, campaign, nodeConfig, graph),
            chatHistory: history,
            dna,
            nodeConfig: nodeConfig // <--- NEW: Pass node config for objectives layer
        };
        const systemInstruction = await this.promptService.buildStitchedPrompt(contextData);

        // 5. Generate Response
        const nodeModel = nodeConfig?.model;
        const targetModel = nodeModel || (this.modelService ? this.modelService.getModelFromCampaignObject(campaign) : 'gemini-pro');

        logger.debug({ model: targetModel, nodeModel: !!nodeModel }, 'Using model for generation');

        let response;
        let attempts = 0;
        const maxAttempts = 3;

        do {
            attempts++;
            const responseText = await this.geminiClient.generateSimple(
                targetModel,
                systemInstruction,
                "Gere a próxima resposta baseada no histórico.",
                { companyId: campaign.company_id }
            );

            try {
                let cleanText = responseText.text().trim();
                if (cleanText.startsWith('```')) {
                    cleanText = cleanText.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/```\s*$/, '');
                }
                response = JSON.parse(cleanText);

                const mergedGuardrails = { ...dna.guardrailProfile, ...nodeConfig.data?.guardrails };
                const validation = this.validateResponse(response, contextData, mergedGuardrails);

                if (validation.valid) break;

                logger.warn({ attempt: attempts, reason: validation.reason }, 'Guardrail failure');
            } catch (e) {
                logger.error({ error: e.message, attempt: attempts }, 'Failed to parse AI response');
                if (attempts >= maxAttempts) return { status: NodeExecutionStateEnum.FAILED, error: 'JSON Parse Failure' };
            }
        } while (attempts < maxAttempts);

        if (!response) return { status: NodeExecutionStateEnum.FAILED, error: 'Failed to generate valid response' };

        // 5a. Check for Manual Handoff requirement
        const mergedGuardrails = { ...dna.guardrailProfile, ..._nodeConfig.data?.guardrails };
        const finalValidation = this.validateResponse(response, contextData, mergedGuardrails);
        if (finalValidation.handoff) {
            await this.handleHandoff(lead, campaign, finalValidation.reason);
            return { status: NodeExecutionStateEnum.EXITED, edge: 'handoff', reason: finalValidation.reason };
        }

        // 6. Send via WAHA with HUMANIZED PHYSICS
        // Pass the resolved sessionName to the sender method
        await this.sendResponseWithPhysics(lead, campaign, chatId, chat.id, response, dna.physics, sessionName);

        // 8. Update Lead Score
        if (this.leadService) {
            await this.leadService.updateLeadScore(
                lead.id,
                response.qualification_slots || {},
                response.sentiment_score
            );
        }

        // Return Suspended State to wait for next user reply
        return { status: NodeExecutionStateEnum.AWAITING_ASYNC, output: response };
    }

    /**
     * Orchestrates the sending of messages with human-like characteristics.
     */
    async sendResponseWithPhysics(lead, campaign, chatId, dbChatId, aiResponse, physics, sessionNameOverride) {
        // WAHA requires @c.us for sending messages to users
        const wahaChatId = chatId.endsWith('@s.whatsapp.net')
            ? chatId.replace('@s.whatsapp.net', '@c.us')
            : chatId;

        logger.info({
            sessionNameOverride,
            campaignSession: campaign.session_name,
            wahaSession: campaign.waha_session_name,
            wahaChatId
        }, '🔍 DEBUG: sendResponseWithPhysics - Session Resolution');

        // Resolve Session Name with fallback hierarchy
        const sessionName = sessionNameOverride || campaign.waha_session_name || campaign.session_name;

        if (!sessionName) {
            logger.error({ leadId: lead.id, campaignId: campaign.id }, '❌ Missing Session Name for WAHA');
            throw new Error('Session name is required to send messages (Method: sendResponseWithPhysics)');
        }

        // Ensure country code 55 for BR if missing (Robustness)
        // If it starts with a 9 and len is 11, it might be raw local number. 
        // But better to trust the `lead.phone` which should be normalized.

        logger.debug({ wahaChatId, originalChatId: chatId }, '📤 Target JID Resolved');

        let messagesToSend = [];

        // 1. Resolve response content (Array or Single String)
        if (aiResponse.messages && aiResponse.messages.length > 0) {
            messagesToSend = aiResponse.messages;
        } else if (aiResponse.response) {
            // Apply Burstiness/Splitting
            if (physics?.burstiness?.enabled) {
                messagesToSend = this.splitMessageWithBurstiness(aiResponse.response, physics.burstiness);
            } else {
                messagesToSend = [aiResponse.response];
            }
        }

        // 2. Iterate and Send with Latency
        for (let i = 0; i < messagesToSend.length; i++) {
            const msgText = messagesToSend[i];
            const isFirst = i === 0;

            // 2a. Voice Note Support
            if (isFirst && aiResponse.audio_base64) {
                logger.info({ leadId: lead.id }, 'Sending AI-generated Voice Note');
                await this.wahaClient.sendVoiceBase64(sessionName, wahaChatId, aiResponse.audio_base64);
                await this.logMessage(lead, chatId, '[AUDIO_VOICE_NOTE]', true);
                continue;
            }

            if (!msgText) continue;

            // 2b. Calculate Latency using Typing Profile
            // Ensure physics.typing exists
            const delay = this.calculateTypingDelay(msgText, physics?.typing, isFirst);
            const isSimulation = campaign.mode === 'simulation';

            logger.debug({ leadId: lead.id, delay, chunkIndex: i, isSimulation }, 'Human Physics Wait');

            if (delay > 1000 && !isSimulation) {
                // VISUAL FEEDBACK: Show "Typing..." on WhatsApp
                this.wahaClient.setPresence(sessionName, wahaChatId, 'composing').catch(err => {
                    logger.warn({ error: err.message }, 'Failed to set typing presence');
                });
            }

            await new Promise(resolve => setTimeout(resolve, delay));

            let sentId = `sim_${Date.now()}`;

            if (!isSimulation) {
                logger.debug({ session: sessionName, wahaChatId, bodyPreview: msgText.substring(0, 30) }, 'Sending to WAHA');
                const sent = await this.wahaClient.sendText(sessionName, wahaChatId, msgText);
                sentId = sent?.id;
            } else {
                logger.info({ session: sessionName }, 'SIMULATION MODE: Skipping real send');
            }

            // 2c. Log Message
            await this.supabase.from('messages').insert({
                message_id: sentId || `sim_${Date.now()}`,
                chat_id: dbChatId,
                body: msgText,
                from_me: true,
                author: campaign.agents?.name || 'AI',
                is_ai: true,
                is_demo: isSimulation,
                ai_thought: aiResponse.thought
            });
        }
    }

    validateResponse(response, context, guardrails = {}) {
        // Dynamic Guardrails from config or Defaults
        const MIN_SENTIMENT = guardrails.min_sentiment ?? SAFETY_DEFAULTS.MIN_SENTIMENT;
        const MIN_CONFIDENCE = guardrails.min_confidence ?? SAFETY_DEFAULTS.MIN_CONFIDENCE;

        if (response.sentiment_score < MIN_SENTIMENT) {
            return { valid: false, reason: 'Sentiment too low/hostile', handoff: true };
        }
        if (response.confidence_score < MIN_CONFIDENCE) {
            return { valid: false, reason: 'Low AI Confidence', handoff: true };
        }



        if (guardrails.prohibited_topics && guardrails.prohibited_topics.length > 0) {
            const joined = response.messages?.join(' ') + ' ' + (response.response || '');
            for (const topic of guardrails.prohibited_topics) {
                if (new RegExp(topic, 'i').test(joined)) {
                    return { valid: false, reason: `Prohibited topic: ${topic}` };
                }
            }
        }

        return { valid: true };
    }

    async handleHandoff(lead, campaign, reason) {
        logger.warn({ leadId: lead.id, reason }, 'Handoff required');

        await this.supabase.from('leads').update({
            status: 'manual_intervention',
            updated_at: new Date().toISOString()
        }).eq('id', lead.id);

        if (this.campaignSocket) {
            this.campaignSocket.emit('lead.handoff', {
                leadId: lead.id,
                leadName: lead.name,
                campaignId: campaign.id,
                reason
            });
        }
    }

    getChatId(phone) {
        let clean = phone.replace(/\D/g, '');
        if (clean.length >= 10 && clean.length <= 11) clean = '55' + clean;
        // Use @s.whatsapp.net for database consistency (how messages are stored)
        return clean.endsWith('@s.whatsapp.net') ? clean : `${clean}@s.whatsapp.net`;
    }

    /**
     * Get the WAHA-compatible chatId for SENDING messages.
     * WAHA expects @c.us format.
     */
    getSendChatId(phone) {
        let clean = phone.replace(/\D/g, '');
        if (clean.length >= 10 && clean.length <= 11) clean = '55' + clean;
        return `${clean}@c.us`;
    }

    prepareContext(lead, campaign, node, graph) {
        let product = node.data?.product || null; // <--- Support embedded product config
        let methodology = null;
        const objectionPlaybook = [];

        if (graph?.nodes) {
            const outboundEdges = graph.edges.filter(e => e.source === node.id);
            for (const edge of outboundEdges) {
                const target = graph.nodes.find(n => n.id === edge.target);
                if (target?.type === 'product') product = target.data;
                if (target?.type === 'methodology') methodology = target.data;
            }

            graph.nodes.filter(n => n.type === 'objection').forEach(obj => {
                if (obj.data) {
                    objectionPlaybook.push({
                        label: obj.data.label,
                        objectionType: obj.data.objectionType,
                        responses: obj.data.responses || []
                    });
                }
            });
        }

        return {
            lead,
            campaign,
            agent: { ...campaign.agents, ...node.data },
            product,
            methodology,
            objectionPlaybook,
            strategy_graph: graph,
            nodeDirective: node.data?.systemPrompt
        };
    }

    /**
     * Calculates typing delay based on Log-Normal distribution principles.
     */
    calculateTypingDelay(text, typingProfile, isFirstMessage) {
        // Defaults if profile missing (fallback)
        const config = typingProfile || { read_ms: 200, wpm: 45 };
        const charCount = text.length;

        let totalDelay = 0;

        // 1. Reading Time
        if (isFirstMessage) {
            totalDelay += 1000; // Base reaction
        }

        // 2. Typing Time
        // Support both 'wpm' (Canonical) and 'typing_speed_wpm' (Legacy/Config)
        const speedWpm = config.wpm ?? config.typing_speed_wpm ?? 40;

        // Avoid division by zero
        const safeWpm = Math.max(1, speedWpm);
        const msPerChar = 60000 / (safeWpm * 5);
        const typingTime = charCount * msPerChar;

        totalDelay += typingTime;

        // 3. Stochastic Variation (Log-Normal simulation)
        // Add random variance +/- 20%
        const variance = (Math.random() * 0.4) + 0.8;

        let result = Math.floor(totalDelay * variance);

        // 4. USABILITY GUARDRAIL: Cap delay to prevent "minutes of waiting"
        // Even for long texts, users engaged with a bot expect faster replies.
        // Cap at 12 seconds per message chunk.
        const MAX_DELAY_MS = 12000;
        if (result > MAX_DELAY_MS) {
            result = MAX_DELAY_MS + Math.floor(Math.random() * 2000); // 12-14s max
        }

        // logger.debug({ wpm: safeWpm, chars: charCount, ms: result }, 'Calculated typing delay');
        return result;
    }

    /**
     * Splits a long text into "bursts" based on semantic boundaries.
     */
    splitMessageWithBurstiness(text, strategy) {
        // If text is short, return as is
        if (text.length < 150) return [text];

        // Split by punctuation (.!?)
        const sentences = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [text];

        const chunks = [];
        let currentChunk = "";

        for (const sentence of sentences) {
            if ((currentChunk + sentence).length > 200) {
                if (currentChunk) chunks.push(currentChunk.trim());
                currentChunk = sentence;
            } else {
                currentChunk += sentence;
            }
        }
        if (currentChunk) chunks.push(currentChunk.trim());

        return chunks;
    }

    async logMessage(lead, chatId, body, fromMe = false) {
        try {
            const { data: chat } = await this.supabase
                .from('chats')
                .select('id')
                .eq('lead_id', lead.id)
                .single();

            if (chat) {
                await this.supabase.from('messages').insert({
                    chat_id: chat.id,
                    body: body,
                    from_me: fromMe,
                    is_ai: true,
                    author: 'AI',
                    created_at: new Date().toISOString()
                });
            }
        } catch (error) {
            logger.error({ error: error.message }, 'Failed to log message');
        }
    }
}

module.exports = AgentNode;
