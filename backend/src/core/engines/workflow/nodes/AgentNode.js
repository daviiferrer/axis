const { resolveDNA, SAFETY_DEFAULTS } = require('../../../config/AgentDNA');
const { NodeExecutionStateEnum } = require('../../../types/CampaignEnums');

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
        this.supabase = dependencies.supabase;
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

    async execute({ instance, lead, campaign, nodeConfig, graph }) {
        // Fallback for legacy calls (if any)
        const _lead = lead || arguments[0];
        const _campaign = campaign || arguments[1];
        const _nodeConfig = nodeConfig || arguments[2];
        const _graph = graph || arguments[3];

        console.log(`[AgentNode] Executing for lead ${_lead.phone || 'Unknown'}`);

        // Resolve DNA Configuration
        const dna = resolveDNA(_campaign.agents?.dna_config);

        // 1. Ensure Chat/JID exists
        const chatId = this.getChatId(_lead.phone);
        const chat = await this.chatService.ensureChat(chatId, _campaign.session_id, _campaign.user_id, {
            lead_id: _lead.id,
            campaign_id: _campaign.id,
            name: _lead.name
        });

        if (!chat) {
            throw new Error(`[AgentNode] Failed to get or create chat for lead ${_lead.id}`);
        }

        // 2. Get History
        const history = await this.historyService.getChatHistory(chat.id);
        const lastMsg = history[history.length - 1];

        // 3. Decision: Should we reply?
        if (lastMsg && lastMsg.role === 'assistant') {
            console.log(`[AgentNode] Last message was from assistant. Waiting for lead.`);
            return { status: NodeExecutionStateEnum.AWAITING_ASYNC };
        }

        // 4. Build Context and Prompt
        const contextData = {
            ...this.prepareContext(_lead, _campaign, _nodeConfig, _graph),
            chatHistory: history,
            dna
        };
        const systemInstruction = await this.promptService.buildStitchedPrompt(contextData);

        // 5. Generate Response
        const nodeModel = _nodeConfig?.model;
        const targetModel = nodeModel || (this.modelService ? this.modelService.getModelFromCampaignObject(_campaign) : 'gemini-pro');

        console.log(`[AgentNode] Usando modelo${nodeModel ? ' do Node' : ' do DB'}: ${targetModel}`);
        let response;
        let attempts = 0;
        const maxAttempts = 3;

        do {
            attempts++;
            const responseText = await this.geminiClient.generateSimple(targetModel, systemInstruction, "Gere a próxima resposta baseada no histórico.");

            try {
                let cleanText = responseText.text().trim();
                if (cleanText.startsWith('```')) {
                    cleanText = cleanText.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/```\s*$/, '');
                }
                response = JSON.parse(cleanText);

                const mergedGuardrails = { ...dna.guardrailProfile, ..._nodeConfig.data?.guardrails };
                const validation = this.validateResponse(response, contextData, mergedGuardrails);

                if (validation.valid) break;

                console.warn(`[AgentNode] Guardrail failure (Attempt ${attempts}): ${validation.reason}`);
            } catch (e) {
                console.error("[AgentNode] Failed to parse AI response:", e);
                if (attempts >= maxAttempts) return { status: NodeExecutionStateEnum.FAILED, error: 'JSON Parse Failure' };
            }
        } while (attempts < maxAttempts);

        if (!response) return { status: NodeExecutionStateEnum.FAILED, error: 'Failed to generate valid response' };

        // 5a. Check for Manual Handoff requirement
        const mergedGuardrails = { ...dna.guardrailProfile, ..._nodeConfig.data?.guardrails };
        const finalValidation = this.validateResponse(response, contextData, mergedGuardrails);
        if (finalValidation.handoff) {
            await this.handleHandoff(_lead, _campaign, finalValidation.reason);
            return { status: NodeExecutionStateEnum.EXITED, edge: 'handoff', reason: finalValidation.reason };
        }

        // 6. Send via WAHA with HUMANIZED PHYSICS
        await this.sendResponseWithPhysics(_lead, _campaign, chatId, chat.id, response, dna.physics);

        // 8. Update Lead Score
        if (this.leadService) {
            await this.leadService.updateLeadScore(
                _lead.id,
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
    async sendResponseWithPhysics(lead, campaign, chatId, dbChatId, aiResponse, physics) {
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
                console.log(`[AgentNode] Sending AI-generated Voice Note for lead ${lead.id}`);
                await this.wahaClient.sendVoiceBase64(campaign.session_id, chatId, aiResponse.audio_base64);
                await this.logMessage(lead, chatId, '[AUDIO_VOICE_NOTE]', true);
                continue;
            }

            if (!msgText) continue;

            // 2b. Calculate Latency using Typing Profile
            // Ensure physics.typing exists
            const delay = this.calculateTypingDelay(msgText, physics?.typing, isFirst);
            const isSimulation = campaign.mode === 'simulation';

            console.log(`[AgentNode] Human Physics: Waiting ${delay}ms before sending chunk ${i + 1}/${messagesToSend.length} (Simulation=${isSimulation})`);

            if (delay > 1000 && !isSimulation) {
                // await this.wahaClient.sendTypingState(campaign.session_id, chatId, true);
            }

            await new Promise(resolve => setTimeout(resolve, delay));

            let sentId = `sim_${Date.now()}`;
            if (!isSimulation) {
                console.log(`[AgentNode] Sending to WAHA: Session=${campaign.session_id}, Chat=${chatId}, Body=${msgText.substring(0, 30)}...`);
                const sent = await this.wahaClient.sendText(campaign.session_id, chatId, msgText);
                sentId = sent?.id;
            } else {
                console.log(`[AgentNode] SIMULATION MODE: Skipping real send for Session=${campaign.session_id}`);
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
        console.warn(`[AgentNode] Handoff required for lead ${lead.id}: ${reason}`);

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
        return clean.endsWith('@s.whatsapp.net') ? clean : `${clean}@s.whatsapp.net`;
    }

    prepareContext(lead, campaign, node, graph) {
        let product = null;
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

        const result = Math.floor(totalDelay * variance);
        // console.log(`[DEBUG] wpm=${safeWpm}, chars=${charCount}, ms=${result}`);
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
            console.error('[AgentNode] Failed to log message:', error);
        }
    }
}

module.exports = AgentNode;
