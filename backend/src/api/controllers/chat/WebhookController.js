const { lidCache, composingCache } = require('../../../core/services/system/CacheService');
const logger = require('../../../shared/Logger').createModuleLogger('webhook');

// Message Deduplication Cache (prevents processing same event 2x from WAHA)
const processedMessages = new Map();
const MESSAGE_DEDUP_TTL_MS = 30000; // 30 seconds

function isMessageDuplicate(messageId) {
    if (!messageId) return false;

    const now = Date.now();

    // Cleanup old entries
    for (const [id, timestamp] of processedMessages) {
        if (now - timestamp > MESSAGE_DEDUP_TTL_MS) {
            processedMessages.delete(id);
        }
    }

    if (processedMessages.has(messageId)) {
        logger.debug({ messageId }, '🔁 Duplicate message ignored (dedup cache)');
        return true;
    }

    processedMessages.set(messageId, now);
    return false;
}

class WebhookController {
    constructor({ chatService, workflowEngine, socketService, wahaClient, supabase, jidService }) {
        this.chatService = chatService;
        this.workflowEngine = workflowEngine;
        this.socketService = socketService;
        this.wahaClient = wahaClient;
        this.supabase = supabase;
        this.jidService = jidService;
    }

    async handleWahaWebhook(req, res) {
        try {
            const { event, payload, session } = req.body;
            const sessionName = session || 'default';

            logger.debug({ event, session: sessionName }, 'Webhook received');

            switch (event) {
                case 'message':
                case 'message.any':
                    // Centralized JID Normalization & LID Bypass
                    if (this.jidService && payload?.from) {
                        await this.jidService.normalizePayload(payload);
                    }
                    await this.handleMessageEvent(payload, sessionName);
                    break;
                case 'session.status':
                    this.socketService.emit('session.status', { session: sessionName, status: payload?.status });
                    break;
                case 'message.ack':
                    await this.handleMessageAck(payload, sessionName);
                    break;
                case 'presence.update':
                case 'engine.event':
                    await this.handlePresenceEvent(event, payload, sessionName);
                    break;
                default:
                    break;
            }

            res.status(200).send({ status: 'received' });
        } catch (error) {
            logger.error({ error: error.message }, 'Webhook error');
            res.status(500).send({ error: error.message });
        }
    }

    async handleMessageEvent(payload, sessionName) {
        try {
            // Deduplication: Skip if we already processed this message recently
            const messageId = payload?.id?._serialized || payload?.id;
            if (isMessageDuplicate(messageId)) {
                return; // Already processed
            }

            const result = await this.chatService.processIncomingMessage(payload, sessionName);

            if (result) {
                if (result.fromMe) {
                    logger.debug({ chatId: result.chatId }, '⏩ Skipping AI trigger for outgoing message (fromMe=true)');
                } else {
                    const chatId = result.chatId || result.from;

                    // REAL-TIME UPDATE: Emit to frontend
                    if (this.socketService && result.message) {
                        // Normalize message to match Frontend WahaMessage interface
                        const rawMsg = result.message;
                        const formattedMsg = {
                            id: rawMsg.message_id, // Use Waha ID, not DB UUID
                            from: rawMsg.from_me ? 'me' : chatId,
                            to: rawMsg.from_me ? chatId : 'me',
                            body: rawMsg.body,
                            timestamp: new Date(rawMsg.created_at).getTime() / 1000,
                            fromMe: rawMsg.from_me,
                            ack: rawMsg.status === 'read' ? 3 : (rawMsg.status === 'delivered' ? 2 : 1),
                            hasMedia: false, // TODO: Support media
                            _data: {}
                        };

                        this.socketService.emit('message.received', {
                            chatId: chatId,
                            message: formattedMsg,
                            session: sessionName
                        });
                    }

                    // Anti-Collision Check: Don't trigger AI if client is typing
                    if (composingCache.isComposing(chatId)) {
                        const cooldown = composingCache.getComposingCooldown(chatId);
                        logger.info({
                            phone: result.phone,
                            chatId,
                            cooldown_ms: cooldown
                        }, '🛑 Anti-Collision: AI paused - client is typing');

                        // Schedule delayed AI trigger after cooldown
                        setTimeout(async () => {
                            if (!composingCache.isComposing(chatId)) {
                                logger.info({ phone: result.phone }, '▶️ Anti-Collision: Resuming AI trigger');
                                // Await to ensure persistence is done? It's already awaited above. 
                                // But we can add a small safety delay or just ensure we catch.
                                await this.workflowEngine.triggerAiForLead(result.phone, result.body, result.referral, sessionName);
                            }
                        }, cooldown + 500);
                    } else {
                        // Anti-Collision: Update Timestamp
                        // We use the phone to find the leads. Note: One phone might have multiple leads (different campaigns).
                        // Updating all active leads for this phone is safer for collision avoidance.
                        const numericPhone = result.phone.replace(/\D/g, '');
                        await this.supabase
                            .from('leads')
                            .update({ last_user_message_at: new Date().toISOString() })
                            .eq('phone', numericPhone);

                        // Ensure we wait for this to finish to avoid race conditions if multiple webhooks fire?
                        // Actually, the main race is between persistence (line 53) and this trigger. 
                        // Since line 53 is awaited, we are good.
                        // But let's verify if triggerAiForLead should be awaited to handle errors properly here.
                        await this.workflowEngine.triggerAiForLead(result.phone, result.body, result.referral, sessionName);
                    }
                }
            }
        } catch (error) {
            logger.error({ error: error.message }, 'Failed to process message event');
        }
    }

    async handleMessageAck(payload, sessionName) {
        const messageId = payload?.id?._serialized || payload?.id?.id || payload?.id;
        const ack = payload?.ack;
        if (!messageId || ack === undefined) return;

        const statusMap = { 1: 'sent', 2: 'delivered', 3: 'read', 4: 'played' };
        const status = statusMap[ack] || 'sent';
        const suffix = messageId.split('_').pop();

        try {
            const { error, count } = await this.supabase
                .from('messages')
                .update({ status: status })
                .like('message_id', `%_${suffix}`);

            if (error) throw error;

            this.socketService.emit('message.ack', {
                session: sessionName,
                messageId: messageId,
                messageSuffix: suffix,
                status: status,
                ack: ack
            });
        } catch (error) {
            logger.error({ error: error.message }, 'Failed to update message ack');
        }
    }

    async handlePresenceEvent(event, payload, sessionName) {
        let rawId = payload.id || payload.data?.From || payload.data?.Chat;
        let status = payload.presence || payload.presences?.[0]?.lastKnownPresence || payload.data?.State;

        if (event === 'engine.event') {
            if (payload?.event === 'events.Presence') {
                status = payload.data?.Unavailable === false ? 'online' : 'offline';

                // Emit Presence Update
                this.socketService.emit('presence.update', {
                    session: sessionName,
                    chatId: rawId,
                    status: status,
                    lastSeen: status === 'offline' ? Date.now() / 1000 : undefined
                });

            } else if (payload?.event === 'events.ChatPresence') {
                const state = payload.data?.State;

                // Anti-Collision: Track composing state
                if (state === 'composing') {
                    composingCache.setComposing(rawId);
                    logger.info({ chatId: rawId }, '✍️ Client started typing');

                    const action = payload.data?.Media === 'audio' ? 'recording' : 'typing';

                    // Emit Acting Event
                    this.socketService.emit('chat.acting', {
                        session: sessionName,
                        chatId: rawId,
                        action: action
                    });

                } else if (state === 'paused') {
                    composingCache.clearComposing(rawId);
                    logger.info({ chatId: rawId }, '⏸️ Client stopped typing');

                    // Emit Stop Acting
                    this.socketService.emit('chat.acting', {
                        session: sessionName,
                        chatId: rawId,
                        action: 'stop'
                    });
                }
            }
        }

        if (status === 'paused') status = 'online';
        if (!rawId) return;

        // Workflow engine handling (optional, kept for existing logic)
        this.workflowEngine.handlePresenceUpdate(rawId, status, sessionName).catch(e =>
            logger.error({ error: e.message }, 'Presence update failed')
        );
    }
}

module.exports = WebhookController;
