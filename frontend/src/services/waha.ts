import axios from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
const API_URL = `${BASE_URL.replace(/\/$/, '')}/waha`;

import { supabase } from '@/lib/supabase/client';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(async (config) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
        config.headers.Authorization = `Bearer ${session.access_token}`;
    }
    return config;
});

export interface WahaSession {
    id?: string;
    name: string;
    status: string;
    config?: any;
    me?: {
        id: string;
        pushName?: string;
        profilePictureUrl?: string;
    };
}

export interface WahaChat {
    id: string;
    name: string;
    image?: string;
    lastMessage?: {
        body: string;
        timestamp: number;
    };
    unreadCount?: number;
    status?: 'PROSPECTING' | 'QUALIFIED' | 'FINISHED'; // Added for UI filtering
    tags?: string[];
}

export interface WahaMessage {
    id: string;
    from: string;
    to: string;
    body: string;
    timestamp: number;
    hasMedia?: boolean;
    mediaUrl?: string; // If we implement media download
    fromMe: boolean;
    _data?: any; // Raw Waha data
    author?: string;
    isAi?: boolean;
    ack?: number;
}

export const wahaService = {
    // Sessions
    getSessions: async (all = false): Promise<WahaSession[]> => {
        // HYBRID: Try DB first (Resilience), API as fallback
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                // If we have a user session, fetch from DB
                const { data, error } = await supabase
                    .from('sessions')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (data && !error) {
                    return data.map(s => ({
                        name: s.session_name,
                        status: s.status,
                        config: s.config,
                        me: s.me
                    })); // Successful DB read
                }
            }
        } catch (dbError) {
            console.warn('[WahaService] DB Fetch failed, falling back to API', dbError);
        }

        // Fallback to API if DB fails or is empty/unavailable
        const response = await api.get(`/sessions?all=${all}`);
        return response.data;
    },

    getSession: async (session: string): Promise<WahaSession> => {
        const response = await api.get(`/sessions/${session}`);
        return response.data;
    },

    deleteSession: async (name: string) => {
        // name is the 'session' param in URL
        const { data } = await api.delete(`/sessions/${name}`)
        return data
    },

    deleteChat: async (session: string, chatId: string) => {
        // Calls the new backend route DELETE /chats/:session/:chatId
        const { data } = await api.delete(`/chatting/chats/${session}/${chatId}`);
        return data;
    },

    createSession: async (body: any) => {
        const response = await api.post('/sessions', body);
        return response.data;
    },

    startSession: async (session: string) => {
        const response = await api.post(`/sessions/${session}/start`);
        return response.data;
    },

    stopSession: async (session: string) => {
        const response = await api.post(`/sessions/${session}/stop`);
        return response.data;
    },

    logoutSession: async (session: string) => {
        const response = await api.post(`/sessions/${session}/logout`);
        return response.data;
    },

    restartSession: async (session: string) => {
        const response = await api.post(`/sessions/${session}/restart`);
        return response.data;
    },

    getMe: async (session: string) => {
        const response = await api.get(`/sessions/${session}/me`);
        return response.data;
    },

    // Auth
    getLeadSentiment: async (session: string, chatId: string) => {
        const response = await api.get(`/chatting/chats/${session}/${encodeURIComponent(chatId)}/sentiment`);
        return response.data; // { sentimentIndex: number, pleasure: number, ... }
    },

    subscribePresence: async (session: string, chatId: string) => {
        const response = await api.post('/chatting/subscribePresence', { session, chatId });
        return response.data;
    },

    getAuthQR: async (session: string) => {
        // Returns base64 string directly from backend logic
        const response = await api.get(`/auth/${session}/qr`);
        return response.data; // { data: 'base64...', mimetype: '...' }
    },

    // Alias for components usage
    getQR: async (session: string) => {
        const response = await api.get(`/auth/${session}/qr`);
        return response.data;
    },

    getScreenshot: async (session: string) => {
        // Legacy support for widget expecting blob? 
        // Actually widget expects blob but backend returns JSON with base64.
        // Let's return the JSON and update widget to handle it.
        const response = await api.get(`/auth/${session}/qr`);
        return response.data;
    },

    // Chatting
    getChats: async (session?: string): Promise<WahaChat[]> => {
        // Session is optional - if not provided, fetch ALL chats
        const params = session ? `?session=${session}` : '';
        const response = await api.get(`/chatting/chats${params}`);
        return response.data;
    },

    getMessages: async (session: string, chatId: string, limit = 50): Promise<WahaMessage[]> => {
        const response = await api.get(`/chatting/messages?session=${session}&chatId=${chatId}&limit=${limit}`);
        return response.data;
    },

    sendMessage: async (session: string, chatId: string, text: string) => {
        const response = await api.post(`/chatting/sendText`, { session, chatId, text });
        return response.data;
    },

    updateTags: async (session: string, chatId: string, tags: string[]) => {
        const response = await api.post(`/chat/tags`, { session, chatId, tags });
        return response.data;
    },

    checkHealth: async (): Promise<boolean> => {
        try {
            const response = await api.get('/observability/ping', { timeout: 5000 });
            return response.data?.result === 'pong';
        } catch (error) {
            return false;
        }
    }
};

/**
 * Subscribe to real-time session updates via Supabase Realtime.
 * This eliminates the need for aggressive polling.
 * 
 * @param callback - Function to call with updated sessions data
 * @returns Unsubscribe function
 */
export function subscribeToSessions(callback: (sessions: WahaSession[]) => void): () => void {
    const channel = supabase
        .channel('sessions-realtime')
        .on('postgres_changes', {
            event: '*', // INSERT, UPDATE, DELETE
            schema: 'public',
            table: 'sessions'
        }, async (payload) => {
            console.log('[WahaService] Session change detected:', payload.eventType);

            // Re-fetch all sessions on any change
            try {
                const { data, error } = await supabase
                    .from('sessions')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (data && !error) {
                    const mapped = data.map(s => ({
                        name: s.session_name,
                        status: s.status,
                        config: s.config,
                        me: s.me
                    }));
                    callback(mapped);
                }
            } catch (err) {
                console.error('[WahaService] Failed to fetch sessions after realtime event', err);
            }
        })
        .subscribe((status) => {
            console.log('[WahaService] Realtime subscription status:', status);
        });

    // Return cleanup function
    return () => {
        supabase.removeChannel(channel);
    };
}
