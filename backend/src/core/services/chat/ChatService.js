const logger = require('../../../shared/Logger').createModuleLogger('chat-service');

/**
 * ChatService - Core Service for Chat Management and Persistence
 */
class ChatService {
    constructor({ supabaseClient, billingService, wahaClient, settingsService, jidService }) {
        this.supabase = supabaseClient;
        this.billingService = billingService;
        this.wahaClient = wahaClient;
        this.settingsService = settingsService;
        this.jidService = jidService;
    }

    /**
     * Ensures a chat exists and returns it.
     */
    async ensureChat(chatId, sessionName, userId, additionalData = {}) {
        const cleanPhone = chatId.replace(/\D/g, '');

        let chatPayload = {
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

        // PROFILE PICTURE LOGIC
        // We check if it's feasible to fetch.
        // Optimization: We could do this only if not exists, but for "upsert" we need to know.
        // Let's do a quick check: if additionalData has it, good. If not, and it's a real user (not status), fetch it.
        // To avoid blocking, we could use a separate promise or just await it if fast.
        // User requested: "save to db"
        if (!chatPayload.profile_pic_url && !chatId.includes('@broadcast') && !chatId.includes('@g.us')) {
            try {
                logger.info({ chatId }, '🖼️ Attempting to fetch profile picture...');
                const picData = await this.wahaClient.getProfilePicture(sessionName, chatId);
                logger.info({ chatId, picData }, '🖼️ Profile picture response');

                let picUrl = null;
                if (typeof picData === 'string') {
                    picUrl = picData;
                } else if (picData && picData.url) {
                    picUrl = picData.url;
                } else if (picData && picData.profilePicture) {
                    picUrl = picData.profilePicture; // Handle potential variations
                }

                if (picUrl) {
                    chatPayload.profile_pic_url = picUrl;
                    logger.info({ chatId, url: picUrl }, '✅ Profile picture URL found and set');
                } else {
                    logger.warn({ chatId, picData }, '⚠️ No URL found in profile picture response');
                }
            } catch (picError) {
                logger.warn({ chatId, error: picError.message }, 'Failed to fetch profile picture (non-blocking)');
            }
        }

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
     * Updates chat tags.
     */
    async updateTags(chatId, sessionName, tags) {
        const { error } = await this.supabase
            .from('chats')
            .update({ tags })
            .eq('chat_id', chatId)
            .eq('session_name', sessionName);

        if (error) {
            console.error('[ChatService] Tags Update Error:', error.message);
            throw error;
        }
        return tags;
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
        // Ignore status updates or weird system messages
        if (!payload.from || !payload.body) return null;

        // PRE-PROCESSING: Normalize JID (LID -> Phone JID)
        // If message is from a Linked Device (LID), we try to resolve the real phone number JID.
        // This prevents duplicate chats (one for LID, one for Phone).
        const normalizedFrom = await this.jidService.normalizePayload(payload);
        if (normalizedFrom) {
            logger.info({ original: payload.from, normalized: normalizedFrom }, '🔄 JID Normalized');
            payload.from = normalizedFrom;
            if (payload.key) payload.key.remoteJid = normalizedFrom; // Update key if present
        }

        let { from, to, body, fromMe, hasMedia, media, _data, id } = payload;

        // Groups are still ignored as per request
        if (from.endsWith('@g.us') || to?.endsWith('@g.us') || payload.participant) {
            logger.info({ from, to }, '🚫 Group message ignored');
            return null;
        }

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

        let message = null; // Lifted scope

        try {
            logger.info({ chatId, body: body.substring(0, 50), fromMe }, '📩 Message persistence starting');
            const chat = await this.ensureChat(chatId, sessionName, null, { name: pushName });

            // Standardize JID in chat object if it's new
            const finalChatId = chat.chat_id.replace('@c.us', '@s.whatsapp.net');

            const { data: savedMessage, error } = await this.supabase
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

            message = savedMessage; // Assign to outer var

            if (error) {
                logger.error({ error: error.message }, 'Failed to upsert message for incoming message');
                throw error;
            }
        } catch (e) {
            logger.warn({ error: e.message }, 'Failed to ensure chat or save message for incoming message');
            // If message save failed, we can't return it.
            // But we should continue if possible?
            // If we throw here, the webhook 500s.
            // If we return null, no socket event.
        }

        // Extraction: Ad Referral Data (Meta Ads)
        const referral = payload.referral || _data?.referral || null;

        if (referral) {
            logger.info({ referral }, '🎯 Ad Context Detected');
        }

        // Return the message if we have it, or construct a temporary one for socket if DB failed?
        // Better to return what we have.
        // If 'message' is from DB, it needs to be defined in outer scope.

        return {
            chatId,
            phone: cleanPhone,
            body,
            fromMe,
            pushName,
            referral,
            message: message // This will be undefined if we don't lift it!
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
            let sentMessage;
            if (session === 'SIMULATOR') {
                const messageId = `true_${chatId}_${Date.now()}_SIM`;
                sentMessage = {
                    id: {
                        _serialized: messageId,
                        id: messageId,
                        fromMe: true,
                        remote: chatId
                    },
                    timestamp: Math.floor(Date.now() / 1000),
                    body: text
                };
                // Simulate latency
                await new Promise(r => setTimeout(r, 500));
            } else {
                sentMessage = await this.wahaClient.sendText(session, chatId, text);
            }

            // 3. Save to DB
            if (sentMessage && sentMessage.id) {
                try {
                    // Use ensureChat to guarantee chat existence and profile picture fetching
                    // This unifies logic for inbound and outbound.
                    // For outbound, we might not have a full name, but we have the phone/chatId.
                    const chat = await this.ensureChat(chatId, session, userId, {
                        name: chatId.split('@')[0] // Fallback name
                    });

                    await this.saveMessage({
                        message_id: sentMessage.id._serialized || sentMessage.id,
                        chat_id: chat.id, // UUID
                        body: text,
                        from_me: true,
                        is_ai: true, // Assuming sent via API is AI/System
                        created_at: new Date().toISOString()
                    });
                } catch (saveError) {
                    logger.error({ error: saveError.message }, 'Failed to save sent message to DB');
                    // We don't throw here to avoid failing the whole request if message sent successfully
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
