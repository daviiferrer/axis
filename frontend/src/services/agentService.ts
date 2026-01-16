
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
    | 'Sales Development Representative'
    | 'Customer Support Specialist'
    | 'Account Executive'
    | 'Onboarding Specialist'
    | 'Technical Consultant';

export type SalesFramework = 'SPIN' | 'BANT' | 'GPCT' | 'MEDDIC';

export type QualificationSlot = 'need' | 'budget' | 'authority' | 'timeline' | 'solution' | 'timing';

export interface DNAConfig {
    psychometrics: {
        openness: Level;
        conscientiousness: Level;
        extraversion: Level;
        agreeableness: Level;
        neuroticism: Level;
    };
    linguistics: {
        reduction_profile: 'CORPORATE' | 'BALANCED' | 'NATIVE';
        caps_mode: 'STANDARD' | 'SENTENCE_CASE' | 'LOWERCASE_ONLY' | 'CHAOTIC';
        correction_style: 'ASTERISK_PRE' | 'ASTERISK_POST' | 'BARE_CORRECTION' | 'EXPLANATORY';
        typo_injection: 'NONE' | 'LOW' | 'MEDIUM';
    };
    chronemics: {
        latency_profile: 'VERY_FAST' | 'FAST' | 'MODERATE' | 'SLOW';
        burstiness: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH';
    };
    pad_baseline: {
        pleasure: PleasureLevel;
        arousal: PADLevel;
        dominance: DominanceLevel;
    };
    qualification?: {
        framework: SalesFramework;
        slots: QualificationSlot[];
    };
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
    }
};
