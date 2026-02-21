const logger = require('../../../shared/Logger').createModuleLogger('waha-chatting');

class WahaChattingController {
    constructor({ wahaClient, supabase }) {
        logger.info({ hasWaha: !!wahaClient, hasSupabase: !!supabase }, 'Initializing');
        this.waha = wahaClient;
        this.supabase = supabase;
    }

    // Main entry point for text messages - uses human latency
    async getChats(req, res) {
        try {
            const { session } = req.query;

            const userId = req.user?.id;
            if (!userId) return res.status(401).json({ error: 'Unauthorized' });

            // Helper to map DB status to Frontend Status
            const mapStatus = (chat) => {
                const leadStatus = chat.leads?.status?.toLowerCase() || 'new';
                if (['prospecting', 'new', 'contacted', 'pending'].includes(leadStatus)) return 'PROSPECTING';
                if (['negotiating', 'qualified'].includes(leadStatus)) return 'QUALIFIED';
                if (['lost', 'won', 'finished', 'completed', 'handoff_requested'].includes(leadStatus)) return 'FINISHED';
                return 'PROSPECTING';
            };

            // Fetch allowlist of sessions owned by user
            const { data: userSessions } = await this.supabase
                .from('sessions')
                .select('session_name')
                .eq('user_id', userId);

            const allowedSessions = new Set(userSessions?.map(s => s.session_name) || []);
            if (allowedSessions.size === 0) {
                return res.json([]);
            }

            // --- MAIN QUERY: chats + joins (campaigns for name, messages for last body, leads for status) ---
            let query = this.supabase
                .from('chats')
                .select('*, messages(body, created_at), leads(status), campaigns(name)')
                .not('chat_id', 'like', '147%')
                .order('last_message_at', { ascending: false, nullsFirst: false });

            if (session && session.trim() !== '') {
                query = query.eq('session_name', session);
            }

            const { data, error } = await query;
            if (error) {
                logger.error({ err: error }, 'Chat query with joins failed');
                throw error;
            }

            // Security filter in memory
            const safeData = (data || []).filter(c => allowedSessions.has(c.session_name));

            if (safeData.length === 0) {
                return res.json([]);
            }

            // --- ENRICHMENT: Unread counts + AI tokens via batch queries ---
            const chatIds = safeData.map(c => c.id);

            // 1. Unread counts: messages where created_at > last_read_at AND from_me = false
            let unreadMap = {};
            try {
                const { data: unreadRows } = await this.supabase.rpc('get_unread_counts', {
                    p_chat_ids: chatIds
                });
                if (unreadRows) {
                    unreadRows.forEach(r => { unreadMap[r.chat_id] = r.unread_count; });
                }
            } catch (unreadError) {
                logger.warn({ err: unreadError.message }, 'Unread count RPC failed, falling back to 0');
                // Fallback: count in-memory using last_read_at from chat data
                for (const chat of safeData) {
                    const lastRead = chat.last_read_at ? new Date(chat.last_read_at) : new Date(0);
                    const unread = (chat.messages || []).filter(m =>
                        !m.from_me && new Date(m.created_at) > lastRead
                    ).length;
                    unreadMap[chat.id] = unread;
                }
            }

            // 2. AI token totals per chat from ai_usage_logs
            let tokenMap = {};
            try {
                const { data: tokenRows } = await this.supabase
                    .from('ai_usage_logs')
                    .select('chat_id, tokens_input, tokens_output')
                    .in('chat_id', chatIds);

                if (tokenRows) {
                    tokenRows.forEach(r => {
                        if (!tokenMap[r.chat_id]) tokenMap[r.chat_id] = 0;
                        tokenMap[r.chat_id] += (r.tokens_input || 0) + (r.tokens_output || 0);
                    });
                }
            } catch (tokenError) {
                logger.warn({ err: tokenError.message }, 'AI token query failed, falling back to 0');
            }

            // --- FORMAT ---
            const formattedChats = safeData.map(chat => {
                const mappedStatus = mapStatus(chat);
                return {
                    id: chat.chat_id,
                    name: chat.name || chat.phone,
                    image: chat.profile_pic_url,
                    unreadCount: unreadMap[chat.id] || 0,
                    sessionName: chat.session_name || null,
                    campaignName: chat.campaigns?.name || null,
                    aiTokens: tokenMap[chat.id] || 0,
                    lastMessage: {
                        body: chat.messages?.[0]?.body || '',
                        timestamp: chat.last_message_at ? new Date(chat.last_message_at).getTime() / 1000 : Date.now() / 1000
                    },
                    status: mappedStatus,
                    tags: chat.tags || []
                };
            });

            logger.debug({ count: formattedChats.length }, 'Returning enriched chats');
            res.json(formattedChats);

        } catch (error) {
            logger.error({ err: error }, 'getChats critical error');
            if (error.code === '42P01') {
                return res.json([]);
            }
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * Marks a chat as read by updating last_read_at to now.
     * POST /chatting/chats/:session/:chatId/read
     */
    async markAsRead(req, res) {
        try {
            const { session, chatId } = req.params;
            const userId = req.user?.id;
            if (!userId) return res.status(401).json({ error: 'Unauthorized' });

            // Verify user owns this session
            const { data: sessionData } = await this.supabase
                .from('sessions')
                .select('session_name')
                .eq('session_name', session)
                .eq('user_id', userId)
                .single();

            if (!sessionData) {
                return res.status(403).json({ error: 'Session not owned by user' });
            }

            const { data, error } = await this.supabase
                .from('chats')
                .update({ last_read_at: new Date().toISOString() })
                .eq('chat_id', chatId)
                .eq('session_name', session)
                .select('id, last_read_at')
                .single();

            if (error) {
                logger.error({ err: error, chatId, session }, 'markAsRead failed');
                return res.status(500).json({ error: error.message });
            }

            logger.info({ chatId, session, lastReadAt: data?.last_read_at }, '✅ Chat marked as read');
            res.json({ success: true, lastReadAt: data?.last_read_at });
        } catch (error) {
            logger.error({ err: error }, 'markAsRead critical error');
            res.status(500).json({ error: error.message });
        }
    }

    async deleteChat(req, res) {
        try {
            const { session, chatId } = req.params;

            // 1. Fetch Chat Internal ID and Lead ID to enable Cascade
            const { data: chat, error: fetchError } = await this.supabase
                .from('chats')
                .select('id, lead_id')
                .eq('chat_id', chatId)
                .eq('session_name', session)
                .maybeSingle();

            if (fetchError) {
                throw fetchError;
            }

            if (!chat) {
                return res.json({ success: true, message: 'Chat already deleted' });
            }

            logger.info({ chatId, internalId: chat.id }, 'Deleting chat');

            // 2. Cascade Delete: Messages associated with this chat
            const { error: msgError } = await this.supabase
                .from('messages')
                .delete()
                .eq('chat_id', chat.id);

            if (msgError) {
                logger.error({ err: msgError }, 'Error deleting messages');
            } else {
                logger.info('Messages deleted');
            }

            // 3. Reset Emotional State on the lead (JSONB column)
            if (chat.lead_id) {
                const { error: emoError } = await this.supabase
                    .from('leads')
                    .update({ emotional_state: { pleasure: 0.5, arousal: 0.5, dominance: 0.5 } })
                    .eq('id', chat.lead_id);

                if (emoError) {
                    logger.error({ err: emoError }, 'Error resetting emotional state');
                } else {
                    logger.info('Emotional state reset');
                }
            }

            // 4. Delete the Chat Record itself
            const { error } = await this.supabase
                .from('chats')
                .delete()
                .eq('id', chat.id);

            if (error) throw error;

            // Optional: Try to clear from Waha if supported
            // try { await this.waha.deleteChat(session, chatId); } catch (e) {}

            res.json({ success: true, chatId });
        } catch (error) {
            logger.error({ err: error }, 'deleteChat error');
            res.status(500).json({ error: error.message });
        }
    }

    async getProfilePicture(req, res) {
        try {
            const { session, chatId } = req.params;
            const result = await this.waha.getProfilePicture(session, chatId);

            // WAHA might return null (404) or { url: ... } or just string
            if (!result) {
                return res.status(404).json({ error: 'Profile picture not found' });
            }
            res.json(result);
        } catch (error) {
            logger.error({ err: error }, 'getProfilePicture error');
            // If it's a 404 from axios, pass it through
            if (error.response?.status === 404) {
                return res.status(404).json({ error: 'Profile picture not found' });
            }
            res.status(500).json({ error: error.message });
        }
    }

    async getMessages(req, res) {
        try {
            const { session, chatId, limit } = req.query;
            const limitNum = parseInt(limit) || 50;

            // Resolve internal ID from chat_id (JID)
            const { data: chat } = await this.supabase
                .from('chats')
                .select('id')
                .eq('chat_id', chatId)
                .single();

            if (!chat) return res.json([]);

            const { data: messages, error } = await this.supabase
                .from('messages')
                .select('*')
                .eq('chat_id', chat.id)
                .order('created_at', { ascending: false })
                .limit(limitNum);

            if (error) throw error;

            // Format to match WahaMessage interface
            const formattedMessages = messages.reverse().map(msg => {
                let ack = 1; // Default: sent
                if (msg.status === 'delivered') ack = 2;
                if (msg.status === 'read') ack = 3;
                if (msg.status === 'played') ack = 4;

                return {
                    id: msg.message_id,
                    from: msg.from_me ? 'me' : chatId,
                    to: msg.from_me ? chatId : 'me',
                    body: msg.body,
                    timestamp: new Date(msg.created_at).getTime() / 1000,
                    fromMe: msg.from_me,
                    hasMedia: msg.type !== null && msg.type !== undefined,
                    mediaUrl: msg.media_url || null,
                    mediaType: msg.type || null,
                    _data: {},
                    author: msg.author,
                    isAi: msg.is_ai,
                    ack: ack
                };
            });

            res.json(formattedMessages);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async sendText(req, res) {
        try {
            const { session, chatId, text } = req.body;
            const userId = req.user?.id; // Get authenticated user

            // Enforce human latency for natural behavior as requested
            const result = await this.waha.sendTextWithLatency(session, chatId, text);

            // Save to DB immediately to ensure correct attribution (Human vs AI)
            if (result && result.id) {
                try {
                    // Ensure chat exists (linking to user if possible)
                    const chat = await this.chatService.ensureChat(chatId, session, userId, {
                        name: chatId.split('@')[0]
                    });

                    // Save message with is_ai = false (since it's Manual/API send)
                    await this.chatService.saveMessage({
                        message_id: result.id._serialized || result.id,
                        chat_id: chat.id,
                        body: text,
                        from_me: true,
                        is_ai: false, // Explicitly mark as Human/Manual
                        created_at: new Date().toISOString(),
                        status: 'sent'
                    });
                } catch (saveError) {
                    logger.error({ err: saveError }, 'Failed to save manual message');
                    // Non-blocking
                }
            }

            res.json(result);
        } catch (error) {
            logger.error({ err: error }, 'sendText error');
            res.status(500).json({ error: error.message });
        }
    }

    async sendImage(req, res) {
        try {
            const { session, chatId, file, caption } = req.body;
            const result = await this.waha.sendImage(session, chatId, file, caption);
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async sendFile(req, res) {
        try {
            const { session, chatId, file, caption } = req.body;
            const result = await this.waha.sendFile(session, chatId, file, caption);
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async sendVoice(req, res) {
        try {
            const { session, chatId, file } = req.body;

            // Auto-convert to Opus for mobile compatibility
            let fileToSend = file;
            try {
                // Normalize payload for convertVoice (expects { url, data })
                const conversionPayload = {};
                if (file && typeof file === 'object') {
                    if (file.url) conversionPayload.url = file.url;
                    if (file.data) conversionPayload.data = file.data;
                } else if (typeof file === 'string' && file.startsWith('http')) {
                    conversionPayload.url = file;
                } // If string but not http, assume it's weird, skip.

                if (conversionPayload.url || conversionPayload.data) {
                    logger.debug('🔄 API: Auto-converting voice to Opus...');
                    const convertedBase64 = await this.waha.convertVoice(session, conversionPayload);
                    if (convertedBase64) {
                        fileToSend = {
                            mimetype: 'audio/ogg; codecs=opus',
                            data: convertedBase64,
                            filename: 'voice.ogg'
                        };
                        logger.info('✅ API: Voice converted to Opus');
                    }
                }
            } catch (convErr) {
                logger.warn({ err: convErr.message }, '⚠️ API: Voice conversion failed, sending original');
            }

            const result = await this.waha.sendVoice(session, chatId, fileToSend);
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async sendVideo(req, res) {
        try {
            const { session, chatId, file, caption } = req.body;
            const result = await this.waha.sendVideo(session, chatId, file, caption);
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async sendLinkPreview(req, res) {
        try {
            const { session, chatId, url, title } = req.body;
            const result = await this.waha.sendLinkPreview(session, chatId, url, title);
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async sendButtons(req, res) {
        try {
            const { session, chatId, title, buttons, footer } = req.body;
            const result = await this.waha.sendButtons(session, chatId, title, buttons, footer);
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async sendList(req, res) {
        try {
            const { session, chatId, title, rows, buttonText } = req.body;
            const result = await this.waha.sendList(session, chatId, title, rows, buttonText);
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async forwardMessage(req, res) {
        try {
            const { session, chatId, messageId } = req.body;
            const result = await this.waha.forwardMessage(session, chatId, messageId);
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async markSeen(req, res) {
        try {
            const { session, chatId } = req.body;
            const result = await this.waha.markSeen(session, chatId);
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async startTyping(req, res) {
        try {
            const { session, chatId } = req.body;
            const result = await this.waha.setPresence(session, chatId, 'composing');
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async stopTyping(req, res) {
        try {
            const { session, chatId } = req.body;
            const result = await this.waha.setPresence(session, chatId, 'paused');
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async sendReaction(req, res) {
        try {
            const { session, chatId, messageId, reaction } = req.body;
            const result = await this.waha.sendReaction(session, chatId, messageId, reaction);
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async sendPoll(req, res) {
        try {
            const { session, chatId, poll } = req.body;
            const result = await this.waha.sendPoll(session, chatId, poll);
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async sendPollVote(req, res) {
        try {
            const { session, chatId, messageId, selectedOptions } = req.body;
            const result = await this.waha.sendPollVote(session, chatId, messageId, selectedOptions);
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async sendLocation(req, res) {
        try {
            const { session, chatId, latitude, longitude, title } = req.body;
            const result = await this.waha.sendLocation(session, chatId, latitude, longitude, title);
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async sendContactVcard(req, res) {
        try {
            const { session, chatId, contacts } = req.body;
            const result = await this.waha.sendContactVcard(session, chatId, contacts);
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async replyButton(req, res) {
        try {
            const { session, chatId, selectedId } = req.body;
            const result = await this.waha.replyButton(session, chatId, selectedId);
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async starMessage(req, res) {
        try {
            const { session, chatId, messageId, star } = req.body;
            const result = await this.waha.starMessage(session, chatId, messageId, star);
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async getLeadSentiment(req, res) {
        try {
            const { session, chatId } = req.params;
            logger.debug({ session, chatId }, 'getLeadSentiment called');

            // 1. Resolve internal Chat UUID -> Lead UUID
            // Fix: Explicitly search for a chat record that HAS a lead assigned.
            // Sometimes duplicate chat records exist (one with lead, one without), causing flickering.
            const { data: chat, error: chatError } = await this.supabase
                .from('chats')
                .select('lead_id')
                .eq('chat_id', chatId)
                .not('lead_id', 'is', null) // Force finding the connected record
                .limit(1)
                .maybeSingle();

            if (chatError || !chat || !chat.lead_id) {
                logger.debug({ chatError, chat }, 'Chat not found or no lead_id linked');
                // If no lead associated or chat not found, return neutral default
                return res.json({ sentimentIndex: 2, pleasure: 0.5, status: 'no_lead_linked' });
            }

            const leadId = chat.lead_id;
            logger.debug({ leadId }, 'Found Lead ID');

            // 2. Fetch Emotional State from lead JSONB column
            const { data: lead, error: emoError } = await this.supabase
                .from('leads')
                .select('emotional_state')
                .eq('id', leadId)
                .maybeSingle();

            if (emoError) {
                logger.warn({ err: emoError }, 'Error fetching emotional state');
                return res.json({ sentimentIndex: 2, pleasure: 0.5, error: emoError.message });
            }

            if (!lead?.emotional_state) {
                logger.debug({ leadId }, 'No emotional state found for lead');
                return res.json({ sentimentIndex: 2, pleasure: 0.5, status: 'no_data', leadId });
            }

            const emotionalState = lead.emotional_state;
            logger.debug({ emotionalState }, 'Found emotional state');

            // 3. Map Pleasure (0-1) to 0-4 Scale
            const p = emotionalState.pleasure !== undefined ? emotionalState.pleasure : 0.5;
            let index = 2;

            if (p <= 0.2) index = 0;       // 0.0 - 0.2
            else if (p <= 0.4) index = 1;  // 0.2 - 0.4
            else if (p <= 0.6) index = 2;  // 0.4 - 0.6
            else if (p <= 0.8) index = 3;  // 0.6 - 0.8
            else index = 4;                // 0.8 - 1.0

            logger.debug({ pleasure: p, index }, 'Calculated sentiment');

            res.json({
                sentimentIndex: index,
                pleasure: p,
                arousal: emotionalState.arousal,
                dominance: emotionalState.dominance,
                leadId: leadId
            });

        } catch (error) {
            logger.error({ err: error }, 'getLeadSentiment error');
            res.status(500).json({ error: error.message });
        }
    }

    async subscribePresence(req, res) {
        try {
            const { session, chatId } = req.body;
            logger.info({ chatId, session }, 'Subscribing to presence');
            const result = await this.waha.subscribePresence(session, chatId);
            res.json(result);
        } catch (error) {
            const errorDetails = error.response?.data || error.message;
            logger.error({ err: error.message, details: error.response?.data }, 'Failed to subscribe presence');
            res.status(500).json({ error: error.message, details: errorDetails });
        }
    }
}

module.exports = WahaChattingController;
