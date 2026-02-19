
import axios from 'axios';
import { supabase } from '@/lib/supabase/client';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

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

// Enums matching backend/src/core/config/AgentDNA.js

export type Level = 'LOW' | 'MEDIUM' | 'HIGH';
export type PADLevel = 'LOW' | 'MEDIUM' | 'HIGH';
export type PleasureLevel = 'NEGATIVE' | 'NEUTRAL' | 'POSITIVE';
export type DominanceLevel = 'SUBMISSIVE' | 'EGALITARIAN' | 'DOMINANT';

export type IdentityRole =
    // Short Keys (Preferred)
    | 'SDR'
    | 'SUPPORT'
    | 'CONCIERGE'
    | 'CONSULTANT'
    | 'EXECUTIVE'
    // Legacy Values (Keep for compatibility)
    | 'Sales Development Representative'
    | 'Customer Support Specialist'
    | 'Account Executive'
    | 'Onboarding Specialist'
    | 'Technical Consultant'
    | 'Concierge / Receptionist';

export type SalesFramework = 'SPIN' | 'BANT' | 'GPCT' | 'MEDDIC';

export type QualificationSlot = 'need' | 'budget' | 'authority' | 'timeline' | 'solution' | 'timing';

// Industry Verticals (matches backend AgentDNA.js)
export type IndustryVertical =
    | 'ADVOCACIA'
    | 'OFICINA_MECANICA'
    | 'ASSISTENCIA_TECNICA'
    | 'IMOBILIARIA'
    | 'CLINICA'
    | 'ECOMMERCE'
    | 'SAAS'
    | 'AGENCIA'
    | 'CONSULTORIA'
    | 'ACADEMIA'
    | 'RESTAURANTE'
    | 'GENERIC';

// Business Context (Playbook)
export interface BusinessContext {
    industry: IndustryVertical;
    company_name?: string;
    custom_context?: string;
}

export interface DNAConfig {
    psychometrics: {
        openness: number | string;
        conscientiousness: number | string;
        extraversion: number | string;
        agreeableness: number | string;
        neuroticism: number | string;
    };
    linguistics: {
        formality?: number | string;
        emoji_frequency?: number | string;
        caps_usage?: number | string;
        intentional_typos?: boolean;
        max_chars?: number;
        reduction_profile?: string;
        caps_mode?: string;
        correction_style?: string;
        typo_injection?: string;
    };
    chronemics: {
        base_latency_ms?: number;
        burstiness?: number | string;
        latency_profile?: string;
    };
    pad_baseline: {
        pleasure: number | string;
        arousal: number | string;
        dominance: number | string;
    };
    qualification?: {
        framework: SalesFramework;
        slots: QualificationSlot[];
    };
    safety?: {
        prohibited_topics: string[];
        handoff_on_frustration: boolean;
    };
    guardrails?: {
        forbidden_topics: string[];
        handoff_enabled: boolean;
        max_turns_before_handoff: number;
    };
    identity?: {
        role: IdentityRole;
    };
    business_context?: BusinessContext;
    voice_config?: VoiceConfig;
}

export type VoiceResponseMode = 'text_only' | 'mirror' | 'hybrid' | 'voice_only';

export interface VoiceConfig {
    enabled: boolean;
    response_mode: VoiceResponseMode;
    voice_id?: string;
    voice_name?: string;
    provider?: string;
    voice_instruction?: string;
    // LMNT / Advanced Settings
    speed?: number;
    temperature?: number;
    dynamic_emotion?: boolean;
    triggers?: {
        first_message?: boolean;
        mirror_audio?: boolean;
        after_objection?: boolean;
        on_close?: boolean;
    };
}

export interface VoiceClone {
    id: string;
    user_id: string;
    agent_id?: string;
    voice_id: string;
    provider: string;
    name: string;
    description?: string;
    sample_url?: string;
    preview_url?: string;
    metadata?: Record<string, unknown>;
    is_active: boolean;
    created_at: string;
}

export interface Agent {
    id: string;
    name: string;
    description: string;
    instructions: string;
    personality?: string; // Legacy/Text fallback
    dna_config?: DNAConfig; // New Strict Config
    model: string;
    temperature: number;
    provider: string;
    status: 'active' | 'inactive' | 'draft';
    created_at?: string;
    updated_at?: string;
}

export const agentService = {
    list: async (): Promise<Agent[]> => {
        const response = await api.get('/agents/available');
        return response.data;
    },

    get: async (id: string): Promise<Agent> => {
        const response = await api.get(`/agents/${id}`);
        return response.data;
    },

    create: async (data: Partial<Agent>): Promise<Agent> => {
        const response = await api.post('/agents', data);
        return response.data;
    },

    update: async (id: string, data: Partial<Agent>): Promise<Agent> => {
        const response = await api.put(`/agents/${id}`, data);
        return response.data;
    },

    delete: async (id: string): Promise<void> => {
        await api.delete(`/agents/${id}`);
    },

    // Voice Management
    enrollVoice: async (audioBase64: string, voiceName: string, description?: string, agentId?: string, provider?: string): Promise<{ voice_id: string; provider: string }> => {
        const response = await api.post('/agents/voice-enroll', { audioBase64, voiceName, description, agentId, provider });
        return response.data;
    },

    listVoices: async (agentId?: string): Promise<VoiceClone[]> => {
        const params = agentId ? `?agentId=${agentId}` : '';
        const response = await api.get(`/agents/voices${params}`);
        return response.data;
    },

    deleteVoice: async (voiceId: string, provider?: string, agentId?: string): Promise<{ success: boolean }> => {
        // We might need to send provider/agentId in query or body depending on backend implementation. 
        // Standard REST suggests DELETE body is discouraged but possible, or use query params.
        // Backend `VoiceService.deleteVoice` needs them. Let's use query params / body.
        // Axios delete supports `data` config.
        const response = await api.delete(`/agents/voices/${voiceId}`, { data: { provider, agentId } });
        return response.data;
    },

    previewVoice: async (voiceId: string, text?: string, provider?: string, agentId?: string): Promise<{ audio_base64: string }> => {
        const response = await api.post('/agents/voice-preview', { voiceId, text, provider, agentId });
        return response.data;
    },
};
