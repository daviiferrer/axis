const logger = require('../../../shared/Logger').createModuleLogger('chat-service');

/**
 * ChatService - Core Service for Chat Management and Persistence
 */
class ChatService {
    constructor(supabaseClient, billingService, wahaClient, settingsService) {
        this.supabase = supabaseClient;
        this.billingService = billingService;
        this.wahaClient = wahaClient;
        this.settingsService = settingsService;
    }

    /**
     * Ensures a chat exists and returns it.
     */
    async ensureChat(chatId, sessionName, userId, additionalData = {}) {
        const cleanPhone = chatId.replace(/\D/g, '');

        const chatPayload = {
            chat_id: chatId,
            session_name: sessionName,
            user_id: userId,
            lead_id: additionalData.lead_id || null,
            campaign_id: additionalData.campaign_id || null,
            phone: cleanPhone,
            name: additionalData.name || cleanPhone,
            last_message_at: new Date().toISOString(),
            ...additionalData
        };

        const { data, error } = await this.supabase
            .from('chats')
            .upsert(chatPayload, { onConflict: 'chat_id' })
            .select()
            .single();

        if (error) {
            console.error('[ChatService] Chat Upsert Error:', error.message);
            throw error;
        }
        return data;
    }

    /**
     * Saves a message to the database.
     */
    async saveMessage(messageData) {
        const { error } = await this.supabase
            .from('messages')
            .upsert(messageData, { onConflict: 'id' });

        if (error) {
            console.error('[ChatService] Message Save Error:', error.message);
            throw error;
        }
    }

    /**
     * Updates chat-level metadata (e.g., profile picture).
     */
    async updateChatMetadata(chatId, sessionName, metadata) {
        const { error } = await this.supabase
            .from('chats')
            .update(metadata)
            .eq('chat_id', chatId)
            .eq('session_name', sessionName);

        if (error) {
            console.error('[ChatService] Metadata Update Error:', error.message);
            throw error;
        }
    }

    /**
     * Processes an incoming message from WAHA webhook.
     * Persists chat and message, then returns structured data for WorkflowEngine.
     */
    async processIncomingMessage(payload, sessionName) {
        let { from, to, body, fromMe, id, _data } = payload;

        // Ignore status updates or weird system messages
        if (!from || !body) return null;

        // ROBUSTNESS: Force fromMe check from deep WAHA properties
        // Sometimes payload.fromMe is undefined in certain events, leading to False Positives.
        if (fromMe === undefined && _data) {
            fromMe = _data.id?.fromMe || _data.key?.fromMe || _data.Info?.IsFromMe || false;
            logger.debug({ fromMe, _data }, 'Resolved fromMe from _data properties');
        }

        // NOTE: LID-based JIDs (e.g. 4925...@lid) can be real users or the bot.
        // We rely on fromMe flag (handled above) rather than JID suffix.


        // Fix: logic to resolve chatId robustly
        let chatId = fromMe ? to : from;

        // Outgoing message (fromMe = true) usually has 'to' as null in some WAHA versions.
        // We MUST check _data.Info.Chat which is the canonical chat JID.
        if (!chatId && _data) {
            chatId = _data.Info?.Chat || _data.to || _data.id?.remote || _data.key?.remote;
        }

        logger.debug({ from, to, fromMe, chatId }, 'Initial chatId resolution');

        // CRITICAL FIX: Guard against null/undefined chatId
        // If we still can't find it, we MUST fail gracefully but we should try hard to find it.
        if (!chatId) {
            // One last try: check if it's a Status Update? (usually status@broadcast)
            if (from === 'status@broadcast') return null;

            logger.warn({ payload }, '⚠️ Incoming message ignored: chatId could not be resolved');
            return null;
        }

        // Standardize JID to @s.whatsapp.net for internal consistency
        if (chatId.includes('@')) {
            chatId = chatId.replace('@c.us', '@s.whatsapp.net');
        }

        const cleanPhone = chatId.replace(/\D/g, '');
        const pushName = _data?.notifyName || '';

        // Validation: Ensure cleanPhone looks like a phone number (7-16 digits)
        if (cleanPhone.length < 7 || cleanPhone.length > 16) {
            // Special case: status@broadcast has no numbers.
            if (chatId.includes('@')) {
                // Allow alphanumeric JIDs if they are valid special params? 
                // No, usually we only want real chats.
            }
            logger.warn({ chatId, cleanPhone }, '⚠️ Incoming message ignored: Invalid phone number length');
            return null;
        }

        // 1. Ensure Chat Exists
        // NOTE: We might not have userId here if it's a new inbound from unknown.
        // For now, we assume public/system ownership or existing chat.
        // We'll leave user_id null or try to link via phone matching if needed.
        // For strict CRM, we might want to find if this phone belongs to a Lead.

        try {
            logger.info({ chatId, body: body.substring(0, 50), fromMe }, '📩 Message persistence starting');
            const chat = await this.ensureChat(chatId, sessionName, null, { name: pushName });

            // Standardize JID in chat object if it's new
            const finalChatId = chat.chat_id.replace('@c.us', '@s.whatsapp.net');

            const { data: message, error } = await this.supabase
                .from('messages')
                .upsert({
                    message_id: id?._serialized || id,
                    chat_id: chat.id,
                    body,
                    from_me: fromMe,
                    created_at: new Date(payload.timestamp * 1000).toISOString()
                }, { onConflict: 'message_id' })
                .select()
                .single();

            if (error) {
                logger.error({ error: error.message }, 'Failed to upsert message for incoming message');
                throw error;
            }
        } catch (e) {
            logger.warn({ error: e.message }, 'Failed to ensure chat or save message for incoming message');
        }

        return {
            chatId,
            phone: cleanPhone,
            body,
            fromMe,
            pushName
        };
    }

    /**
     * Sends a message via WAHA and saves it to DB.
     * Deducts credits before sending.
     */
    async sendMessage(session, chatId, text, userId) {
        // 1. Check Feature Flag & Deduct Credit
        const settings = await this.settingsService.getSettings(userId);
        const shouldDeduct = settings?.enable_credit_deduction !== false; // Default: true

        if (shouldDeduct) {
            await this.billingService.deductCredits(userId, 1, 'message_sent', `Msg to ${chatId}`);
        } else {
            logger.info({ userId }, 'Credit deduction skipped (Feature Flag Disabled)');
        }

        try {
            // 2. Send via WAHA
            const sentMessage = await this.wahaClient.sendText(session, chatId, text);

            // 3. Save to DB
            if (sentMessage && sentMessage.id) {
                // Resolve UUID for chat
                let { data: chat } = await this.supabase
                    .from('chats')
                    .select('id')
                    .eq('chat_id', chatId)
                    .single();

                // If chat doesn't exist, ensure it does (e.g., for outbound messages to new contacts)
                if (!chat) {
                    const standardizedJid = chatId.replace('@c.us', '@s.whatsapp.net');
                    // This part assumes 'lead', 'campaign' objects are available in scope or passed.
                    // For a robust solution, you might need to fetch/create lead/campaign based on userId or other context.
                    // For now, we'll create a minimal chat if not found.
                    const { data: newChat, error: chatError } = await this.supabase.from('chats').insert({
                        chat_id: standardizedJid,
                        user_id: userId, // Assuming userId is the owner of this outbound message
                        session_name: session,
                        phone: standardizedJid.replace(/\D/g, ''),
                        name: standardizedJid.split('@')[0], // Basic name from JID
                        last_message_at: new Date().toISOString(),
                        status: 'active' // Default status for new chat
                    }).select().single();

                    if (chatError) {
                        logger.error({ chatError: chatError.message }, 'Failed to create chat for outbound message');
                        throw chatError;
                    }
                    chat = newChat;
                }

                if (chat) {
                    await this.saveMessage({
                        message_id: sentMessage.id._serialized || sentMessage.id,
                        chat_id: chat.id, // UUID
                        body: text,
                        from_me: true,
                        is_ai: true, // Assuming sent via API is AI/System
                        created_at: new Date().toISOString()
                    });
                }
            }

            return sentMessage;
        } catch (error) {
            logger.error({ error: error.message }, 'Failed to send message after payment');
            throw error;
        }
    }
}

module.exports = ChatService;
