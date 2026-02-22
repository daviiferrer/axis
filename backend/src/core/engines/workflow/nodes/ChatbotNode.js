/**
 * ChatbotNode - Deterministic Flow Node (Send & Wait)
 * 
 * Functions:
 * 1. Sends multiple static messages sequentially (with simulated typing delays).
 * 2. Pauses FSM execution (returns AWAITING_ASYNC).
 * 3. Upon receiving a USER_REPLY event, resumes execution,
 *    evaluates the user's latest message against routing rules,
 *    and transitions to the matching edge.
 */
const logger = require('../../../../shared/Logger').createModuleLogger('chatbot-node');
const { NodeExecutionStateEnum } = require('../../../types/CampaignEnums');
const { composingCache } = require('../../../services/system/CacheService');

class ChatbotNode {
    constructor(dependencies) {
        this.wahaClient = dependencies.wahaClient;
        this.historyService = dependencies.historyService;
        this.supabase = dependencies.supabaseClient;
    }

    async execute(lead, campaign, nodeConfig, graph, context) {
        const state = lead.node_state || {};
        const isWaitingForReply = state.status === 'WAITING_REPLY' && state.node_id === nodeConfig.id;

        logger.info({
            leadId: lead.id,
            nodeId: nodeConfig.id,
            isWaitingForReply
        }, '🤖 Executing ChatbotNode');

        // ====================================================================
        // PHASE 2: RESUMING AFTER USER REPLY
        // ====================================================================
        if (isWaitingForReply) {
            // User has replied. Fetch the latest message from history.
            let lastUserMessage = '';

            try {
                const chatRecord = await this.supabase
                    .from('chats')
                    .select('id')
                    .eq('lead_id', lead.id)
                    .single();

                if (chatRecord.data) {
                    const messages = await this.supabase
                        .from('messages')
                        .select('body, from_me')
                        .eq('chat_id', chatRecord.data.id)
                        .order('timestamp', { ascending: false })
                        .limit(5);

                    if (messages.data && messages.data.length > 0) {
                        // Find the most recent message from the user
                        const latestFromUser = messages.data.find(m => !m.from_me);
                        if (latestFromUser) {
                            lastUserMessage = latestFromUser.body;
                        }
                    }
                }
            } catch (err) {
                logger.error({ leadId: lead.id, error: err.message }, '❌ Failed to fetch history for Chatbot routing');
            }

            logger.info({ leadId: lead.id, lastUserMessage }, '💬 Re-evaluating Chatbot rules with new message');

            // Evaluate routing rules
            const rules = nodeConfig.data?.routingRules || [];
            let matchedEdge = 'fallback'; // Default exit if no rules match

            for (let i = 0; i < rules.length; i++) {
                const rule = rules[i];
                if (this._evaluateRule(lastUserMessage, rule)) {
                    matchedEdge = `output-${i}`;
                    logger.info({ leadId: lead.id, rule: rule.type, expected: rule.value }, `✅ Matched Output [${i}]`);
                    break;
                }
            }

            return {
                status: NodeExecutionStateEnum.EXITED,
                edge: matchedEdge,
                markExecuted: true,
                output: { lastUserMessage, matchedEdge } // Save some context
            };
        }

        // ====================================================================
        // PHASE 1: INITIAL ENTRY (SEND MESSAGES AND PAUSE)
        // ====================================================================

        // 1. Send all configured messages sequentially
        const messages = nodeConfig.data?.messages || [];
        const sessionName = nodeConfig.data?.sessionName || campaign.session_name || campaign.waha_session_name;
        const chatId = this._getChatId(lead.phone);

        // We only send messages if there's actually something to send and we are not in simulation
        const shouldSend = messages.length > 0 && campaign.mode !== 'simulation';

        if (shouldSend) {
            await this._sendMessagesSequentially(lead, messages, sessionName, chatId);
        } else if (campaign.mode === 'simulation') {
            logger.info({ leadId: lead.id }, '🤖 ChatbotNode: Skipping WAHA send (Simulation Mode)');
        }

        // 2. Pause Execution. The engine will mark the node as ENTERED / status as 'active' naturally,
        // but we return AWAITING_ASYNC so it knows to stop. We attach nodeState so we know we are waiting here.
        return {
            status: NodeExecutionStateEnum.AWAITING_ASYNC,
            nodeState: {
                status: 'WAITING_REPLY',
                node_id: nodeConfig.id,
                entered_at: new Date().toISOString()
            }
        };
    }

    // ==================================================================
    // PRIVATE METHODS
    // ==================================================================

    async _sendMessagesSequentially(lead, messages, sessionName, chatId) {
        if (!sessionName) {
            logger.error({ leadId: lead.id }, '❌ SessionName missing for ChatbotNode');
            return;
        }

        const wahaChatId = chatId.replace('@s.whatsapp.net', '@c.us');

        let dbChatId = null;
        try {
            const chatRecord = await this.supabase
                .from('chats')
                .select('id')
                .eq('lead_id', lead.id)
                .single();
            if (chatRecord.data) dbChatId = chatRecord.data.id;
        } catch (e) {
            logger.warn('Could not fetch DB Chat ID for logging');
        }

        for (let i = 0; i < messages.length; i++) {
            const msgItem = messages[i];
            // Support simple array of strings OR array of objects { text: "..." }
            const msgText = typeof msgItem === 'string' ? msgItem : msgItem.text;

            if (!msgText) continue;

            const isFirst = i === 0;

            // Simple Delay simulation
            const delay = this._calculateTypingDelay(msgText, isFirst);

            this.wahaClient.setPresence(sessionName, wahaChatId, 'composing').catch(() => { });
            await new Promise(resolve => setTimeout(resolve, delay));

            try {
                logger.info({ session: sessionName, wahaChatId, msg: msgText.substring(0, 20) }, '📤 Chatbot sending text');
                const sent = await this.wahaClient.sendText(sessionName, wahaChatId, msgText);

                if (dbChatId) {
                    await this.supabase.from('messages').insert({
                        message_id: sent?.id || `bot_${Date.now()}`,
                        chat_id: dbChatId,
                        body: msgText,
                        from_me: true,
                        is_ai: false,
                        author: 'Chatbot'
                    });
                }
            } catch (err) {
                logger.error({ error: err.message }, '❌ Chatbot failed to send waha payload');
            }
        }
    }

    _evaluateRule(userMessage, rule) {
        if (!userMessage || !rule) return false;

        const text = String(userMessage).trim().toLowerCase();
        const value = String(rule.value || '').trim().toLowerCase();

        switch (rule.type) {
            case 'equals':
            case 'EXACT':
                return text === value;
            case 'contains':
            case 'CONTAINS':
                return text.includes(value);
            case 'regex':
            case 'REGEX':
                try {
                    const regex = new RegExp(rule.value, 'i');
                    return regex.test(text);
                } catch (e) {
                    logger.warn({ error: e.message, pattern: rule.value }, 'Invalid regex in ChatbotNode rule');
                    return false;
                }
            case 'starts_with':
                return text.startsWith(value);
            case 'any': // Matches everything (good for generic continue)
                return true;
            default:
                return false;
        }
    }

    _calculateTypingDelay(text, isFirstMessage) {
        // Simple humanized delay: base + (chars * ms)
        let delay = isFirstMessage ? 1000 : 500;
        delay += text.length * 30; // 30ms per char
        // Cap at 4 seconds for simple bots to keep it snappy
        if (delay > 4000) delay = 4000;
        return delay;
    }

    _getChatId(phone) {
        let clean = phone.replace(/\D/g, '');
        if (clean.length >= 10 && clean.length <= 11) clean = '55' + clean;
        return clean.endsWith('@s.whatsapp.net') ? clean : `${clean}@s.whatsapp.net`;
    }
}

module.exports = ChatbotNode;
