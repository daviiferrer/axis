import api from './api';

export interface FacebookPage {
    id: string;
    name: string;
    access_token: string;
    tasks: string[];
    picture?: {
        data: {
            url: string;
        }
    };
    connected?: boolean; // UI state helper
}

export const facebookAdsService = {
    /**
     * Get OAuth Login URL
     */
    getLoginUrl: async (): Promise<string> => {
        const { data } = await api.get('/facebook/login');
        return data.url;
    },

    /**
     * Exchange Code for Token
     */
    handleCallback: async (code: string, redirectUri: string): Promise<string> => {
        const { data } = await api.post('/facebook/callback', { code, redirectUri });
        return data.accessToken;
    },

    /**
     * List User Pages
     */
    getPages: async (accessToken: string): Promise<FacebookPage[]> => {
        const { data } = await api.get('/facebook/pages', {
            params: { accessToken } // We pass it explicitly if frontend holds it, or session if cookie
        });
        return data.pages;
    },

    /**
     * Subscribe App to Page Webhooks
     */
    subscribePage: async (pageId: string, pageAccessToken: string): Promise<any> => {
        const { data } = await api.post(`/facebook/pages/${pageId}/subscribe`, {
            pageAccessToken
        });
        return data;
    }
};
