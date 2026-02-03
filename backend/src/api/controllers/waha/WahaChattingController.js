class WahaChattingController {
    constructor({ wahaClient, supabase }) {
        console.log('🔧 [WahaChattingController] Initializing...', {
            hasWaha: !!wahaClient,
            hasSupabase: !!supabase
        });
        this.waha = wahaClient;
        this.supabase = supabase;
    }

    // Main entry point for text messages - uses human latency
    async getChats(req, res) {
        try {
            const { session } = req.query;

            // Build query - fetch ALL chats across all sessions if no session specified
            // Helper to map DB status to Frontend Status
            const mapStatus = (chat) => {
                const leadStatus = chat.leads?.status?.toLowerCase() || 'new';

                if (['prospecting', 'new', 'contacted', 'pending'].includes(leadStatus)) return 'PROSPECTING';
                if (['negotiating', 'qualified'].includes(leadStatus)) return 'QUALIFIED';
                if (['lost', 'won', 'finished', 'completed', 'handoff_requested'].includes(leadStatus)) return 'FINISHED';

                return 'PROSPECTING'; // Default fallback
            };

            const formatChats = (chatList) => {
                return chatList.map(chat => {
                    const mappedStatus = mapStatus(chat);
                    return {
                        id: chat.chat_id,
                        name: chat.name || chat.phone,
                        image: chat.profile_pic_url,
                        unreadCount: 0,
                        lastMessage: {
                            body: chat.messages?.[0]?.body || '',
                            timestamp: chat.last_message_at ? new Date(chat.last_message_at).getTime() / 1000 : Date.now() / 1000
                        },
                        status: mappedStatus,
                        tags: chat.tags || []
                    };
                });
            };

            let formattedChats = [];

            try {
                // 1. Try Full Query with Joins
                let query = this.supabase
                    .from('chats')
                    .select('*, messages(body, created_at), leads(status)')
                    .not('chat_id', 'like', '147%')
                    .order('last_message_at', { ascending: false, nullsFirst: false });

                if (session && session.trim() !== '') {
                    query = query.eq('session_name', session);
                }

                const { data, error } = await query;
                if (error) throw error;
                formattedChats = formatChats(data || []);

            } catch (fullQueryError) {
                console.warn('[WahaChattingController] Full chat query failed (likely schema issue), falling back to simple query:', fullQueryError.message);

                // 2. Fallback: Simple Query (No Joins)
                let fallbackQuery = this.supabase
                    .from('chats')
                    .select('*')
                    .not('chat_id', 'like', '147%')
                    .order('last_message_at', { ascending: false, nullsFirst: false });

                if (session && session.trim() !== '') {
                    fallbackQuery = fallbackQuery.eq('session_name', session);
                }

                const { data: fallbackData, error: fallbackError } = await fallbackQuery;
                if (fallbackError) {
                    console.error('[WahaChattingController] Fallback query failed:', fallbackError);
                    throw fallbackError;
                }

                // Map fallback data (missing leads/messages)
                formattedChats = (fallbackData || []).map(chat => ({
                    id: chat.chat_id,
                    name: chat.name || chat.phone,
                    image: chat.profile_pic_url,
                    unreadCount: 0,
                    lastMessage: {
                        body: '...', // Placeholder
                        timestamp: chat.last_message_at ? new Date(chat.last_message_at).getTime() / 1000 : Date.now() / 1000
                    },
                    status: 'PROSPECTING', // Default
                    tags: chat.tags || []
                }));
            }

            console.log(`[WahaChattingController] Returning ${formattedChats.length} chats`);
            res.json(formattedChats);

        } catch (error) {
            console.error('[WahaChattingController] getChats critical error:', error);
            // Don't return 500 meant for blocking errors. Return empty list if it's a "chats" table missing issue masked as something else
            if (error.code === '42P01') { // relation does not exist
                return res.json([]);
            }
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

            console.log(`[WahaChattingController] Deleting chat ${chatId} (Internal ID: ${chat.id})...`);

            // 2. Cascade Delete: Messages associated with this chat
            const { error: msgError } = await this.supabase
                .from('messages')
                .delete()
                .eq('chat_id', chat.id);

            if (msgError) {
                console.error('[WahaChattingController] Error deleting messages:', msgError);
            } else {
                console.log('[WahaChattingController] Messages deleted.');
            }

            // 3. Cascade Delete: Emotional State (Context "emoção e tals")
            // Linked to Lead ID. Verify if we should wipe it. User request implies context reset.
            if (chat.lead_id) {
                const { error: emoError } = await this.supabase
                    .from('emotional_state')
                    .delete()
                    .eq('lead_id', chat.lead_id);

                if (emoError) {
                    console.error('[WahaChattingController] Error deleting emotional state:', emoError);
                } else {
                    console.log('[WahaChattingController] Emotional state reset.');
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
            console.error('[WahaChattingController] deleteChat error:', error);
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
            console.error('[WahaChattingController] getProfilePicture error:', error);
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
                    hasMedia: false, // TODO: Enhance schema for media
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
            // Enforce human latency for natural behavior as requested
            const result = await this.waha.sendTextWithLatency(session, chatId, text);
            res.json(result);
        } catch (error) {
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
            const result = await this.waha.sendVoice(session, chatId, file);
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
            console.log(`[WahaChattingController] getLeadSentiment called for session: ${session}, chatId: ${chatId}`);

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
                console.log('[WahaChattingController] Chat not found or no lead_id linked:', { chatError, chat });
                // If no lead associated or chat not found, return neutral default
                return res.json({ sentimentIndex: 2, pleasure: 0.5, status: 'no_lead_linked' });
            }

            const leadId = chat.lead_id;
            console.log(`[WahaChattingController] Found Lead ID: ${leadId}`);

            // 2. Fetch Emotional State
            const { data: emotionalState, error: emoError } = await this.supabase
                .from('emotional_state')
                .select('pleasure, arousal, dominance')
                .eq('lead_id', leadId)
                .limit(1)
                .maybeSingle();

            if (emoError) {
                console.log('[WahaChattingController] Error fetching emotional state:', emoError);
                return res.json({ sentimentIndex: 2, pleasure: 0.5, error: emoError.message });
            }

            if (!emotionalState) {
                console.log('[WahaChattingController] No emotional state entry found for lead:', leadId);
                return res.json({ sentimentIndex: 2, pleasure: 0.5, status: 'no_data', leadId });
            }

            console.log('[WahaChattingController] Found emotional state:', emotionalState);

            // 3. Map Pleasure (0-1) to 0-4 Scale
            const p = emotionalState.pleasure !== undefined ? emotionalState.pleasure : 0.5;
            let index = 2;

            if (p <= 0.2) index = 0;       // 0.0 - 0.2
            else if (p <= 0.4) index = 1;  // 0.2 - 0.4
            else if (p <= 0.6) index = 2;  // 0.4 - 0.6
            else if (p <= 0.8) index = 3;  // 0.6 - 0.8
            else index = 4;                // 0.8 - 1.0

            console.log(`[WahaChattingController] Calculated sentiment: P=${p} -> Index=${index}`);

            res.json({
                sentimentIndex: index,
                pleasure: p,
                arousal: emotionalState.arousal,
                dominance: emotionalState.dominance,
                leadId: leadId
            });

        } catch (error) {
            console.error('[WahaChattingController] getLeadSentiment error:', error);
            res.status(500).json({ error: error.message });
        }
    }

    async subscribePresence(req, res) {
        try {
            const { session, chatId } = req.body;
            console.log(`[WahaChattingController] Subscribing to presence for ${chatId} on ${session}`);
            const result = await this.waha.subscribePresence(session, chatId);
            res.json(result);
        } catch (error) {
            const errorDetails = error.response?.data || error.message;
            console.error(`[WahaChattingController] Failed to subscribe presence: ${error.message}`,
                error.response?.data ? JSON.stringify(error.response.data) : ''
            );
            res.status(500).json({ error: error.message, details: errorDetails });
        }
    }
}

module.exports = WahaChattingController;
