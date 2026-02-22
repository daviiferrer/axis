const { resolveDNA, SAFETY_DEFAULTS } = require('../../../config/AgentDNA');
const { NodeExecutionStateEnum } = require('../../../types/CampaignEnums');
const { composingCache } = require('../../../services/system/CacheService');
const socketService = require('../../../../shared/SocketService');
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
        this.voiceService = dependencies.voiceService;
    }

    /**
     * @deprecated AgentNode.execute() was removed — AgenticNode.execute() is the active implementation.
     * This base class now only provides shared utility methods inherited by AgenticNode:
     * - sendResponseWithPhysics()
     * - calculateTypingDelay()
     * - splitMessageWithBurstiness()
     * - getChatId() / getSendChatId()
     * - logMessage()
     */
    async execute(lead, campaign, nodeConfig, graph, context) {
        logger.error({ leadId: lead.id, nodeType: nodeConfig?.type }, '🛑 AgentNode.execute() called directly — this is a legacy code path. Use AgenticNode instead.');

        return { status: NodeExecutionStateEnum.FAILED, error: 'AgentNode.execute() is deprecated. Use AgenticNode.' };
    }

    /**
     * Orchestrates the sending of messages with human-like characteristics.
     */
    async sendResponseWithPhysics(lead, campaign, chatId, dbChatId, aiResponse, physics, sessionNameOverride, authorName = 'AI') {
        const wahaChatId = chatId.endsWith('@s.whatsapp.net')
            ? chatId.replace('@s.whatsapp.net', '@c.us')
            : chatId;

        logger.info({
            sessionNameOverride,
            campaignSession: campaign.session_name,
            wahaSession: campaign.waha_session_name,
            wahaChatId,
            authorName
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

        // FIX: If audio exists but text was suppressed (messagesToSend empty), 
        // add a placeholder to trigger the loop so audio gets sent.
        if (messagesToSend.length === 0 && aiResponse.audio_base64) {
            messagesToSend = ['[AUDIO_PLACEHOLDER]'];
        }

        // 2. Iterate and Send with Latency
        for (let i = 0; i < messagesToSend.length; i++) {
            // 🛑 SMART ANTI-COLLISION: Check if user started typing during thought process
            if (composingCache.isComposing(wahaChatId)) {
                logger.info({
                    leadId: lead.id,
                    chatId: wahaChatId,
                    progress: `${i}/${messagesToSend.length}`
                }, '✋ Smart Interruption: User started typing. Aborting remaining messages.');
                return; // Stop sending immediately. User's new message will trigger re-evaluation.
            }

            const msgText = messagesToSend[i];
            const isFirst = i === 0;

            // 2a. Voice Note Support
            if (isFirst && aiResponse.audio_base64) {
                logger.info({ leadId: lead.id }, 'Sending AI-generated Voice Note');

                let audioToSend = aiResponse.audio_base64;
                try {
                    logger.debug('🔄 Converting audio to Opus for mobile compatibility...');
                    const convertedAudio = await this.wahaClient.convertVoice(sessionName, { data: aiResponse.audio_base64 });
                    if (convertedAudio) {
                        audioToSend = convertedAudio;
                        logger.info('✅ Audio converted to Opus successfully');
                    }
                } catch (conversionError) {
                    logger.warn({ error: conversionError.message }, '⚠️ Audio conversion failed, sending original (might not play on mobile)');
                }

                await this.wahaClient.sendVoiceBase64(sessionName, wahaChatId, audioToSend);
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
                try {
                    logger.info({ session: sessionName, wahaChatId, bodyPreview: msgText.substring(0, 30) }, '📤 Sending to WAHA...');
                    const sent = await this.wahaClient.sendText(sessionName, wahaChatId, msgText);
                    sentId = sent?.id;
                    logger.info({ sentId }, '✅ Message sent to WAHA');
                } catch (sendError) {
                    logger.error({ error: sendError.message, stack: sendError.stack }, '❌ Failed to send message via WAHA client');
                }
            } else {
                logger.info({ session: sessionName }, 'SIMULATION MODE: Skipping real send');
            }

            // 2c. Log Message
            try {
                await this.supabase.from('messages').insert({
                    message_id: sentId || `sim_${Date.now()}`,
                    chat_id: dbChatId,
                    body: msgText,
                    from_me: true,
                    author: authorName,
                    is_ai: true,
                    is_demo: isSimulation,
                    ai_thought: aiResponse.thought
                });
            } catch (dbError) {
                logger.error({ error: dbError.message }, '❌ Failed to log sent message to DB');
            }
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
            agent: { ...(Array.isArray(campaign.agents) ? campaign.agents[0] : campaign.agents), ...node.data },
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
            const rawReadMs = config.read_ms ?? config.reading_speed_ms ?? 1000;
            totalDelay += Math.max(0, rawReadMs); // Bound to prevent negative values
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
        // 1. Initial Cleanup
        if (!text) return [];
        if (text.length < 50) return [text]; // Keep very short messages intact

        // 2. Split by Double Newlines (Strong Paragraphs) first
        // This ensures "Opa, Davi!" followed by a blank line stays separate
        const paragraphs = text.split(/\n\s*\n/);

        const finalChunks = [];
        const rawMaxChunk = strategy?.max_chunk || 150;
        const MAX_CHUNK_KEY = Math.max(10, rawMaxChunk); // Target max length per bubble, min 10
        
        for (const paragraph of paragraphs) {
            // Normal Chunking logic
            if (paragraph.length <= MAX_CHUNK_KEY) {
                finalChunks.push(paragraph.trim());
                continue;
            }

            // 3. Split by Sentence Endings (. ? !)
            const sentences = paragraph.match(/[^.!?\n]+[.!?]+|[^.!?\n]+$/g) || [paragraph];
            let currentBuffer = "";

            for (const sentence of sentences) {
                const trimmed = sentence.trim();
                if (!trimmed) continue;

                if ((currentBuffer + " " + trimmed).length > MAX_CHUNK_KEY) {
                    if (currentBuffer) finalChunks.push(currentBuffer.trim());
                    currentBuffer = trimmed;
                } else {
                    currentBuffer = currentBuffer ? currentBuffer + " " + trimmed : trimmed;
                }
            }

            if (currentBuffer) finalChunks.push(currentBuffer.trim());
        }

        return finalChunks.filter(c => c.length > 0);
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
