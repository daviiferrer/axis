const logger = require('../../../shared/Logger').createModuleLogger('chat-service');

/**
 * ChatService - Core Service for Chat Management and Persistence
 */
class ChatService {
    constructor({ supabaseClient, billingService, wahaClient, settingsService, jidService, campaignService, transcriptionService }) {
        this.supabase = supabaseClient;
        this.billingService = billingService;
        this.wahaClient = wahaClient;
        this.settingsService = settingsService;
        this.jidService = jidService;
        this.campaignService = campaignService;
        this.transcriptionService = transcriptionService;
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
            // lead_id: removed to avoid overwriting with null on upsert if exists
            campaign_id: additionalData.campaign_id || null, // Will try to resolve below if null
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

        // AUTO-LINK CAMPAIGN: If campaign_id is not provided, try to find it via session name
        if (!chatPayload.campaign_id && this.campaignService) {
            try {
                const linkedCampaign = await this.campaignService.getCampaignBySession(sessionName);
                if (linkedCampaign) {
                    chatPayload.campaign_id = linkedCampaign.id;
                    // Also use the campaign owner as user_id if not present (inbound case)
                    if (!chatPayload.user_id) {
                        chatPayload.user_id = linkedCampaign.user_id;
                    }
                    logger.info({ chatId, campaignId: linkedCampaign.id, sessionName }, '🔗 Auto-linked chat to campaign via session');
                }
            } catch (campError) {
                logger.warn({ sessionName, error: campError.message }, 'Failed to auto-link campaign');
            }
        }

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
            logger.error({ err: error.message }, 'Chat Upsert Error');
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
            logger.error({ err: error.message }, 'Message Save Error');
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
            logger.error({ err: error.message }, 'Tags Update Error');
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
            logger.error({ err: error.message }, 'Metadata Update Error');
            throw error;
        }
    }

    /**
     * Processes an incoming message from WAHA webhook.
     * Persists chat and message, then returns structured data for WorkflowEngine.
     * Supports text, voice/audio messages with automatic transcription.
     */
    async processIncomingMessage(payload, sessionName) {
        // Ignore status updates or system messages without content
        if (!payload.from) return null;

        // Voice/Audio Message Support
        const isVoiceMessage = payload.hasMedia && (payload.media?.mimetype?.includes('audio') || payload._data?.type === 'audio' || payload._data?.type === 'ptt');

        // Image/Photo Message Support
        const isImageMessage = payload.hasMedia && (payload.media?.mimetype?.includes('image') || payload._data?.type === 'image');

        // Document Message Support
        const isDocumentMessage = payload.hasMedia && !isVoiceMessage && !isImageMessage && (
            payload.media?.mimetype?.includes('application') ||
            payload.media?.mimetype?.includes('pdf') ||
            payload._data?.type === 'document'
        );

        // Resolve media URL and type for DB storage
        let mediaUrl = null;
        let mediaType = null;

        if (payload.hasMedia) {
            const mediaData = payload.media || payload._data?.media;
            mediaUrl = mediaData?.url || null;
            if (isVoiceMessage) mediaType = 'audio';
            else if (isImageMessage) mediaType = 'image';
            else if (isDocumentMessage) mediaType = 'document';
            else if (payload.media?.mimetype?.includes('video')) mediaType = 'video';
            else if (payload.media?.mimetype?.includes('webp') || payload._data?.type === 'sticker') mediaType = 'sticker';
            else mediaType = 'file';
        }

        // If it's a voice message, use inline media and transcribe it
        let body = payload.body;
        if (isVoiceMessage && !body) {
            try {
                logger.info({ from: payload.from }, '🎤 Voice message detected, transcribing...');

                // WAHA can send media in 2 ways:
                // 1. Inline base64: payload.media.data
                // 2. URL: payload.media.url
                const mediaData = payload.media || payload._data?.media;

                if (mediaData && mediaData.mimetype) {
                    let audioBase64 = mediaData.data;

                    // If no base64 but has URL, download it
                    if (!audioBase64 && mediaData.url) {
                        // FIX: WAHA might return internal container URL (0.0.0.0 or localhost)
                        // We need to rewrite it to the service name 'waha' for docker-compose networking
                        let downloadUrl = mediaData.url;
                        if (downloadUrl.includes('0.0.0.0') || downloadUrl.includes('localhost')) {
                            downloadUrl = downloadUrl.replace('0.0.0.0', 'waha').replace('localhost', 'waha');
                            logger.info({ original: mediaData.url, rewritten: downloadUrl }, '🔄 Rewrote media URL for Docker networking');
                        }

                        logger.info({ url: downloadUrl }, '📥 Downloading audio from URL...');
                        try {
                            const axios = require('axios');
                            const headers = {};
                            if (process.env.WAHA_API_KEY) {
                                headers['X-Api-Key'] = process.env.WAHA_API_KEY;
                            }

                            const response = await axios.get(downloadUrl, {
                                responseType: 'arraybuffer',
                                headers,
                                timeout: 10000
                            });
                            audioBase64 = Buffer.from(response.data).toString('base64');
                            logger.info('✅ Audio downloaded successfully');
                        } catch (downloadError) {
                            logger.error({ error: downloadError.message, url: downloadUrl }, '❌ Failed to download audio from URL');
                        }
                    }

                    if (audioBase64) {
                        // Resolve User ID from Session to fetch API Key
                        let userId = null;
                        try {
                            const { data: sessionData } = await this.supabase
                                .from('sessions')
                                .select('user_id')
                                .eq('session_name', sessionName)
                                .single();
                            userId = sessionData?.user_id;
                        } catch (sessionErr) {
                            logger.warn({ sessionName, err: sessionErr.message }, 'Failed to resolve userId for transcription');
                        }

                        // Transcribe using Gemini
                        const transcription = await this.transcriptionService.transcribe({
                            mimetype: mediaData.mimetype,
                            data: audioBase64
                        }, userId);

                        if (transcription) {
                            body = transcription;
                            logger.info({ transcription: transcription.substring(0, 100) }, '✅ Audio transcribed successfully');
                        } else {
                            body = '[AUDIO_MESSAGE]';
                            logger.warn('Failed to transcribe audio, using placeholder');
                        }
                    } else {
                        body = '[AUDIO_MESSAGE]';
                        logger.warn({ hasMedia: payload.hasMedia, mediaKeys: Object.keys(payload.media || {}) }, '⚠️ Voice message detected but no media data or URL available');
                    }
                } else {
                    body = '[AUDIO_MESSAGE]';
                    logger.warn({ hasMedia: payload.hasMedia }, '⚠️ Voice message detected but no media object in payload');
                }
            } catch (audioError) {
                logger.error({ error: audioError.message, stack: audioError.stack }, '❌ Voice message processing failed');
                body = '[AUDIO_MESSAGE]';
            }
        }

        // Image message: extract base64 for AI vision + use caption as body
        let imageData = null;
        if (isImageMessage) {
            const caption = payload.body || payload._data?.caption || '';
            if (!body) {
                body = caption || '[📷 Imagem enviada pelo cliente]';
            }

            // Extract image base64 for AI Vision analysis
            try {
                const mediaData = payload.media || payload._data?.media;
                if (mediaData && mediaData.mimetype) {
                    let imgBase64 = mediaData.data;

                    // If no inline base64 but has URL, download it (same as voice logic)
                    if (!imgBase64 && mediaData.url) {
                        logger.info({ url: mediaData.url }, '📥 Downloading image from URL for AI Vision...');
                        try {
                            const axios = require('axios');
                            const response = await axios.get(mediaData.url, {
                                responseType: 'arraybuffer',
                                timeout: 15000,
                                maxContentLength: 5 * 1024 * 1024 // 5MB limit
                            });
                            imgBase64 = Buffer.from(response.data).toString('base64');
                            logger.info('✅ Image downloaded for AI Vision');
                        } catch (downloadError) {
                            logger.warn({ error: downloadError.message }, '⚠️ Failed to download image for AI Vision');
                        }
                    }

                    if (imgBase64) {
                        imageData = {
                            data: imgBase64,
                            mimeType: mediaData.mimetype
                        };
                        logger.info({ from: payload.from, mimeType: mediaData.mimetype, sizeKB: Math.round(imgBase64.length * 0.75 / 1024) }, '🖼️ Image captured for AI Vision analysis');
                    }
                }
            } catch (imgError) {
                logger.warn({ error: imgError.message }, '⚠️ Image extraction failed, continuing without vision');
            }

            logger.info({ from: payload.from, hasCaption: !!caption, hasImageData: !!imageData }, '🖼️ Image message detected');
        }

        // Document message: use filename/caption or placeholder
        if (isDocumentMessage && !body) {
            const filename = payload.media?.filename || payload._data?.filename || 'documento';
            const caption = payload.body || payload._data?.caption || '';
            body = caption || `[📄 Documento: ${filename}]`;
            logger.info({ from: payload.from, filename }, '📄 Document message detected');
        }

        // If still no body, ignore the message
        if (!body) return null;

        // PRE-PROCESSING: Normalize JID (LID -> Phone JID)
        // If message is from a Linked Device (LID), we try to resolve the real phone number JID.
        // This prevents duplicate chats (one for LID, one for Phone).
        const normalizedFrom = await this.jidService.normalizePayload(payload);
        if (normalizedFrom) {
            logger.info({ original: payload.from, normalized: normalizedFrom }, '🔄 JID Normalized');
            payload.from = normalizedFrom;
            if (payload.key) payload.key.remoteJid = normalizedFrom; // Update key if present
        }

        const { from, to, fromMe, hasMedia, media, _data, id } = payload;
        // body is already declared above (line 157) for audio processing

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

        // CRITICAL FIX: If chatId is a LID (Linked Device), we MUST resolve it to the canonical phone JID.
        // LIDs typically look like "123456789:8@lid".
        // The real chat JID is usually hidden in _data.Info.Chat (even for inbound).
        const isLid = chatId && chatId.endsWith('@lid');

        // Outgoing message (fromMe = true) usually has 'to' as null in some WAHA versions.
        // We MUST check _data.Info.Chat which is the canonical chat JID.
        if ((!chatId || isLid) && _data) {
            // Use centralized service to extract real number
            const realNumber = this.jidService.extractRealNumber(payload);
            if (realNumber) {
                const canonical = `${realNumber}@s.whatsapp.net`;
                logger.info({ original: chatId, canonical }, '🔄 Resolved LID to Canonical JID via JidService');
                chatId = canonical;
            }
        }

        logger.debug({ from, to, fromMe, chatId }, 'Initial chatId resolution');

        // CRITICAL FIX: Guard against null/undefined chatId
        // If we still can't find it, we MUST fail gracefully but we should try hard to find it.
        if (!chatId) {
            // One last try: check if it's a Status Update? (usually status@broadcast)
            if (from === 'status@broadcast') return null;

            // If it's fromMe (outbound echo), downgrade to DEBUG/INFO to avoid scary logs
            if (fromMe) {
                logger.debug({ payload }, 'ℹ️ Outbound message echo ignored (chatId could not be resolved, likely pending status)');
                return null;
            }

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
                    is_voice_message: isVoiceMessage, // Track for metrics
                    type: mediaType,        // image, audio, document, video, sticker, null
                    media_url: mediaUrl,    // URL from WAHA for media retrieval
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
            isVoiceMessage,
            isImageMessage,
            isDocumentMessage,
            mediaType,
            mediaUrl,
            imageData, // Base64 image data for AI Vision (null if no image)
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
