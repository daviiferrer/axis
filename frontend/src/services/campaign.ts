import axios from 'axios';
import { supabase } from '@/lib/supabase/client';

// Fix: Handle case where NEXT_PUBLIC_API_URL points to /waha (common in this project)
const BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1').replace(/\/waha\/?$/, '');
const API_URL = `${BASE_URL}/campaigns`;

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

export interface Campaign {
    id: string;
    company_id: string;
    name: string;
    description?: string;
    status: 'draft' | 'active' | 'paused' | 'archived';
    session_id?: string;
    created_at: string;
    updated_at: string;
    type: 'inbound' | 'outbound';
    stats?: {
        sent: number;
        responded: number;
        converted: number;
    };
}

export interface CampaignFlow {
    id: string;
    campaign_id: string;
    flow_data: {
        nodes: any[];
        edges: any[];
        viewport?: { x: number; y: number; zoom: number };
    };
    version: number;
    is_published: boolean;
    created_at: string;
    updated_at: string;
}

export const campaignService = {
    // CRUD
    listCampaigns: async (): Promise<Campaign[]> => {
        const response = await api.get('/');
        return response.data;
    },

    createCampaign: async (data: { name: string; description?: string; session_id?: string; type?: string }) => {
        const response = await api.post('/', data);
        return response.data.campaign; // Assuming backend returns { success: true, campaign: ... }
    },

    deleteCampaign: async (id: string) => {
        const response = await api.delete(`/${id}`);
        return response.data;
    },

    // Status
    updateStatus: async (id: string, status: Campaign['status']) => {
        const response = await api.patch(`/${id}/status`, { status });
        return response.data.campaign;
    },

    // Flow Management
    getFlow: async (id: string): Promise<CampaignFlow> => {
        const response = await api.get(`/${id}/flow`);
        return response.data;
    },

    saveFlow: async (id: string, flowData: any) => {
        const response = await api.put(`/${id}/flow`, flowData);
        return response.data.flow;
    },

    publishFlow: async (id: string) => {
        const response = await api.post(`/${id}/publish`);
        return response.data.flow;
    }
};
