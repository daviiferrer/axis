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

            // Fix: Fetch from Database with Lead Status
            const { data: chats, error } = await this.supabase
                .from('chats')
                .select('*, messages!inner(body, created_at), leads(status)')
                .eq('session_name', session)
                .not('chat_id', 'like', '147%') // Filter out ghost chats
                .order('last_message_at', { ascending: false });

            if (error) {
                console.error('[WahaChattingController] Supabase Error:', error);
                throw error;
            }

            console.log(`[WahaChattingController] Found ${chats?.length || 0} chats for session: ${session}`);
            if (chats?.length > 0) {
                console.log('[WahaChattingController] Sample Chat Lead Data:', JSON.stringify(chats[0].leads, null, 2));
                console.log('[WahaChattingController] Sample Chat Raw Status:', chats[0].status);
            }

            // Helper to map DB status to Frontend Status
            const mapStatus = (chat) => {
                const leadStatus = chat.leads?.status?.toLowerCase() || 'new';

                if (['prospecting', 'new', 'contacted', 'pending'].includes(leadStatus)) return 'PROSPECTING';
                if (['negotiating', 'qualified'].includes(leadStatus)) return 'QUALIFIED';
                if (['lost', 'won', 'finished', 'completed', 'handoff_requested'].includes(leadStatus)) return 'FINISHED';

                return 'PROSPECTING'; // Default fallback
            };

            // Format to match expected frontend structure (WahaChat interface)
            const formattedChats = chats.map(chat => {
                const mappedStatus = mapStatus(chat);
                // console.log(`[WahaChattingController] ID: ${chat.chat_id} | RawLeadStatus: ${chat.leads?.status} | Mapped: ${mappedStatus}`);

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

            res.json(formattedChats);
        } catch (error) {
            console.error('[WahaChattingController] getChats error:', error);
            res.status(500).json({ error: error.message });
        }
    }

    async deleteChat(req, res) {
        try {
            const { session, chatId } = req.params;

            // Delete from Database to hide from UI
            const { error } = await this.supabase
                .from('chats')
                .delete()
                .eq('chat_id', chatId)
                .eq('session_name', session);

            if (error) throw error;

            // Optional: Try to clear from Waha if supported (implementation dependent)
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
            const formattedMessages = messages.reverse().map(msg => ({
                id: msg.message_id,
                from: msg.from_me ? 'me' : chatId,
                to: msg.from_me ? chatId : 'me',
                body: msg.body,
                timestamp: new Date(msg.created_at).getTime() / 1000,
                fromMe: msg.from_me,
                hasMedia: false, // TODO: Enhance schema for media
                _data: {}
            }));

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
}

module.exports = WahaChattingController;
