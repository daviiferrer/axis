import axios from 'axios';
import { supabase } from '@/lib/supabase/client';

const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1').replace(/\/waha$/, '');

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add auth token + Admin Secret
api.interceptors.request.use(async (config) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
        config.headers.Authorization = `Bearer ${session.access_token}`;
    }

    // Authenticated requests will populate req.user in backend
    // RBAC/Admin middleware will check the user's role from the DB.

    return config;
});

export const adminService = {
    getStats: async () => {
        const response = await api.get('/admin/stats');
        return response.data;
    },

    getUsers: async () => {
        const response = await api.get('/admin/users');
        return response.data;
    },

    stopAllSessions: async () => {
        const response = await api.post('/admin/sessions/stop-all');
        return response.data;
    }
};
