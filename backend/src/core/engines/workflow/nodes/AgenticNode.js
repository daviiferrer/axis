const { resolveDNA } = require('../../../config/AgentDNA');
const { NodeExecutionStateEnum, IntentEnum, SentimentEnum } = require('../../../types/CampaignEnums');
const AgentNode = require('./AgentNode');
const logger = require('../../../../shared/Logger').createModuleLogger('agentic-node');

class AgenticNode extends AgentNode {
    constructor(dependencies) {
        super(dependencies); // Pass all dependencies to Base AgentNode

        // Specialized dependencies (not in base)
        this.emotionalStateService = dependencies.emotionalStateService;
        this.guardrailService = dependencies.guardrailService;
        this.agentService = dependencies.agentService;
        this.chatService = dependencies.chatService;
    }

    async execute(lead, campaign, nodeConfig, graph) {
        logger.info({ leadId: lead.id }, 'Executing AgenticNode');

        // Resolve DNA
        const dna = resolveDNA(campaign.agents?.dna_config);

        // 1. Resolve Operating Agent & Model
        const agentId = nodeConfig.data?.agentId || nodeConfig.data?.agent_id || campaign.agent_id || campaign.agents?.id;
        let operatingAgent = campaign.agents;

        if (agentId && agentId !== campaign.agents?.id) {
            operatingAgent = await this.agentService.getAgent(agentId);
        }

        const targetModel = nodeConfig.data?.model || operatingAgent?.model;
        if (!targetModel) {
            throw new Error(`[AgenticNode] No model found for node ${nodeConfig.id}. Ensure agent or node is configured.`);
        }

        // 2. Get History (Using Base Class Method)
        const chatId = this.getChatId(lead.phone);
        // Reuse chatService for consistency
        const chat = await this.chatService.ensureChat(chatId, campaign.session_name, campaign.user_id, {
            lead_id: lead.id,
            campaign_id: campaign.id,
            name: lead.name
        });

        if (!chat) throw new Error(`[AgenticNode] Failed to get chat for lead ${lead.id}`);

        const history = await this.historyService.getChatHistory(chat.id);
        logger.debug({ leadId: lead.id, historyCount: history.length }, '📚 Chat history retrieved');

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

        // 3. Build Prompt (Sandwich Pattern)
        const contextData = {
            agent: { ...operatingAgent, ...nodeConfig.data },
            campaign, lead, chatHistory: history, emotionalAdjustment,
            nodeDirective: nodeConfig.data?.instruction_override || nodeConfig.data?.systemPrompt,
            scopePolicy: nodeConfig.data?.scope_policy || 'READ_ONLY',
            dna // Pass DNA to prompt builder
        };
        const systemInstruction = await this.promptService.buildStitchedPrompt(contextData);

        // 4. Generate Response
        logger.info({ leadId: lead.id, model: targetModel, agentId }, '🧠 Calling Gemini... (Sandwich Pattern Applied)');
        const aiResult = await this.geminiClient.generateSimple(targetModel, systemInstruction, "Responda ao lead.");

        let response;
        try {
            // Sanitization: Remove markdown code blocks (Robust JSON fix)
            let rawText = aiResult.text();
            if (rawText.startsWith('```')) {
                rawText = rawText.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/```\s*$/, '');
            }
            rawText = rawText.trim();
            response = JSON.parse(rawText);
        } catch (e) {
            logger.error({ error: e.message, raw: aiResult.text() }, 'Failed to parse AI response');
            return { status: 'error', error: 'JSON Parse Failure' };
        }

        // 4. Guardrails & CTA Injection
        const rawContent = response.messages?.[0] || response.response;
        logger.info({ leadId: lead.id, thought: response.thought }, '💭 AI Internal Reasoning');

        // Use new DNA Guardrails + Node Config
        // DNA guardrails now implicit in linguistics/restrictions or future expansion.
        // For now sticking to node config or default. 
        // User's Schema doesn't have explicit "guardrail_profile" anymore (it was removed in final catalog, only Big5/PAD/etc).
        // Wait, User Schema has "guardrail_profile" in "Templates" examples? No.
        // The examples show "decision_strategy" and "lock_strategy".
        // Linguistics/Typos impact safety? No.
        // Maybe "Big5.Conscientiousness" implies safety? 
        // For now, I will use `nodeConfig.data` as primary source for guardrails.

        const mergedGuardrails = {
            ...nodeConfig.data,
            last_sentiment: response.sentiment_score
        };

        const guardrailResult = this.guardrailService.process(
            rawContent,
            mergedGuardrails
        );

        if (guardrailResult.safetyViolated) {
            logger.info({ leadId: lead.id, reason: guardrailResult.reason }, '🚫 SAFETY VIOLATION - Forcing Handoff');
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

        // 5.1. Update Lead Temperature (Cumulative Sentiment Decay)
        const currentTemp = lead.temperature || 0.5;
        const decayFactor = 0.8;
        const sentimentWeight = 0.2;
        const newTemperature = Math.max(0, Math.min(1, (currentTemp * decayFactor) + (response.sentiment_score * sentimentWeight)));

        const tempLabel = newTemperature > 0.7 ? '🔥 HOT' : newTemperature > 0.4 ? '🌡️ WARM' : '❄️ COLD';
        logger.info({ leadId: lead.id, oldTemp: currentTemp, newTemp: newTemperature, label: tempLabel }, '🌡️ Lead Temperature Updated');

        await this.supabase.from('leads').update({
            temperature: newTemperature,
            last_sentiment: response.sentiment_score,
            last_message_at: new Date().toISOString()
        }).eq('id', lead.id);

        // 5.5. Process CRM Actions (Handoff, etc.)
        if (response.crm_actions && response.crm_actions.length > 0) {
            for (const action of response.crm_actions) {
                if (action.action === 'request_handoff') {
                    logger.info({ leadId: lead.id, reason: action.reason }, '🚫️ HANDOFF REQUESTED - Pausing AI');
                    await this.supabase.from('leads').update({
                        status: 'handoff_requested',
                        custom_fields: { ...lead.custom_fields, handoff_reason: action.reason }
                    }).eq('id', lead.id);
                    // TODO: Emit socket event
                }
            }
        }

        // 6. Send Message with HUMANIZED PHYSICS (Delegated to Base)
        const syntheticResponse = {
            response: finalizedText,
            thought: response.thought,
            // Pass through audio if AgenticNode supports it later
        };

        await this.sendResponseWithPhysics(lead, campaign, chatId, chat.id, syntheticResponse, dna.physics);

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

        // FSM-Compliant Return
        // Agent outputs classification, Campaign reads to decide next state
        return {
            status: NodeExecutionStateEnum.AWAITING_ASYNC, // Waiting for lead reply
            output: {
                // Classification for Campaign FSM to read
                intent: classifiedIntent,
                sentiment: classifiedSentiment,
                sentiment_score: response.sentiment_score,
                confidence_score: response.confidence_score,

                // Raw data for debugging
                thought: response.thought,
                response: finalizedText,
                crm_actions: response.crm_actions || []
            },
            nodeState: {
                last_outbound_at: new Date().toISOString(),
                classified_intent: classifiedIntent
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
}

module.exports = AgenticNode;
