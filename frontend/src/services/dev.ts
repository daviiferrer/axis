import axios from 'axios';
import { supabase } from '@/lib/supabase/client';

const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1').replace(/\/waha$/, '');

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

export const devService = {
    simulateMessage: async (chatId: string, text: string) => {
        // Legacy dev route - keeping for compatibility if needed
        const response = await api.post('/dev/simulate', {
            action: 'message',
            chatId,
            payload: {
                text,
                session: 'SIMULATOR'
            }
        });
        return response.data;
    },

    simulateWebhook: async (phoneNumber: string, message: string) => {
        // Direct Webhook Simulation as requested
        const payload = {
            event: "message",
            session: "default",
            payload: {
                from: `${phoneNumber}@c.us`,
                body: message,
                chatId: `${phoneNumber}@c.us`,
                _serialized: `true_${phoneNumber}@c.us_${Date.now()}` // Mock ID
            }
        };
        const url = '/webhook/waha';
        console.log('🔗 [Dev] Simulating Webhook to:', api.defaults.baseURL + url, 'Payload:', payload);
        const response = await api.post(url, payload);
        return response.data;
    },

    getMessages: async (chatId: string) => {
        // Use the existing Waha endpoint but for SIMULATOR session
        // Note: Waha routes are under /waha
        const response = await api.get(`/waha/chatting/messages`, {
            params: {
                session: 'SIMULATOR',
                chatId: chatId.includes('@') ? chatId : `${chatId}@s.whatsapp.net`,
                limit: 50
            }
        });
        return response.data;
    }
};
