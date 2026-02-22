import api from './api';

export interface ProspectSearchInput {
    searchTerms: string;
    location: string;
    maxResults?: number;
    userId: string;
}

export interface ProspectRunStatus {
    success: boolean;
    runId: string;
    status: string;
    leadsCount?: number;
    leads?: any[];
}

export const prospectService = {
    async startSearch(input: ProspectSearchInput): Promise<{ success: boolean; runId: string }> {
        const response = await api.post('/prospects/search', input);
        return response.data;
    },

    async pollStatus(runId: string, userId: string): Promise<ProspectRunStatus> {
        const response = await api.get(`/prospects/poll/${runId}`, { params: { userId } });
        return response.data;
    },

    async stopSearch(runId: string, userId: string): Promise<{ success: boolean; message: string }> {
        const response = await api.post('/prospects/stop', { runId, userId });
        return response.data;
    }
};
