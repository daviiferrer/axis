import { API_URL, SUPABASE_URL, SUPABASE_ANON_KEY } from '../config/api';
import { supabase } from '../lib/supabaseClient';

class ApiService {
    constructor() {
        this.baseUrl = API_URL;
        this.supabase = supabase;
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;

        // Get Token from Supabase Session
        const { data } = await this.supabase.auth.getSession();
        const token = data?.session?.access_token;

        const config = {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                ...options.headers,
            },
        };

        try {
            const response = await fetch(url, config);

            // Check if response is JSON
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error(`Server returned non-JSON response: ${response.status}`);
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'API request failed');
            }

            return data;
        } catch (error) {
            console.error(`API Error [${endpoint}]:`, error.message);
            throw error;
        }
    }

    // Campaigns - from Supabase
    async createCampaign(data) {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Usuário não autenticado');

            const { data: campaign, error } = await supabase
                .from('campaigns')
                .insert({
                    ...data,
                    user_id: user.id,
                    status: 'paused', // Always start paused
                    total_leads: 0,
                    total_contacted: 0,
                    total_responded: 0
                })
                .select()
                .single();

            if (error) throw error;
            return campaign;
        } catch (error) {
            console.error('Error creating campaign:', error);
            throw error;
        }
    }

    async getCampaigns() {
        try {
            const { data, error } = await supabase
                .from('campaigns')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching campaigns:', error);
            return [];
        }
    }

    async getCampaign(id) {
        try {
            const { data, error } = await supabase
                .from('campaigns')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching campaign:', error);
            return null;
        }
    }

    async getCampaignLeads(campaignId) {
        try {
            // Fetch leads associated with this campaign
            // Table name is 'campaign_leads' not 'leads'
            const { data, error } = await supabase
                .from('campaign_leads')
                .select('*')
                .eq('campaign_id', campaignId);

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching campaign leads:', error);
            return [];
        }
    }

    async getCampaignStats(campaignId) {
        try {
            // 1. Get real counts from campaign_leads
            const { count: totalLeads, error: leadsError } = await supabase
                .from('campaign_leads')
                .select('*', { count: 'exact', head: true })
                .eq('campaign_id', campaignId);

            if (leadsError) throw leadsError;

            const { count: totalResponded, error: respondedError } = await supabase
                .from('campaign_leads')
                .select('*', { count: 'exact', head: true })
                .eq('campaign_id', campaignId)
                .in('status', ['responded', 'qualified', 'converted']);

            if (respondedError) throw respondedError;

            // 2. Get real cost from token_usage_logs
            const { data: costData, error: costError } = await supabase
                .from('token_usage_logs')
                .select('cost')
                .eq('campaign_id', campaignId);

            if (costError) throw costError;

            const totalCost = costData?.reduce((sum, log) => sum + Number(log.cost || 0), 0) || 0;

            console.log(`[API] Stats for ${campaignId}: ${totalLeads} leads, ${totalResponded} responded, cost: ${totalCost}`);

            return {
                total_leads: totalLeads || 0,
                total_responded: totalResponded || 0,
                total_cost: totalCost
            };
        } catch (error) {
            console.error('Error fetching campaign stats:', error);
            return { total_leads: 0, total_responded: 0, total_cost: 0 };
        }
    }

    // Helper to normalize phone/JID
    normalizeJid(jid) {
        if (!jid) return '';
        return jid.replace(/@.*$/, '').replace(/\D/g, '');
    }

    // Get leads for a session - replicating web ChatSessionPage logic
    // Fetches campaigns → campaign_leads → chats and merges them
    async getLeadsBySession(sessionName) {
        try {
            // 1. Fetch campaigns linked to this session
            const { data: campaignsData } = await supabase
                .from('campaigns')
                .select('id, name')
                .eq('session_name', sessionName);

            const campaignIds = campaignsData?.map(c => c.id) || [];
            console.log(`[API] Found ${campaignIds.length} campaigns for session ${sessionName}`);

            // 2. Fetch all leads from those campaigns
            let leadsData = [];
            if (campaignIds.length > 0) {
                const { data } = await supabase
                    .from('campaign_leads')
                    .select('*, campaigns(name), token_usage_logs!lead_id(cost)')
                    .in('campaign_id', campaignIds);
                leadsData = data || [];
            }
            console.log(`[API] Found ${leadsData.length} campaign leads`);

            // Helper to sum costs
            const sumCost = (logs) => logs?.reduce((sum, log) => sum + Number(log.cost || 0), 0) || 0;

            // 3. Fetch chats from the session
            const { data: chatsData } = await supabase
                .from('chats')
                .select('*')
                .eq('session_name', sessionName)
                .order('last_message_at', { ascending: false });
            console.log(`[API] Found ${chatsData?.length || 0} chats for session ${sessionName}`);

            // Deduplicate chats by chat_id (in case multiple users have the same chat in this session)
            const uniqueChatsMap = new Map();
            chatsData?.forEach(chat => {
                if (!uniqueChatsMap.has(chat.chat_id)) {
                    uniqueChatsMap.set(chat.chat_id, chat);
                }
            });
            const uniqueChats = Array.from(uniqueChatsMap.values());

            // 4. Merge data - campaign leads + chats
            const processedLeads = (leadsData).map(lead => {
                const cleanPhone = lead.phone?.replace(/\D/g, '') || '';
                const chat = uniqueChats?.find(c =>
                    this.normalizeJid(c.chat_id).includes(cleanPhone)
                );

                return {
                    id: lead.id, // Primary ID is now the LEAD ID (Campaign Lead UUID)
                    chat_id: chat?.chat_id || `${cleanPhone}@s.whatsapp.net`,
                    chat_uuid: chat?.id || null, // Keep chat UUID separate if needed
                    name: chat?.name || lead.name || lead.phone,
                    phone: lead.phone,
                    profile_picture: chat?.profile_picture || null,
                    last_message: chat?.last_message || 'Lead importado',
                    last_message_at: chat?.last_message_at || lead.created_at,
                    campaign_name: lead.campaigns?.name || null,
                    negotiation_status: lead.status || 'prospectando',
                    owner: lead.owner || 'ai',
                    agent_name: lead.agent_name || null,
                    cost: sumCost(lead.token_usage_logs),
                    session_name: sessionName
                };
            });

            // 5. Add chats that are NOT from campaigns (external messages)
            const processedJids = processedLeads.map(l => this.normalizeJid(l.chat_id));
            const externalChats = (uniqueChats || [])
                .filter(chat => !processedJids.includes(this.normalizeJid(chat.chat_id)))
                .map(chat => ({
                    ...chat,
                    campaign_name: null,
                    negotiation_status: 'prospectando',
                    owner: chat.owner || 'human',
                    agent_name: chat.agent_name || null,
                    cost: chat.total_cost || 0
                }));

            // 6. Combine and sort by last message
            const allLeads = [...processedLeads, ...externalChats].sort((a, b) =>
                new Date(b.last_message_at || 0) - new Date(a.last_message_at || 0)
            );

            console.log(`[API] Total leads: ${allLeads.length}`);
            return allLeads;
        } catch (error) {
            console.error('Error fetching leads:', error);
            return [];
        }
    }

    // Legacy getChats - still useful for fallback
    async getChats(sessionName) {
        try {
            let query = supabase.from('chats').select('*');
            if (sessionName) {
                query = query.eq('session_name', sessionName);
            }
            const { data, error } = await query.order('last_message_at', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching chats:', error);
            return [];
        }
    }

    // Messages - from Supabase
    // Messages - from Supabase
    async getMessages(chatId) {
        // If it's a temporary lead ID, we fetch by lead_id instead of chat_id
        // Parse lead ID if possible
        const isLeadId = chatId && String(chatId).startsWith('lead-');

        try {
            let query = supabase
                .from('messages')
                .select('*');

            if (isLeadId) {
                const leadId = chatId.replace('lead-', '');
                // Fetch by lead_id OR if we can find associated phone?
                // For now, assume messages are linked by lead_id
                query = query.eq('lead_id', leadId);
            } else {
                query = query.eq('chat_id', chatId);
            }

            const { data, error } = await query.order('timestamp', { ascending: true });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching messages:', error);
            if (error.code === '22P02') return [];
            return [];
        }
    }

    // Tags
    async getLeadTags(phone) {
        try {
            // Normalize phone
            const cleanPhone = phone.replace(/\D/g, '');
            // Get lead ID first (assuming campaign_leads table has phone)
            const { data: leadData } = await supabase
                .from('campaign_leads')
                .select('id')
                .eq('phone', cleanPhone)
                .single();

            if (!leadData) return [];

            // Get tags
            const { data, error } = await supabase
                .from('lead_tags')
                .select('tags(id, name, color)')
                .eq('lead_id', leadData.id);

            if (error) throw error;
            return data.map(t => t.tags) || [];
        } catch (error) {
            console.error('Error fetching tags:', error);
            return [];
        }
    }

    // Lead Status Update
    async updateLeadStatus(leadId, status) {
        try {
            const { error } = await supabase
                .from('campaign_leads')
                .update({ status: status })
                .eq('id', leadId);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error updating lead status:', error);
            throw error;
        }
    }

    // Tasks
    async getLeadTasks(phone) {
        try {
            // Normalize phone
            const cleanPhone = phone.replace(/\D/g, '');
            // Get lead ID first
            const { data: leadData } = await supabase
                .from('campaign_leads')
                .select('id')
                .eq('phone', cleanPhone)
                .single();

            if (!leadData) return [];

            // Get tasks
            const { data, error } = await supabase
                .from('tasks')
                .select('*')
                .eq('lead_id', leadData.id)
                .order('created_at', { ascending: true }); // Chronological order

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching tasks:', error);
            return [];
        }
    }

    // Send Message - via backend
    async sendMessage(sessionId, chatId, text) {
        return this.request('/api/waha/sendText', {
            method: 'POST',
            body: JSON.stringify({ session: sessionId, chatId, text }),
        });
    }

    async sendImage(sessionId, chatId, file, caption = '') {
        return this.request('/api/waha/sendImage', {
            method: 'POST',
            body: JSON.stringify({
                session: sessionId,
                chatId,
                file, // Base64 data URI
                caption
            }),
        });
    }

    async sendVoice(sessionId, chatId, file) {
        return this.request('/api/waha/sendVoice', {
            method: 'POST',
            body: JSON.stringify({
                session: sessionId,
                chatId,
                file, // Base64 data URI (audio/ogg;base64,...)
                ptt: true
            }),
        });
    }

    // Sessions (WAHA) - via backend
    async getSessions(userId) {
        let url = '/api/waha/sessions';
        if (userId) {
            url += `?userId=${userId}`;
        }
        return this.request(url);
    }

    // Create Session
    async createSession(sessionName, userId) {
        return this.request('/api/waha/sessions', {
            method: 'POST',
            body: JSON.stringify({ name: sessionName, userId }),
        });
    }

    // Analytics - via backend
    async getAnalytics() {
        return this.request('/api/analytics');
    }

    async getProductivityStats() {
        return this.request('/api/analytics/productivity');
    }

    async getLeadCost(leadId) {
        return this.request(`/api/analytics/lead/${leadId}/cost`);
    }

    // --- Files --- via backend
    async saveSettings(userId, settings) {
        return this.request('/api/settings', {
            method: 'POST',
            body: JSON.stringify({ userId, settings }),
        });
    }

    // Get single session details
    async getSession(sessionName) {
        return this.request(`/api/waha/sessions/${sessionName}`);
    }

    // Get session profile info (name, picture, status)
    async getSessionProfile(sessionName) {
        return this.request(`/api/waha/sessions/${sessionName}/profile`);
    }

    // Start Session
    async startSession(sessionName) {
        return this.request(`/api/waha/sessions/${sessionName}/start`, {
            method: 'POST'
        });
    }

    // Stop Session
    async stopSession(sessionName) {
        return this.request(`/api/waha/sessions/${sessionName}/stop`, {
            method: 'POST'
        });
    }

    // Logout Session
    async logoutSession(sessionName) {
        return this.request(`/api/waha/sessions/${sessionName}/logout`, {
            method: 'POST'
        });
    }

    // Delete Session
    async deleteSession(sessionName) {
        return this.request(`/api/waha/sessions/${sessionName}`, {
            method: 'DELETE'
        });
    }

    // Get Session Screenshot (QR)
    // Get Session Screenshot (QR)
    async getSessionScreenshot(sessionName) {
        // Use fetch directly to handle binary response (not JSON)
        const url = `${this.baseUrl}/api/waha/sessions/${sessionName}/screenshot`;
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('Failed to fetch screenshot');

            const blob = await response.blob();

            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        } catch (error) {
            console.error('Error getting screenshot:', error);
            throw error;
        }
    }

    // Request Pairing Code
    async requestPairingCode(sessionName, phoneNumber) {
        // Calls the new backend proxy endpoint
        // Response format: { code: "ABC-123" } or similar from WAHA
        return this.request(`/api/waha/sessions/${sessionName}/pairing-code?phoneNumber=${encodeURIComponent(phoneNumber)}`);
    }

    // Trigger AI for Lead (Force Run)
    async triggerAi(leadId) {
        return this.request(`/api/leads/${leadId}/trigger-ai`, {
            method: 'POST',
            body: JSON.stringify({ force: true }),
        });
    }

    // Get chats filtered by session
    async getChatsBySession(sessionName) {
        try {
            const { data, error } = await supabase
                .from('chats')
                .select('*')
                .eq('session_name', sessionName)
                .order('last_message_at', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching chats by session:', error);
            return [];
        }
    }

    // Update chat control mode (AI/Human)
    async updateChatControlMode(chatId, mode) {
        try {
            const { data, error } = await supabase
                .from('chats')
                .update({ control_mode: mode })
                .eq('id', chatId)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error updating control mode:', error);
            throw error;
        }
    }

    // Get chat details with control mode
    async getChatDetails(chatId) {
        try {
            const { data, error } = await supabase
                .from('chats')
                .select('*')
                .eq('id', chatId)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching chat details:', error);
            return null;
        }
    }

    // Get lead presence
    async getPresence(phone) {
        try {
            if (!phone) return null;
            const cleanPhone = phone.replace(/\D/g, '');
            const { data, error } = await supabase
                .from('chats')
                .select('last_seen, status')
                .eq('phone', cleanPhone)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            // console.error('Error fetching presence:', error);
            return null;
        }
    }

    // Clear Chat Messages
    async clearChatMessages(chatId) {
        try {
            const { error } = await supabase
                .from('messages')
                .delete()
                .eq('chat_id', chatId);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error clearing chat messages:', error);
            throw error;
        }
    }


    // Subscribe to new messages (polling fallback)
    subscribeToMessages(chatId, callback) {
        const channel = supabase
            .channel(`messages:${chatId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `chat_id=eq.${chatId}`
                },
                (payload) => {
                    callback(payload.new);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }

    // Subscribe to chat updates (new chats or message updates)
    subscribeToChats(sessionName, callback) {
        const channel = supabase
            .channel(`chats:${sessionName}`)
            .on(
                'postgres_changes',
                {
                    event: '*', // INSERT, UPDATE, DELETE
                    schema: 'public',
                    table: 'chats',
                    filter: `session_name=eq.${sessionName}`
                },
                (payload) => {
                    console.log('[Realtime] Chat update:', payload.eventType);
                    callback(payload.eventType, payload.new || payload.old);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }

    // Subscribe to specific chat updates (for fallback message sync)
    subscribeToChat(chatId, callback) {
        const channel = supabase
            .channel(`chat:${chatId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'chats',
                    filter: `id=eq.${chatId}`
                },
                (payload) => {
                    callback(payload.new);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }
    async updateCampaignSettings(id, settings) {
        try {
            // First fetch existing to merge
            const { data: current } = await supabase
                .from('campaigns')
                .select('settings')
                .eq('id', id)
                .single();

            const mergedSettings = {
                ...(current?.settings || {}),
                ...settings
            };

            return this.updateCampaign(id, { settings: mergedSettings });
        } catch (error) {
            console.error('Error updating campaign settings:', error);
            throw error;
        }
    }

    // --- Lead Import Methods ---

    async importLeadManual(campaignId, name, phone) {
        try {
            const { data, error } = await supabase
                .from('campaign_leads')
                .insert({
                    campaign_id: campaignId,
                    name,
                    phone,
                    status: 'pending'
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error manually importing lead:', error);
            throw error;
        }
    }

    async startApifySearch(userId, searchTerms, location, maxResults) {
        return this.request('/api/apify/search', {
            method: 'POST',
            body: JSON.stringify({
                searchTerms,
                location,
                maxResults,
                userId
            })
        });
    }

    async pollApifySearch(runId, userId) {
        return this.request(`/api/apify/poll/${runId}?userId=${userId}`);
    }

    async addLeadsBatch(campaignId, leads) {
        // Bulk insert leads into campaign_leads
        // leads array should contain objects with { name, phone, metadata }
        try {
            const leadsToInsert = leads.map(l => ({
                campaign_id: campaignId,
                name: l.name || l.phone,
                phone: l.phone,
                status: 'pending',
                metadata: l.metadata || {}
            }));

            const { data, error } = await supabase
                .from('campaign_leads')
                .insert(leadsToInsert)
                .select();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error batch importing leads:', error);
            throw error;
        }
    }

    async updateCampaign(id, updates) {
        try {
            const { data, error } = await supabase
                .from('campaigns')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error updating campaign:', error);
            throw error;
        }
    }

    async clearChatMessages(chatId) {
        try {
            console.log('[API] Clear Chat Attempt for:', chatId);

            // 1. Get Lead ID and Task IDs from Messages (Hydbrid Approach)
            const { data: chatData } = await supabase
                .from('chats')
                .select('lead_id')
                .eq('id', chatId)
                .single();

            const leadId = chatData?.lead_id;
            console.log('[API] Found Lead ID:', leadId);

            const { data: taskMsgs } = await supabase
                .from('messages')
                .select('task_id')
                .eq('chat_id', chatId)
                .not('task_id', 'is', null);

            let taskIds = taskMsgs?.map(m => m.task_id) || [];

            // 2. Delete Tasks by Lead ID AND Message Links
            if (leadId) {
                console.log('[API] Deleting tasks for Lead ID:', leadId);
                const { error: taskError } = await supabase
                    .from('tasks')
                    .delete()
                    .eq('lead_id', leadId);

                if (taskError) console.error('[API] Error deleting lead tasks:', taskError);
            } else if (taskIds.length > 0) {
                // Fallback: Delete just message-linked tasks if no lead_id
                console.log('[API] Deleting specific Task IDs:', taskIds);
                await supabase.from('tasks').delete().in('id', taskIds);
            }

            // 3. Delete Messages
            const { error } = await supabase
                .from('messages')
                .delete()
                .eq('chat_id', chatId);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error clearing chat:', error);
            throw error;
        }
    }
}


export const apiService = new ApiService();
export default apiService;
