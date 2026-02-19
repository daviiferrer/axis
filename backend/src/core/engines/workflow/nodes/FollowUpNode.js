/**
 * FollowUpNode - Automated Lead Re-engagement with Scheduled Messages.
 * 
 * Two modes:
 *   1. TEMPLATE: Sends a static message with variable replacement ({{name}}, etc.)
 *   2. AGENT:    Delegates to a selected AI agent with follow-up context injected.
 * 
 * Features:
 *   - Configurable timeout (minutes/hours/days)
 *   - Max attempts with counter
 *   - Cancel-on-reply detection
 *   - Business hours enforcement (8:00-20:00 Mon-Fri)
 *   - Checkpoint-based durable execution (same pattern as DelayNode)
 * 
 * Exit edges:
 *   - user_replied:   Lead responded during wait period
 *   - max_attempts:   All follow-up attempts exhausted
 *   - default:        Fallthrough (shouldn't normally fire)
 */
const logger = require('../../../../shared/Logger').createModuleLogger('followup-node');
const { NodeExecutionStateEnum } = require('../../../types/CampaignEnums');

// Follow-up goal templates injected into agent prompt
const GOAL_PROMPTS = {
    RECOVER_COLD: `CONTEXTO DE FOLLOW-UP: Este lead ficou frio e não responde há algum tempo. 
Sua missão é reengajá-lo de forma natural e empática. NÃO seja agressivo. 
Relembre brevemente o valor da conversa anterior e ofereça ajuda.`,

    CROSS_SELL: `CONTEXTO DE FOLLOW-UP: Este lead já demonstrou interesse anteriormente. 
Sua missão é apresentar um produto/serviço complementar de forma natural. 
Conecte com o interesse original antes de introduzir a novidade.`,

    CHECK_IN: `CONTEXTO DE FOLLOW-UP: Faz um tempo que não temos contato com este lead. 
Sua missão é fazer um check-in amigável. Pergunte se ainda pode ajudar. 
Seja breve e genuíno, sem pressão comercial.`,

    APPOINTMENT_REMINDER: `CONTEXTO DE FOLLOW-UP: Este lead tem um compromisso agendado. 
Sua missão é enviar um lembrete cordial sobre a reunião/consulta. 
Confirme data, hora e pergunte se precisa de algo.`,

    CUSTOM: null // Uses customObjective from config
};

class FollowUpNode {
    constructor(dependencies) {
        this.wahaClient = dependencies.wahaClient;
        this.supabase = dependencies.supabaseClient;
        this.agentService = dependencies.agentService;
        this.chatService = dependencies.chatService;
    }

    async execute(lead, campaign, nodeConfig, graph, context) {
        const config = nodeConfig.data || {};
        const {
            mode = 'template',             // 'template' | 'agent'
            agentId = null,                 // UUID do agente (modo agent)
            followUpGoal = 'RECOVER_COLD',  // Objetivo injetado no prompt
            customObjective = '',           // Para goal CUSTOM
            messageTemplate = 'Oi {{name}}, tudo bem? Ainda posso te ajudar?',
            timeout = 24,
            timeoutUnit = 'h',
            maxAttempts = 3,
            businessHoursOnly = true,
            cancelOnReply = true
        } = config;

        const state = lead.node_state || {};
        const attempts = state.follow_up_attempts || 0;

        logger.info({
            leadId: lead.id,
            node: nodeConfig.id,
            mode,
            attempt: attempts + 1,
            maxAttempts
        }, '🔄 Executing FollowUpNode');

        // ────────────────────────────────────────────
        // 1. CHECK: Lead respondeu durante a espera?
        // ────────────────────────────────────────────
        if (cancelOnReply && state.scheduled_at) {
            const scheduledAt = new Date(state.scheduled_at);
            const lastMessageAt = new Date(lead.last_message_at || 0);

            if (lastMessageAt > scheduledAt) {
                logger.info({
                    leadId: lead.id,
                    lastMessage: lastMessageAt.toISOString(),
                    scheduledAt: scheduledAt.toISOString()
                }, '💬 Lead respondeu durante espera do follow-up → saindo via user_replied');

                return {
                    status: NodeExecutionStateEnum.EXITED,
                    edge: 'user_replied',
                    markExecuted: true
                };
            }
        }

        // ────────────────────────────────────────────
        // 2. CHECK: Atingiu limite de tentativas?
        // ────────────────────────────────────────────
        if (attempts >= maxAttempts) {
            logger.info({
                leadId: lead.id,
                attempts,
                maxAttempts
            }, '🛑 Max tentativas de follow-up atingido → saindo via max_attempts');

            return {
                status: NodeExecutionStateEnum.EXITED,
                edge: 'max_attempts',
                markExecuted: true
            };
        }

        // ────────────────────────────────────────────
        // 3. PRIMEIRO ACESSO: Agendar espera
        // ────────────────────────────────────────────
        if (!state.scheduled_at) {
            const waitUntil = this.#calculateNextSend(timeout, timeoutUnit, businessHoursOnly);

            logger.info({
                leadId: lead.id,
                waitUntil: waitUntil.toISOString(),
                businessHoursOnly
            }, '⏱️ Agendando primeiro follow-up (checkpoint)');

            return {
                status: NodeExecutionStateEnum.AWAITING_ASYNC,
                checkpoint: {
                    waitingFor: 'TIMER',
                    waitUntil: waitUntil.toISOString()
                },
                nodeState: {
                    scheduled_at: waitUntil.toISOString(),
                    entered_at: new Date().toISOString(),
                    follow_up_attempts: 0
                }
            };
        }

        // ────────────────────────────────────────────
        // 4. CHECK: Timer ainda não expirou?
        // ────────────────────────────────────────────
        const scheduledAt = new Date(state.scheduled_at);
        const now = new Date();

        if (now < scheduledAt) {
            logger.debug({
                leadId: lead.id,
                remaining: Math.round((scheduledAt - now) / 1000) + 's'
            }, '⏳ Ainda esperando follow-up');

            return {
                status: NodeExecutionStateEnum.AWAITING_ASYNC,
                checkpoint: {
                    waitingFor: 'TIMER',
                    waitUntil: scheduledAt.toISOString()
                },
                nodeState: state
            };
        }

        // ────────────────────────────────────────────
        // 5. TIMER EXPIROU → Enviar follow-up!
        // ────────────────────────────────────────────
        const sessionName = nodeConfig.data?.sessionName || campaign.session_name;
        const chatId = this.#getChatId(lead.phone);

        try {
            if (mode === 'agent' && agentId) {
                await this.#sendAgentFollowUp(lead, campaign, nodeConfig, agentId, followUpGoal, customObjective, attempts, sessionName, chatId);
            } else {
                await this.#sendTemplateFollowUp(lead, campaign, messageTemplate, sessionName, chatId, attempts);
            }
        } catch (error) {
            logger.error({
                leadId: lead.id,
                error: error.message,
                mode
            }, '❌ Erro ao enviar follow-up');

            // Even on error, reschedule to retry
        }

        // ────────────────────────────────────────────
        // 6. RESCHEDULE: Próxima tentativa
        // ────────────────────────────────────────────
        const nextAttempts = attempts + 1;

        if (nextAttempts >= maxAttempts) {
            logger.info({
                leadId: lead.id,
                attempts: nextAttempts,
                maxAttempts
            }, '🏁 Última tentativa de follow-up enviada → saindo via max_attempts');

            return {
                status: NodeExecutionStateEnum.EXITED,
                edge: 'max_attempts',
                markExecuted: true
            };
        }

        const nextWaitUntil = this.#calculateNextSend(timeout, timeoutUnit, businessHoursOnly);

        logger.info({
            leadId: lead.id,
            attempt: nextAttempts,
            nextWaitUntil: nextWaitUntil.toISOString()
        }, '🔄 Follow-up enviado, reagendando próxima tentativa');

        return {
            status: NodeExecutionStateEnum.AWAITING_ASYNC,
            checkpoint: {
                waitingFor: 'TIMER',
                waitUntil: nextWaitUntil.toISOString()
            },
            nodeState: {
                scheduled_at: nextWaitUntil.toISOString(),
                entered_at: state.entered_at,
                follow_up_attempts: nextAttempts,
                last_follow_up_at: new Date().toISOString()
            }
        };
    }

    // ════════════════════════════════════════════
    // PRIVATE: Send Template Message
    // ════════════════════════════════════════════
    async #sendTemplateFollowUp(lead, campaign, messageTemplate, sessionName, chatId, attempt) {
        let message = this.#replaceVariables(messageTemplate, lead, attempt);

        const isSimulation = campaign.mode === 'simulation';
        let sentId = `sim_followup_${Date.now()}`;

        if (!isSimulation) {
            const sent = await this.wahaClient.sendText(sessionName, chatId, message);
            sentId = sent.id;
        } else {
            logger.info({ leadId: lead.id }, '📨 Follow-up (Simulation Mode) - Skipping WAHA');
        }

        // Log message
        const chatRecord = await this.supabase
            .from('chats')
            .select('id')
            .eq('lead_id', lead.id)
            .single();

        if (chatRecord.data) {
            await this.supabase.from('messages').insert({
                message_id: sentId,
                chat_id: chatRecord.data.id,
                body: message,
                from_me: true,
                type: 'followup',
                timestamp: new Date().toISOString()
            });
        }

        logger.info({
            leadId: lead.id,
            attempt: attempt + 1,
            mode: 'template',
            messageLength: message.length
        }, '📤 Follow-up template enviado');
    }

    // ════════════════════════════════════════════
    // PRIVATE: Send Agent-Powered Follow-Up
    // ════════════════════════════════════════════
    async #sendAgentFollowUp(lead, campaign, nodeConfig, agentId, followUpGoal, customObjective, attempt, sessionName, chatId) {
        // 1. Resolve the agent
        const agent = await this.agentService.getAgent(agentId);
        if (!agent) {
            logger.error({ agentId }, '❌ Agente não encontrado para follow-up, fallback para template');
            await this.#sendTemplateFollowUp(lead, campaign, 'Oi {{name}}, tudo bem? Ainda posso te ajudar?', sessionName, chatId, attempt);
            return;
        }

        // 2. Build follow-up context to inject into prompt
        const goalPrompt = followUpGoal === 'CUSTOM'
            ? customObjective
            : (GOAL_PROMPTS[followUpGoal] || GOAL_PROMPTS.RECOVER_COLD);

        const followUpContext = `
${goalPrompt}

INFORMAÇÕES DA TENTATIVA:
- Esta é a tentativa de follow-up #${attempt + 1}
- Nome do lead: ${lead.name || 'desconhecido'}
- Último contato: ${lead.last_message_at ? new Date(lead.last_message_at).toLocaleDateString('pt-BR') : 'desconhecido'}
- Status atual: ${lead.status || 'ativo'}
- INSTRUÇÃO: Envie UMA mensagem curta e natural. NÃO faça múltiplas perguntas.`;

        // 3. Get conversation history for context
        let conversationHistory = [];
        try {
            const chatRecord = await this.supabase
                .from('chats')
                .select('id')
                .eq('lead_id', lead.id)
                .single();

            if (chatRecord.data) {
                const messages = await this.supabase
                    .from('messages')
                    .select('body, from_me, timestamp')
                    .eq('chat_id', chatRecord.data.id)
                    .order('timestamp', { ascending: false })
                    .limit(10);

                if (messages.data) {
                    conversationHistory = messages.data.reverse().map(m => ({
                        role: m.from_me ? 'assistant' : 'user',
                        content: m.body
                    }));
                }
            }
        } catch (err) {
            logger.warn({ leadId: lead.id, error: err.message }, '⚠️ Não foi possível carregar histórico para follow-up');
        }

        // 4. Build the AI prompt with follow-up context
        const { resolveDNA } = require('../../../config/AgentDNA');
        const dna = resolveDNA(agent, nodeConfig);

        const systemPrompt = `${dna.systemPrompt || ''}

=== MODO FOLLOW-UP ===
${followUpContext}`;

        // 5. Generate response via Gemini
        const { GeminiClient } = require('../../../../infra/clients/GeminiClient');
        const apiKey = agent.dna_config?.business?.apiKey || process.env.GEMINI_API_KEY;
        const model = agent.model || 'gemini-2.0-flash';

        const gemini = new GeminiClient(apiKey, model, sessionName);

        const aiMessages = [
            { role: 'user', content: `[SISTEMA: Gere uma mensagem de follow-up para o lead ${lead.name || 'desconhecido'}. Histórico recente: ${conversationHistory.slice(-3).map(m => `${m.role}: ${m.content}`).join(' | ')}]` }
        ];

        const response = await gemini.chat(aiMessages, {
            systemPrompt,
            temperature: 0.8,
            maxTokens: 300
        });

        const aiMessage = response?.text || response?.content || 'Oi! Ainda posso te ajudar?';

        // 6. Send via WAHA
        const isSimulation = campaign.mode === 'simulation';
        let sentId = `sim_followup_ai_${Date.now()}`;

        if (!isSimulation) {
            const sent = await this.wahaClient.sendText(sessionName, chatId, aiMessage);
            sentId = sent.id;
        }

        // 7. Log message
        const chatRecord2 = await this.supabase
            .from('chats')
            .select('id')
            .eq('lead_id', lead.id)
            .single();

        if (chatRecord2.data) {
            await this.supabase.from('messages').insert({
                message_id: sentId,
                chat_id: chatRecord2.data.id,
                body: aiMessage,
                from_me: true,
                type: 'followup_ai',
                timestamp: new Date().toISOString()
            });
        }

        logger.info({
            leadId: lead.id,
            attempt: attempt + 1,
            mode: 'agent',
            agentId,
            goal: followUpGoal,
            messageLength: aiMessage.length
        }, '🤖 Follow-up IA enviado');
    }

    // ════════════════════════════════════════════
    // PRIVATE: Calculate Next Send Time
    // ════════════════════════════════════════════
    #calculateNextSend(timeout, timeoutUnit, businessHoursOnly) {
        const waitUntil = new Date();
        const amount = parseInt(timeout) || 24;
        const unit = (timeoutUnit || 'h').toLowerCase();

        if (unit.startsWith('h')) {
            waitUntil.setHours(waitUntil.getHours() + amount);
        } else if (unit.startsWith('m')) {
            waitUntil.setMinutes(waitUntil.getMinutes() + amount);
        } else if (unit.startsWith('d')) {
            waitUntil.setDate(waitUntil.getDate() + amount);
        } else if (unit.startsWith('s')) {
            waitUntil.setSeconds(waitUntil.getSeconds() + amount);
        }

        // Enforce business hours: 8:00-20:00 Mon-Fri
        if (businessHoursOnly) {
            return this.#enforceBusinessHours(waitUntil);
        }

        return waitUntil;
    }

    #enforceBusinessHours(date) {
        const BUSINESS_START = 8;  // 8:00
        const BUSINESS_END = 20;   // 20:00

        let adjusted = new Date(date);

        // Skip weekends
        while (adjusted.getDay() === 0 || adjusted.getDay() === 6) {
            adjusted.setDate(adjusted.getDate() + 1);
            adjusted.setHours(BUSINESS_START, 0, 0, 0);
        }

        // Before business hours → push to 8:00
        if (adjusted.getHours() < BUSINESS_START) {
            adjusted.setHours(BUSINESS_START, 0, 0, 0);
        }

        // After business hours → push to next business day 8:00
        if (adjusted.getHours() >= BUSINESS_END) {
            adjusted.setDate(adjusted.getDate() + 1);
            adjusted.setHours(BUSINESS_START, 0, 0, 0);

            // Skip weekends again
            while (adjusted.getDay() === 0 || adjusted.getDay() === 6) {
                adjusted.setDate(adjusted.getDate() + 1);
            }
        }

        return adjusted;
    }

    // ════════════════════════════════════════════
    // PRIVATE: Variable Replacement
    // ════════════════════════════════════════════
    #replaceVariables(template, lead, attempt) {
        return template
            .replace(/\{\{name\}\}/gi, lead.name || 'amigo')
            .replace(/\{\{phone\}\}/gi, lead.phone || '')
            .replace(/\{\{email\}\}/gi, lead.email || '')
            .replace(/\{\{company\}\}/gi, lead.company || '')
            .replace(/\{\{status\}\}/gi, lead.status || '')
            .replace(/\{\{attempt\}\}/gi, String((attempt || 0) + 1));
    }

    #getChatId(phone) {
        if (!phone) return null;
        const clean = phone.replace(/\D/g, '');
        return `${clean}@s.whatsapp.net`;
    }
}

module.exports = FollowUpNode;
