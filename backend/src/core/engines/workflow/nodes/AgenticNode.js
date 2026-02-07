const { resolveDNA } = require('../../../config/AgentDNA');
const { NodeExecutionStateEnum, IntentEnum, SentimentEnum } = require('../../../types/CampaignEnums');
const AgentNode = require('./AgentNode');
const logger = require('../../../../shared/Logger').createModuleLogger('agentic-node');
// Langfuse removed - not using observability

class AgenticNode extends AgentNode {
    constructor(dependencies) {
        super(dependencies); // Pass all dependencies to Base AgentNode

        // Specialized dependencies (not in base)
        this.emotionalStateService = dependencies.emotionalStateService;
        this.guardrailService = dependencies.guardrailService;
        this.agentService = dependencies.agentService;
        this.chatService = dependencies.chatService;
        this.hybridSearchService = dependencies.hybridSearchService || null; // OPTIONAL: RAG (may not be in DI)

        // Observability client (disabled)
    }

    async execute(lead, campaign, nodeConfig, graph, context) {
        // 0. EARLY EXIT: Check if already handed off
        if (lead.status === 'handoff_requested') {
            logger.info({ leadId: lead.id }, '🛑 Lead is in handoff state - AI execution skipped');
            return {
                status: NodeExecutionStateEnum.EXITED,
                edge: 'HANDOFF',
                output: { conversation_ended: true }
            };
        }

        const startTime = Date.now();
        logger.info({ leadId: lead.id }, 'Executing AgenticNode');

        // Tracing disabled

        // === SECURITY: Generate Canary Token ===
        const canaryToken = this.guardrailService.generateCanaryToken();
        logger.debug({ leadId: lead.id, canary: canaryToken.substring(0, 10) + '...' }, '🔐 Canary token generated');

        // 1. Resolve Operating Agent & Model (BEFORE resolveDNA!)
        const agentId = nodeConfig.data?.agentId || nodeConfig.data?.agent_id || campaign.agent_id || campaign.agents?.id;
        let operatingAgent = campaign.agents;

        if (agentId && agentId !== campaign.agents?.id) {
            operatingAgent = await this.agentService.getAgent(agentId);
        }

        // STRICT VALIDATION: Prevent Token Waste on Unconfigured Agents
        if (!operatingAgent || !operatingAgent.dna_config || Object.keys(operatingAgent.dna_config).length === 0) {
            const errorReason = !operatingAgent ? 'Agente não encontrado' : 'Configuração de DNA (Persona) ausente';
            const errorMsg = `CRITICAL: Agent ${agentId} is unconfigured (Missing DNA). Execution aborted to prevent hallucination and token waste.`;

            logger.error({
                leadId: lead.id,
                agentId,
                campaignId: campaign.id,
                reason: errorReason
            }, errorMsg);

            // trace.update removed

            // Emit Error Event to Frontend via CampaignSocket (inherited from Base)
            if (this.campaignSocket) {
                this.campaignSocket.emit('agent.config_error', {
                    campaignId: campaign.id,
                    campaignName: campaign.name,
                    sessionName: campaign.session_name || campaign.waha_session_name || 'unknown',
                    reason: errorReason,
                    timestamp: new Date().toISOString()
                });
            }

            // Exit early - User requested strictness
            throw new Error(errorMsg);
        }

        // Resolve DNA from the ACTUAL operating agent (not campaign.agents which may be different!)
        // FIX: This was previously called before resolving operatingAgent, causing chronemics/burstiness to be undefined
        const dna = resolveDNA(operatingAgent.dna_config);

        logger.debug({
            leadId: lead.id,
            agentId: operatingAgent.id,
            agentName: operatingAgent.name,
            hasBurstiness: dna.physics?.burstiness?.enabled
        }, '🎭 Operating Agent DNA resolved');

        const targetModel = nodeConfig.data?.model || operatingAgent?.model;
        if (!targetModel) {
            throw new Error(`[AgenticNode] No model found for node ${nodeConfig.id}. Ensure agent or node is configured.`);
        }

        // 2. Get History (Using Base Class Method)
        const chatId = this.getChatId(lead.phone);
        // Reuse chatService for consistency
        const chat = await this.chatService.ensureChat(chatId, campaign.waha_session_name || campaign.session_name, campaign.user_id, {
            lead_id: lead.id,
            campaign_id: campaign.id,
            name: lead.name
        });

        if (!chat) throw new Error(`[AgenticNode] Failed to get chat for lead ${lead.id}`);

        const history = await this.historyService.getChatHistory(chat.id);
        logger.debug({ leadId: lead.id, historyCount: history.length }, '📚 Chat history retrieved');

        // CRITICAL FIX: Ensure the current triggering message is in the history
        // The worker updates lead.last_message_body with the fresh input.
        // If DB persistence of the chat message (ChatService) lags behind, history might miss it.
        const currentInput = lead.last_message_body;
        const lastHistoryMessage = history.length > 0 ? history[history.length - 1] : null;

        if (currentInput && (!lastHistoryMessage || lastHistoryMessage.content !== currentInput)) {
            logger.warn({
                leadId: lead.id,
                input: currentInput.substring(0, 50),
                lastHistory: lastHistoryMessage?.content?.substring(0, 50)
            }, '⚠️ History mismatch: Injecting current input into prompt context');

            history.push({
                role: 'user',
                content: currentInput,
                created_at: new Date().toISOString()
            });
        }

        // 🛡️ ANTI-LOOP SAFETY PROTCOL
        // If the very last message in the history (after injection) is from the ASSISTANT,
        // it means the AI (or a human via phone) has already replied, and the user hasn't replied yet.
        // We must ABORT to prevent the AI from talking to itself or repeating responses.
        const efLastMsg = history[history.length - 1];
        if (efLastMsg && efLastMsg.role === 'assistant') {
            logger.warn({
                leadId: lead.id,
                lastContent: efLastMsg.content?.substring(0, 50)
            }, '🛑 LOOP DETECTED: Last message was from assistant. Aborting execution to prevent auto-reply loop.');

            return {
                result: {
                    status: 'SKIPPED',
                    reason: 'Last message was from assistant'
                }
            };
        }


        // Calculate turn count for persona refresh
        const turnCount = chat.turn_count || history.filter(m => m.role === 'user').length;

        // 2b. Emotional State Context
        // Use DNA Emotional Configuration as Baseline if no state exists
        let padVector;
        if (this.emotionalStateService && agentId) {
            // Try to fetch existing state
            padVector = await this.emotionalStateService.getPadVector(lead.id, agentId);
        }

        // If still no vector (first interaction), use DNA Baseline
        if (!padVector) {
            const baseline = dna.padVector || [0.5, 0.5, 0.5]; // [P, A, D]
            padVector = { pleasure: baseline[0], arousal: baseline[1], dominance: baseline[2] };
            // Initialize in DB? Maybe not until update.
        }

        const emotionalAdjustment = this.emotionalStateService
            ? this.emotionalStateService.getEmotionalAdjustment(padVector)
            : '';

        // === RAG Context Retrieval (NEW) ===
        let ragContext = '';
        if (this.hybridSearchService && history.length > 0) {
            const lastUserMessage = history.filter(m => m.role === 'user').pop()?.content || '';
            if (lastUserMessage.length > 10) { // RAG span disabled
                try {
                    const searchResults = await this.hybridSearchService.search(
                        lastUserMessage,
                        campaign.company_id,
                        { tables: ['products', 'faqs', 'knowledge_base'], limit: 5 }
                    );
                    ragContext = this.hybridSearchService.formatForPrompt(searchResults, 1000);
                    logger.debug({ leadId: lead.id, resultsCount: searchResults.length }, '🔍 RAG context retrieved');
                    // ragSpan.end();
                } catch (err) {
                    logger.warn({ error: err.message }, 'RAG search failed - continuing without context');
                    // ragSpan.end();
                }
            }
        }

        // 3. Build Prompt (Sandwich Pattern)
        // Ensure campaign context is adequate
        const campaignContext = {
            ...campaign,
            company_name: campaign.company_name || campaign.company // Let PromptService resolve via DNA
        };

        // ARCHITECTURAL FIX: Separate concerns
        // - Agent (DNA): Immutable identity (role, name, personality, tone)
        // - NodeConfig: Per-step objectives (goal, criticalSlots, cta)
        // Node should NOT override agent identity fields
        const contextData = {
            agent: operatingAgent, // <-- DNA identity is immutable, not merged with nodeConfig
            campaign: campaignContext,
            lead, chatHistory: history, emotionalAdjustment,
            nodeDirective: nodeConfig.data?.instruction_override || nodeConfig.data?.systemPrompt,
            scopePolicy: nodeConfig.data?.scope_policy || 'READ_ONLY',
            product: nodeConfig.data?.product, // <--- Product context from node
            dna, // Pass DNA to prompt builder (physics, linguistics, padVector)
            nodeConfig, // <--- Node objectives (goal, criticalSlots, cta - NOT identity)
            canaryToken, // <--- Security token for injection detection
            turnCount,   // <--- For persona refresh mechanism
            ragContext   // <--- RAG context from hybrid search
        };
        const systemInstruction = await this.promptService.buildStitchedPrompt(contextData);

        // 4. Generate Response with tracing
        logger.info({ leadId: lead.id, model: targetModel, agentId }, '🧠 Calling Gemini... (Sandwich Pattern Applied)');

        // Generation span disabled

        const aiResult = await this.geminiClient.generateSimple(
            targetModel,
            systemInstruction,
            "Responda ao lead.",
            {
                companyId: campaign.company_id,
                campaignId: campaign.id,
                chatId: chat.id,
                userId: campaign.user_id, // Pass owner for SaaS logging & Key Retrieval
                sessionId: campaign.session_name || campaign.waha_session_name
            }
        );

        let response;
        try {
            // Sanitization: Remove markdown code blocks (Robust JSON fix)
            let rawText = aiResult.text();

            // Remove {{json}} and {{/json}} markers (some models add these)
            rawText = rawText.replace(/\{\{json\}\}/gi, '').replace(/\{\{\/json\}\}/gi, '');

            // Remove {{response}} markers
            rawText = rawText.replace(/\{\{response\}\}/gi, '');

            // Remove markdown code blocks
            if (rawText.includes('```')) {
                rawText = rawText.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/```\s*$/g, '');
            }

            rawText = rawText.trim();

            // Remove leading {{ and trailing }} if present (Gemini sometimes wraps JSON)
            if (rawText.startsWith('{{') && !rawText.startsWith('{{{')) {
                rawText = rawText.substring(1); // Remove first {
            }
            if (rawText.endsWith('}}') && !rawText.endsWith('}}}')) {
                rawText = rawText.substring(0, rawText.length - 1); // Remove last }
            }

            response = JSON.parse(rawText);
        } catch (e) {
            logger.error({ error: e.message, raw: aiResult.text() }, 'Failed to parse AI response');
            // FALLBACK: Generate safe response instead of failing
            response = {
                thought: 'JSON parse failed, using fallback response',
                response: this.#getFallbackMessage(operatingAgent?.language_code || 'pt-BR'),
                sentiment_score: 0.5,
                confidence_score: 0.3,
                qualification_slots: {},
                crm_actions: []
            };
            logger.warn({ leadId: lead.id }, 'Using fallback response due to JSON parse failure');
        }

        // 4. Guardrails & CTA Injection
        const rawContent = response.messages?.[0] || response.response;
        logger.info({
            leadId: lead.id,
            thought: response.thought,
            agent: this.agent?.name,
            campaign: this.campaign?.name,
            session: this.session?.name || 'unknown'
        }, '💭 AI Internal Reasoning');

        // End generation span with output
        // generationSpan.end();

        // Log usage metrics
        const usage = aiResult.usageMetadata || {};
        // Langfuse score disabled

        // Use new DNA Guardrails + Node Config WITH CANARY DETECTION
        const mergedGuardrails = {
            ...nodeConfig.data,
            last_sentiment: response.sentiment_score
        };

        // Process with canary token detection (NEW)
        const guardrailResult = this.guardrailService.processWithCanary(
            rawContent,
            mergedGuardrails,
            canaryToken
        );

        // Log security event if blocked
        if (guardrailResult.blocked || guardrailResult.safetyViolated) {
            // Security event logging disabled

            logger.warn({
                leadId: lead.id,
                reason: guardrailResult.reason,
                blocked: guardrailResult.blocked
            }, '🚫 SECURITY/SAFETY VIOLATION');

            response.crm_actions = response.crm_actions || [];
            response.crm_actions.push({
                action: 'request_handoff',
                reason: `Guardrail: ${guardrailResult.reason}`
            });
        }

        const finalizedText = guardrailResult.text;
        logger.info({ leadId: lead.id, finalMessage: finalizedText }, '📤 AI Final Response Generated');

        // 5. Update Emotional State
        if (this.emotionalStateService && agentId) {
            logger.info({ leadId: lead.id, sentiment: response.sentiment_score, confidence: response.confidence_score }, '🎭 Updating Emotional State');
            await this.emotionalStateService.updatePadVector(
                lead.id, agentId, response.sentiment_score, response.confidence_score
            );
        }

        // --- NEW: Loop & Bot Detection ---
        const historyContext = history.slice(-6); // Check last 3 exchanges
        if (this.detectLoopOrBot(historyContext, finalizedText)) {
            logger.warn({ leadId: lead.id }, '🤖 Bot/Loop Detected - Ending Conversation');
            return {
                status: NodeExecutionStateEnum.EXITED,
                edge: 'DEFAULT', // Or specific 'END' edge if available
                output: {
                    response: null, // Don't send the generated response
                    thought: 'Loop detected. Ending conversation.',
                    conversation_ended: true
                }
            };
        }
        // ---------------------------------

        // 5.1. Update Lead Temperature (Cumulative Sentiment Decay)
        const currentTemp = lead.temperature || 0.5;
        const decayFactor = 0.8;
        const sentimentWeight = 0.2;
        const newTemperature = Math.max(0, Math.min(1, (currentTemp * decayFactor) + (response.sentiment_score * sentimentWeight)));

        const tempLabel = newTemperature > 0.7 ? 'HOT' : newTemperature > 0.4 ? 'WARM' : 'COLD';
        logger.info({ leadId: lead.id, oldTemp: currentTemp, newTemp: newTemperature, label: tempLabel }, '🌡️ Lead Temperature Updated');

        await this.supabase.from('leads').update({
            temperature: newTemperature,
            last_sentiment: response.sentiment_score,
            last_message_at: new Date().toISOString()
        }).eq('id', lead.id);

        // 5.2. Extract and Update Lead Name (if discovered)
        const extractedName = response.qualification_slots?.lead_name;
        if (extractedName && extractedName !== 'unknown' && extractedName !== null) {
            const currentName = lead.name || '';
            // Only update if current name is missing, phone number, or "Desconhecido"
            const isNameMissing = !currentName ||
                currentName === 'Desconhecido' ||
                currentName.toLowerCase() === 'unknown' ||
                /^\d+$/.test(currentName); // Just phone number

            if (isNameMissing) {
                logger.info({ leadId: lead.id, extractedName, previousName: currentName }, '📛 Lead name extracted from conversation');
                await this.supabase.from('leads').update({
                    name: extractedName
                }).eq('id', lead.id);
            }
        }

        // 5.5. Process CRM Actions (Handoff, etc.)
        let handoffTriggered = false; // New flag for flow control
        if (response.crm_actions && response.crm_actions.length > 0) {
            for (const action of response.crm_actions) {
                if (action.action === 'request_handoff') {
                    logger.info({ leadId: lead.id, reason: action.reason }, '🚫️ HANDOFF REQUESTED - Pausing AI');
                    await this.supabase.from('leads').update({
                        status: 'handoff_requested',
                        custom_fields: { ...lead.custom_fields, handoff_reason: action.reason }
                    }).eq('id', lead.id);
                    handoffTriggered = true; // Set flag
                    // TODO: Emit socket event
                }
            }
        }

        // 6. Send Message with HUMANIZED PHYSICS (Delegated to Base)
        // FIX: AI uses |Split| delimiter to indicate message breaks
        let messagesToSend = null;
        const responseText = response.response || finalizedText;

        if (responseText && responseText.includes('|Split|')) {
            // AI explicitly marked where to split messages
            messagesToSend = responseText
                .split('|Split|')
                .map(m => m.trim())
                .filter(m => m.length > 0);
            logger.debug({ leadId: lead.id, chunks: messagesToSend.length }, '📤 Response split by |Split| delimiter');
        }

        const syntheticResponse = {
            messages: messagesToSend,  // Pre-split messages (if |Split| was used)
            response: messagesToSend ? null : responseText, // Fallback: let burstiness handle it
            thought: response.thought,
        };

        const sessionName = nodeConfig.data?.sessionName || campaign.session_name || campaign.waha_session_name;
        await this.sendResponseWithPhysics(lead, campaign, chatId, chat.id, syntheticResponse, dna.physics, sessionName, operatingAgent.name);

        // 7. Classify Intent for Campaign FSM to read
        // CRITICAL: Agent classifies, Campaign decides transition
        const classifiedIntent = this._classifyIntent(response.intent || response.thought);
        const classifiedSentiment = this._classifySentiment(response.sentiment_score);

        logger.info({
            leadId: lead.id,
            intent: classifiedIntent,
            sentiment: classifiedSentiment,
            confidence: response.confidence_score
        }, '🏷️ Agent Classification (Campaign will read this)');

        // 8. Slot Validation (Merged from QualificationNode)
        const criticalSlots = nodeConfig.data?.criticalSlots || [];
        let slotsSatisfied = true;

        if (criticalSlots.length > 0) {
            const slots = response.qualification_slots || {};
            slotsSatisfied = criticalSlots.every(slot => slots[slot] && slots[slot] !== 'unknown');
            logger.info({ leadId: lead.id, satisfied: slotsSatisfied, missing: criticalSlots.filter(s => !slots[s] || slots[s] === 'unknown') }, '🕵️ Critical Slots Check');
        }

        // FSM-Compliant Return
        // If handoff was triggered, we EXIT the node to stop the loop
        if (handoffTriggered) {
            return {
                status: NodeExecutionStateEnum.EXITED,
                edge: 'HANDOFF',
                output: {
                    intent: IntentEnum.HANDOFF_REQUEST,
                    sentiment: classifiedSentiment,
                    response: finalizedText,
                    conversation_ended: true
                }
            };
        }

        return {
            status: NodeExecutionStateEnum.AWAITING_ASYNC, // Waiting for lead reply

            // DURABLE EXECUTION: Checkpoint data for StateCheckpointService
            checkpoint: {
                waitingFor: 'USER_REPLY',
                waitUntil: null, // No timeout - waits indefinitely for reply
                correlationKey: chatId // Use chatId for webhook correlation
            },

            output: {
                // Classification for Campaign FSM to read
                intent: classifiedIntent,
                sentiment: classifiedSentiment,

                // Slots Data
                slots_satisfied: slotsSatisfied, // logic nodes can read this
                qualification_slots: response.qualification_slots,

                sentiment_score: response.sentiment_score,
                confidence_score: response.confidence_score,

                // Raw data for debugging
                thought: response.thought,
                response: finalizedText,
                crm_actions: response.crm_actions || []
            },
            nodeState: {
                last_outbound_at: new Date().toISOString(),
                classified_intent: classifiedIntent,
                awaiting_reply: true
            }
        };
    }

    /**
     * Classify intent from AI response into IntentEnum
     * Campaign FSM reads this to decide transition
     */
    _classifyIntent(intentStr) {
        if (!intentStr) return IntentEnum.UNKNOWN;

        const normalized = intentStr.toUpperCase().replace(/[^A-Z_]/g, '_');

        // Direct match
        if (IntentEnum[normalized]) return IntentEnum[normalized];

        // Fuzzy matching for common patterns
        if (normalized.includes('INTEREST') && normalized.includes('NOT')) return IntentEnum.NOT_INTERESTED;
        if (normalized.includes('INTEREST')) return IntentEnum.INTERESTED;
        if (normalized.includes('PRICE') || normalized.includes('COST')) return IntentEnum.PRICING_QUERY;
        if (normalized.includes('HANDOFF') || normalized.includes('HUMAN')) return IntentEnum.HANDOFF_REQUEST;
        if (normalized.includes('DEMO')) return IntentEnum.WANTS_DEMO;
        if (normalized.includes('BUY') || normalized.includes('PURCHASE')) return IntentEnum.READY_TO_BUY;
        if (normalized.includes('OBJECTION')) return IntentEnum.OBJECTION_PRICE;
        if (normalized.includes('QUESTION') || normalized.includes('QUERY')) return IntentEnum.QUESTION;

        return IntentEnum.UNKNOWN;
    }

    /**
     * Classify sentiment score into SentimentEnum
     */
    _classifySentiment(score) {
        if (score === undefined || score === null) return SentimentEnum.NEUTRAL;
        if (score < 0.2) return SentimentEnum.VERY_NEGATIVE;
        if (score < 0.4) return SentimentEnum.NEGATIVE;
        if (score < 0.6) return SentimentEnum.NEUTRAL;
        if (score < 0.8) return SentimentEnum.POSITIVE;
        return SentimentEnum.VERY_POSITIVE;
    }
    /**
     * Detects infinite loops or bot-like repetitive behavior.
     */
    detectLoopOrBot(history, currentResponse) {
        if (!history || history.length < 4) return false;

        const lastUserMsg = history[history.length - 1];
        const lastAiMsg = history[history.length - 2];

        // 1. Repetitive Pleasantries at the end
        const pleasantries = ['obrigad', 'tchau', 'até mais', 'valeu', 'disponha', 'certo', 'ok'];
        const isPleasantry = (text) => text && pleasantries.some(p => text.toLowerCase().includes(p));

        if (isPleasantry(currentResponse) && isPleasantry(lastUserMsg?.content)) {
            // If both just said goodbye/thanks, STOP.
            return true;
        }

        // 2. Exact Repetition (Echo Loop)
        if (lastAiMsg && lastAiMsg.role === 'assistant' && lastAiMsg.content === currentResponse) {
            return true;
        }

        return false;
    }

    /**
     * Returns localized fallback message for JSON parse errors.
     * @param {string} languageCode - ISO language code (e.g., 'pt-BR', 'en-US')
     * @returns {string} Localized error message
     * @private
     */
    #getFallbackMessage(languageCode) {
        const messages = {
            'pt-BR': 'Desculpe, tive um problema técnico. Pode repetir?',
            'pt': 'Desculpe, tive um problema técnico. Pode repetir?',
            'en-US': 'Sorry, I had a technical issue. Can you repeat that?',
            'en': 'Sorry, I had a technical issue. Can you repeat that?',
            'es-ES': 'Disculpa, tuve un problema técnico. ¿Puedes repetir?',
            'es': 'Disculpa, tuve un problema técnico. ¿Puedes repetir?'
        };
        return messages[languageCode] || messages['pt-BR'];
    }
}

module.exports = AgenticNode;
