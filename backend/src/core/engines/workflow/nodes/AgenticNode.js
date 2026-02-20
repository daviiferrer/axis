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

        // CRITICAL SAFEGUARD: Prevent execution if system prompt/playbook is empty.
        // The user explicitly requested this to avoid AI halluciations and flow loops when left blank.
        const systemPrompt = nodeConfig.data?.systemPrompt || nodeConfig.data?.instruction_override || '';
        if (!systemPrompt || systemPrompt.trim() === '') {
            logger.warn({ leadId: lead.id, nodeId: nodeConfig.id }, '🛑 Agentic Node skipped: Playbook prompt is completely empty.');

            // Auto-advance the flow (Skip AI execution)
            return {
                status: NodeExecutionStateEnum.EXITED,
                edge: 'default',
                continueExecution: true, // Forces immediate transition to next node without waiting for user reply
                output: { reason: 'Skipped due to empty playbook prompt', ready_to_close: true, slots_satisfied: true }
            };
        }

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

        let aiResult;
        let response;
        let toolCallCount = 0;
        const MAX_TOOL_CALLS = 2; // Prevent infinite webhook loops

        while (toolCallCount <= MAX_TOOL_CALLS) {
            const systemInstruction = await this.promptService.buildStitchedPrompt(contextData);

            // 4. Generate Response with tracing
            logger.info({ leadId: lead.id, model: targetModel, agentId, toolLoop: toolCallCount }, '🧠 Calling Gemini...');

            // We intentionally do NOT use native Gemini tools anymore because it conflicts
            // with our strict application/json schema forcing the AI into infinite loop hallucinations.
            // Tools are instead passed cleanly inside the text prompt via PromptService.
            const customTools = nodeConfig.data?.tools || [];
            let nativeTools = undefined;

            // CHECK FOR IMAGE DATA (Multimodal)
            if (lead._imageData) {
                logger.info({ leadId: lead.id, mimeType: lead._imageData.mimeType }, '🖼️ Using Vision Model for Image Analysis');
                const mediaItems = [{
                    mimeType: lead._imageData.mimeType,
                    data: lead._imageData.data
                }];

                aiResult = await this.geminiClient.generateWithVision(
                    targetModel,
                    systemInstruction,
                    "Analise a imagem e responda ao lead de acordo com seu objetivo.",
                    mediaItems,
                    {
                        companyId: campaign.company_id,
                        campaignId: campaign.id,
                        chatId: chat.id,
                        userId: campaign.user_id,
                        sessionId: campaign.session_name || campaign.waha_session_name,
                        tools: nativeTools
                    }
                );
            } else {
                // Standard Text Generation
                const generateOptions = {
                    companyId: campaign.company_id,
                    campaignId: campaign.id,
                    chatId: chat.id,
                    userId: campaign.user_id, // Pass owner for SaaS logging & Key Retrieval
                    sessionId: campaign.session_name || campaign.waha_session_name,
                    tools: nativeTools
                };

                // Gemini API throws 400 if you mix responseMimeType JSON + Tools
                if (!nativeTools) {
                    generateOptions.generationConfig = { responseMimeType: "application/json" };
                }

                aiResult = await this.geminiClient.generateSimple(
                    targetModel,
                    systemInstruction,
                    "Responda ao lead. Se uma ferramenta customizada for útil, acione-a.",
                    generateOptions
                );
            }

            try {
                // Sanitization: Remove markdown code blocks (Robust JSON fix)
                let rawText = '';
                const functionCalls = (aiResult.functionCalls && typeof aiResult.functionCalls === 'function') ? aiResult.functionCalls() : null;

                if (functionCalls && functionCalls.length > 0) {
                    const call = functionCalls[0];
                    logger.info({ leadId: lead.id, functionName: call.name }, '🎣 NATIVE GEMINI FUNCTION CALL INTERCEPTED');
                    rawText = JSON.stringify({
                        tool_call: { name: call.name, arguments: call.args || {} },
                        thought: call.args?.reason || "Usando ferramenta conectada.",
                        response: null
                    });
                } else {
                    rawText = aiResult.text();
                }

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

                // FIX: Escape literal newlines/tabs inside JSON string values.
                // Gemini often outputs markdown with real line breaks inside the "response" field,
                // which are invalid inside JSON strings and cause JSON.parse to fail.
                rawText = rawText.replace(/(?<=":[ ]*"(?:[^"\\]|\\.)*)(\r?\n)/g, '\\n')
                    .replace(/(?<=":[ ]*"(?:[^"\\]|\\.)*)(\t)/g, '\\t');

                // FIX: Convert Python-like booleans and None to valid JSON
                rawText = rawText
                    .replace(/:\s*None\b/g, ': null')
                    .replace(/:\s*False\b/g, ': false')
                    .replace(/:\s*True\b/g, ': true');

                // Try to find the JSON boundaries before parsing (handles cases where AI prepends text)
                const firstBrace = rawText.indexOf('{');
                const lastBrace = rawText.lastIndexOf('}');

                if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
                    rawText = rawText.slice(firstBrace, lastBrace + 1);
                }

                try {
                    response = JSON.parse(rawText);
                } catch (innerErr) {
                    // Second attempt: manually extract response field with regex
                    logger.warn({ innerError: innerErr.message }, 'First JSON.parse failed, attempting regex extraction');
                    const thoughtMatch = rawText.match(/"thought"\s*:\s*"((?:[^"\\]|\\.)*)"/);
                    const responseMatch = rawText.match(/"response"\s*:\s*"([\s\S]*?)"\s*,\s*"(?:ready_to_close|sentiment|crm|qualification)/);
                    const sentimentMatch = rawText.match(/"sentiment_score"\s*:\s*([\d.]+)/);
                    const confidenceMatch = rawText.match(/"confidence_score"\s*:\s*([\d.]+)/);

                    if (responseMatch) {
                        // Clean up the extracted response (un-escape for display)
                        const extractedResponse = responseMatch[1]
                            .replace(/\\n/g, '\n')
                            .replace(/\\t/g, '\t')
                            .replace(/\\"/g, '"');

                        response = {
                            thought: thoughtMatch ? thoughtMatch[1] : 'Extracted via regex fallback',
                            response: extractedResponse,
                            sentiment_score: sentimentMatch ? parseFloat(sentimentMatch[1]) : 0.5,
                            confidence_score: confidenceMatch ? parseFloat(confidenceMatch[1]) : 0.5,
                            qualification_slots: {},
                            crm_actions: []
                        };
                        logger.info({ leadId: lead.id }, '✅ Regex extraction succeeded — response recovered');
                    } else {
                        throw innerErr; // Let outer catch handle it
                    }
                }
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

                // Extract tool_call if standard parsing fails but tool_call is distinctly present
                if (aiResult.text().includes('"tool_call"')) {
                    const toolCallMatch = aiResult.text().match(/"tool_call"\s*:\s*(\{[\s\S]*?\})/);
                    if (toolCallMatch) {
                        try {
                            response = { tool_call: JSON.parse(toolCallMatch[1]) };
                            logger.info('✅ Recovered tool_call payload explicitly');
                        } catch (e) { }
                    }
                }
            }

            // === TOOL CALL INTERCEPTION ===
            if (response?.tool_call) {
                toolCallCount++;
                logger.info({ thought: response.thought, tool: response.tool_call?.name }, "🛠️ AI requested Custom Tool Call");

                const toolDef = (nodeConfig.data?.tools || []).find(t => t.name === response.tool_call.name);

                if (!toolDef || !toolDef.url) {
                    logger.warn({ requestedTool: response.tool_call.name }, "⚠️ Tool requested by AI does not exist or has no URL");
                    contextData.chatHistory.push({
                        role: 'assistant',
                        content: `[SYSTEM: Tentei usar a ferramenta '${response.tool_call.name}', mas ela não existe ou está desconfigurada. Continue a conversa com o usuário sem ela e responda a solicitacao original.]`
                    });
                    continue; // Loop again
                }

                try {
                    logger.info({ url: toolDef.url, method: toolDef.method }, "🌐 Executing External Webhook");
                    const fetchOptions = {
                        method: toolDef.method || 'POST',
                        headers: { 'Content-Type': 'application/json' }
                    };

                    if (fetchOptions.method !== 'GET') {
                        fetchOptions.body = JSON.stringify({
                            ...(response.tool_call.arguments || {}),
                            metadata: {
                                lead_id: lead.id,
                                campaign_id: campaign.id,
                                agent_id: agentId,
                                timestamp: new Date().toISOString()
                            }
                        });
                    }

                    const webhookResponse = await fetch(toolDef.url, fetchOptions);
                    const webhookData = await webhookResponse.text();

                    logger.info({ status: webhookResponse.status }, "✅ Webhook Executed");

                    logger.info({ status: webhookResponse.status }, "✅ Webhook Executed");

                    // The Gemini SDK requires a STRICT alternating sequence of:
                    // 1. Model requesting the tool (functionCall)
                    // 2. User/Function supplying the result (functionResponse)

                    // We must push the AI's internal decision to the history manually
                    // because our JSON engine interception skipped the native history appending
                    contextData.chatHistory.push({
                        role: 'model',
                        parts: [{
                            functionCall: {
                                name: response.tool_call.name,
                                args: response.tool_call.arguments || {}
                            }
                        }]
                    });

                    // Followed immediately by the result
                    contextData.chatHistory.push({
                        role: 'function',
                        parts: [{
                            functionResponse: {
                                name: response.tool_call.name,
                                response: {
                                    result: webhookData
                                }
                            }
                        }]
                    });
                } catch (err) {
                    logger.error({ error: err.message }, "❌ Webhook Execution Failed");
                    contextData.chatHistory.push({
                        role: 'function',
                        parts: [{
                            functionResponse: {
                                name: response.tool_call.name,
                                response: {
                                    error: `API Network Error: ${err.message}`
                                }
                            }
                        }]
                    });
                }

                continue; // Re-prompt AI with the webhook result
            }

            // Normal response received, break the loop
            break;
        } // End of While Loop

        if (response?.tool_call) {
            logger.warn({ leadId: lead.id }, '⚠️ Max Tool Call limits reached.');
            response = {
                thought: 'Max webhook loops reached',
                response: 'Tive um problema técnico interno para consultar sua solicitação (Limites excedidos).',
                sentiment_score: 0.5,
                confidence_score: 0.5,
                crm_actions: []
            };
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

        // 5.3. Persist qualification_slots SCOPED to current criticalSlots only
        const aiSlots = response.qualification_slots || {};
        const existingQualification = lead.custom_fields?.qualification || {};
        const configuredSlots = nodeConfig.data?.criticalSlots || [];
        let slotsUpdated = false;

        // Start fresh: only keep slots that are in the CURRENT config
        const mergedSlots = {};
        for (const slotName of configuredSlots) {
            // Priority: new AI value > existing persisted value > nothing
            const aiValue = aiSlots[slotName];
            const existingValue = existingQualification[slotName];
            if (aiValue && aiValue !== 'unknown' && aiValue !== null) {
                mergedSlots[slotName] = aiValue;
            } else if (existingValue && existingValue !== 'unknown' && existingValue !== null) {
                mergedSlots[slotName] = existingValue;
            }
        }

        // Check if any NEW data was extracted this turn
        for (const slotName of configuredSlots) {
            const aiValue = aiSlots[slotName];
            if (aiValue && aiValue !== 'unknown' && aiValue !== null && aiValue !== existingQualification[slotName]) {
                slotsUpdated = true;
                break;
            }
        }

        // Always persist scoped slots (also cleans up stale data from old configs)
        const needsCleanup = Object.keys(existingQualification).some(k => !configuredSlots.includes(k));
        if (slotsUpdated || needsCleanup) {
            const updatedCustomFields = {
                ...(lead.custom_fields || {}),
                qualification: mergedSlots
            };
            await this.supabase.from('leads').update({
                custom_fields: updatedCustomFields
            }).eq('id', lead.id);

            // Update local lead reference so slot check below uses fresh data
            lead.custom_fields = updatedCustomFields;

            logger.info({
                leadId: lead.id,
                slots: mergedSlots,
                configuredSlots,
                filled: configuredSlots.filter(s => mergedSlots[s]),
                missing: configuredSlots.filter(s => !mergedSlots[s])
            }, '💾 Qualification slots persisted to lead');

            // 5.4. Update Lead Score (dynamic, based on slot fill percentage + sentiment)
            if (this.leadService) {
                await this.leadService.updateLeadScore(
                    lead.id,
                    mergedSlots,
                    configuredSlots,
                    response.sentiment_score
                );
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
                    if (this.campaignSocket) {
                        this.campaignSocket.emit('agent.handoff', {
                            leadId: lead.id,
                            reason: action.reason,
                            campaignId: campaign.id,
                            timestamp: new Date().toISOString()
                        });
                    }
                }
            }
        }

        // 6. SLOT CHECK FIRST — Before sending response
        // If all critical slots are already filled, EXIT immediately without sending
        // another AI message (prevents "give me your CPF" when CPF is already collected)
        const criticalSlots = nodeConfig.data?.criticalSlots || [];
        let slotsSatisfied = true;

        if (criticalSlots.length > 0) {
            // Use PERSISTED accumulated slots (all turns), scoped to current config
            const persistedSlots = lead.custom_fields?.qualification || {};
            slotsSatisfied = criticalSlots.every(slot => persistedSlots[slot] && persistedSlots[slot] !== 'unknown');
            logger.info({
                leadId: lead.id,
                satisfied: slotsSatisfied,
                filled: criticalSlots.filter(s => persistedSlots[s] && persistedSlots[s] !== 'unknown'),
                missing: criticalSlots.filter(s => !persistedSlots[s] || persistedSlots[s] === 'unknown'),
                values: Object.fromEntries(criticalSlots.map(s => [s, persistedSlots[s] || 'unknown']))
            }, '🕵️ Critical Slots Check');

            // CRITICAL: If slots are satisfied, mark ready to close but allow final message to be sent
            if (slotsSatisfied) {
                logger.info({ leadId: lead.id }, '✅ All critical slots filled. Triggering auto-completion after response.');
                response.ready_to_close = true;
            }
        }

        // 8. Classify Intent (HOISTED for Voice Context)
        const classifiedIntent = this._classifyIntent(response.intent || response.thought);
        const classifiedSentiment = this._classifySentiment(response.sentiment_score);

        // 6. Voice Synthesis (DETERMINISTIC)
        const responseMode = nodeConfig.data?.response_mode || 'dna_default';
        if (this.voiceService && dna.voice_config && responseMode !== 'text_only') {
            try {
                const voiceCtx = {
                    ...contextData,
                    intent: response.intent || classifiedIntent,
                    nodeGoal: nodeConfig.data?.goal,
                    lastMessage: history[history.length - 1],
                    turnCount: turnCount
                };

                if (this.voiceService.shouldUseVoice(dna.voice_config, voiceCtx)) {
                    let targetVoiceId = dna.voice_config.voice_id;
                    const provider = dna.voice_config.provider || 'qwen';

                    // Qwen Fallback Fix for "Cherry" / Invalid IDs
                    if (!targetVoiceId || targetVoiceId === 'Cherry' || targetVoiceId.startsWith('default-')) {
                        logger.warn({ leadId: lead.id, invalidVoice: targetVoiceId, provider }, '⚠️ (Agentic) Invalid Voice ID. Resolving fallback...');
                        try {
                            const voices = await this.voiceService.listVoices(campaign.user_id, agentId);
                            const providerVoices = voices.filter(v => v.provider === provider || (!v.provider && provider === 'qwen'));

                            if (providerVoices && providerVoices.length > 0) {
                                targetVoiceId = providerVoices[0].voice_id;
                                logger.info({ leadId: lead.id, resolvedVoice: targetVoiceId, provider }, '🎙️ (Agentic) Fallback to latest enrolled voice');
                            } else {
                                throw new Error('No enrolled voices found for fallback');
                            }
                        } catch (e) {
                            logger.error({ err: e.message }, 'Voice fallback failed');
                            throw e;
                        }
                    }

                    logger.info({ leadId: lead.id, voiceId: targetVoiceId, provider }, '🎙️ Voice triggered (Agentic)');
                    // Use finalizedText which has passed guardrails
                    const audio = await this.voiceService.synthesize(
                        finalizedText || response.response,
                        targetVoiceId,
                        dna.voice_config.voice_instruction,
                        provider, // Pass the provider
                        {
                            userId: campaign.user_id, // Pass userId for LMNT key retrieval
                            leadId: lead.id,
                            agentId: operatingAgent.id,
                            voiceConfig: dna.voice_config
                        }
                    );
                    if (audio) response.audio_base64 = audio;
                }
            } catch (err) {
                logger.error({ err: err.message }, '❌ Agentic Voice Synthesis Failed');
            }
        }

        // 7. Send Message with HUMANIZED PHYSICS (Delegated to Base)
        // Only reached if slots are NOT yet satisfied (or no criticalSlots configured)
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
            response: response.audio_base64 ? null : (messagesToSend ? null : responseText), // Suppress text if audio exists
            thought: response.thought,
            audio_base64: response.audio_base64 // <--- PASS AUDIO
        };

        const sessionName = nodeConfig.data?.sessionName || campaign.session_name || campaign.waha_session_name;
        await this.sendResponseWithPhysics(lead, campaign, chatId, chat.id, syntheticResponse, dna.physics, sessionName, operatingAgent.name);



        // AUTO-TRANSITION: Guarantee new → contacted after first AI reply
        // If the AI just replied, the lead was contacted — period.
        if (lead.status === 'new') {
            try {
                await this.supabase.from('leads').update({
                    status: 'contacted',
                    updated_at: new Date().toISOString()
                }).eq('id', lead.id);
                logger.info({ leadId: lead.id }, '📬 Lead auto-transitioned: new → contacted (first AI reply)');
            } catch (e) {
                logger.warn({ leadId: lead.id, error: e.message }, 'Failed to auto-transition lead to contacted');
            }
        }

        logger.info({
            leadId: lead.id,
            intent: classifiedIntent,
            sentiment: classifiedSentiment,
            confidence: response.confidence_score
        }, '🏷️ Agent Classification (Campaign will read this)');

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

        // 9. Determine Next Action (EXIT if done)
        if (response.ready_to_close || slotsSatisfied || response.conversation_ended) {
            logger.info({ leadId: lead.id }, '✅ Ending Node Conversation Loop (ready to close or slots filled)');
            return {
                status: NodeExecutionStateEnum.EXITED,
                edge: 'default',
                output: {
                    // Classification for Campaign FSM to read
                    intent: classifiedIntent,
                    sentiment: classifiedSentiment,

                    // Slots Data
                    slots_satisfied: slotsSatisfied,
                    qualification_slots: response.qualification_slots,
                    sentiment_score: response.sentiment_score,
                    confidence_score: response.confidence_score,
                    thought: response.thought,
                    response: finalizedText,
                    crm_actions: response.crm_actions || [],

                    ready_to_close: true,
                    conversation_ended: false
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
