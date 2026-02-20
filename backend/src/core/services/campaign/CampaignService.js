/**
 * CampaignService - Core Service for Campaign Management
 */
const logger = require('../../../shared/Logger').createModuleLogger('campaign-service');
class CampaignService {
    constructor({ supabaseClient }) {
        this.supabase = supabaseClient;
    }

    async getCampaign(campaignId) {
        // Fetch Campaign
        // Removed agents(*) join due to missing relationship schema error
        const { data: campaign, error } = await this.supabase
            .from('campaigns')
            .select('*')
            .eq('id', campaignId)
            .single();

        if (error) throw error;

        // Fetch Agents manually
        // Assuming 'agents' table has 'campaign_id'
        const { data: agents } = await this.supabase
            .from('agents')
            .select('*')
            .eq('campaign_id', campaignId);

        if (campaign) {
            campaign.agents = agents || [];
        }

        return campaign;
    }

    /**
     * Find campaign by Waha Session Name (Phone Number context).
     * Used to auto-link incoming chats to the correct campaign.
     * NOW NODE-BASED (JSONB).
     * 
     * @param {string} sessionName 
     */
    async getCampaignBySession(sessionName) {
        if (!sessionName || sessionName === 'default') return null;

        // Fetch ALL active campaigns to inspect their nodes
        // (JSONB array element generic lookup is strict in Supabase, in-memory is safer for now)
        const { data: activeCampaigns, error } = await this.supabase
            .from('campaigns')
            .select('id, name, status, user_id, graph')
            .eq('status', 'active')
            .order('updated_at', { ascending: false });

        if (error) {
            logger.error({ err: error }, 'Error listing active campaigns for session lookup');
            return null;
        }

        if (!activeCampaigns) return null;

        // Find the first campaign that has a Trigger Node with matching sessionName
        for (const campaign of activeCampaigns) {
            const graph = campaign.graph;
            if (!graph || !graph.nodes) continue;

            const triggerNode = graph.nodes.find(n =>
                n.type === 'trigger' &&
                n.data?.sessionName === sessionName
            );

            if (triggerNode) {
                logger.info({ sessionName, campaignName: campaign.name, campaignId: campaign.id }, 'Matched session to campaign');
                return campaign;
            }
        }

        logger.warn({ sessionName, checkedCount: activeCampaigns.length }, 'No active campaign found for session');
        return null;
    }


    async listCampaigns(scopedClient = null) {
        const client = scopedClient || this.supabase;
        const { data, error } = await client
            .from('campaigns')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    }

    async createCampaign(userId, campaignData, scopedClient = null) {
        // campaignData: { name, description, session_id }
        const client = scopedClient || this.supabase;

        const insertPayload = {
            user_id: userId,
            name: campaignData.name,
            description: campaignData.description,
            status: 'draft',
            env: process.env.NODE_ENV || 'development' // AUTO-TAGGING: Isolate Dev/Prod
        };

        // Support direct session assignment if provided
        if (campaignData.waha_session_name) {
            insertPayload.waha_session_name = campaignData.waha_session_name;
        }

        const { data, error } = await client
            .from('campaigns')
            .insert(insertPayload)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async updateCampaignStatus(campaignId, status, scopedClient = null) {
        const client = scopedClient || this.supabase;
        const { data, error } = await client
            .from('campaigns')
            .update({ status })
            .eq('id', campaignId)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async deleteCampaign(campaignId, scopedClient = null) {
        const client = scopedClient || this.supabase;
        const { error } = await client
            .from('campaigns')
            .delete()
            .eq('id', campaignId);

        if (error) throw error;
        return { success: true };
    }

    // --- Flow Management ---

    async getFlow(campaignId, scopedClient = null) {
        const client = scopedClient || this.supabase;
        const { data, error } = await client
            .from('campaigns')
            .select('graph')
            .eq('id', campaignId)
            .single();

        if (error) throw error;
        // Return existing graph or empty structure
        return {
            flow_data: data?.graph || { nodes: [], edges: [] },
            version: 1
        };
    }

    async saveFlow(campaignId, flowData, scopedClient = null) {
        // Update the 'graph' jsonb column directly on the campaign
        const client = scopedClient || this.supabase;

        const { data, error } = await client
            .from('campaigns')
            .update({
                graph: flowData,
                updated_at: new Date().toISOString()
            })
            .eq('id', campaignId)
            .select()
            .single();

        if (error) throw error;
        return { flow_data: data.graph };
    }

    async publishFlow(campaignId, scopedClient = null) {
        // In the single-table model, saving is effectively publishing 
        // unless we separate 'graph' (draft) and 'published_graph' (live).
        // For now, assuming direct manipulation as per user request ("não ficar criando tabelas toda hora").

        // 1. Fetch Campaign with Graph
        const client = scopedClient || this.supabase;
        const { data: campaign, error } = await client
            .from('campaigns')
            .select('status, graph')
            .eq('id', campaignId)
            .single();

        if (error) throw error;

        // 2. Validate Graph Structure (Node-First Architecture Validation)
        const graph = campaign.graph || { nodes: [] };
        const triggerNodes = graph.nodes?.filter(n => n.type === 'trigger') || [];

        const hasConfiguredSession = triggerNodes.some(n => n.data?.sessionName && n.data?.sessionName !== 'default');

        if (!hasConfiguredSession) {
            throw new Error('Publicação bloqueada: A campanha precisa de pelo menos um "Gatilho Inicial" com uma sessão de WhatsApp conectada.');
        }

        return campaign;
    }

    async updateCampaignMode(campaignId, mode, userId) {
        // 1. If switching to LIVE, check safety and billing
        if (mode === 'live') {
            // Get user's company_id (Legacy check removed/softened)
            /*
            const { data: profile } = await this.supabase
                .from('profiles')
                .select('company_id')
                .eq('id', userId)
                .single();

            if (!profile?.safety_accepted_at) {
                console.warn('⚠️ Bypassing Safety Check for LIVE mode (Column missing)');
            }
            */

            // Check Billing (Subscription status)
            const { data: subscription } = await this.supabase
                .from('subscriptions')
                .select('status')
                .eq('user_id', userId)
                .single();

            const isActive = subscription?.status === 'active' || subscription?.status === 'trialing';

            if (!isActive) {
                throw new Error('Assinatura ativa necessária para habilitar o modo LIVE.');
            }
        }

        const { data, error } = await this.supabase
            .from('campaigns')
            .update({ mode, updated_at: new Date().toISOString() })
            .eq('id', campaignId)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Retrieves aggregated statistics for a campaign.
     * Includes: Leads Count, Conversions, Revenue, and AI Costs.
     */
    async getCampaignStats(campaignId) {
        try {
            // 1. Leads Stats (Count + Revenue)
            const { data: leads, error: leadsError } = await this.supabase
                .from('leads')
                .select('status, revenue')
                .eq('campaign_id', campaignId);

            if (leadsError) {
                logger.error({ error: leadsError, campaignId }, 'Failed to fetch lead stats');
                throw leadsError;
            }

            const total = leads.length;
            const active = leads.filter(l => l.status === 'new' || l.status === 'contacted' || l.status === 'negotiating').length;
            const converted = leads.filter(l => l.status === 'converted').length;

            // Sum Revenue (defaults to 0 if null)
            const revenue = leads.reduce((sum, lead) => sum + (Number(lead.revenue) || 0), 0);

            // 2. AI Cost Stats
            const { data: usageLogs, error: usageError } = await this.supabase
                .from('ai_usage_logs')
                .select('cost')
                .eq('campaign_id', campaignId);

            if (usageError) {
                logger.warn({ error: usageError, campaignId }, 'Failed to fetch AI usage stats');
            }

            // Sum AI Cost
            const aiCost = (usageLogs || []).reduce((sum, log) => sum + (Number(log.cost) || 0), 0);

            // 3. ROI Calculation
            const profit = revenue - aiCost;
            const roi = aiCost > 0 ? ((profit / aiCost) * 100).toFixed(1) : 0;

            return {
                total,
                active,
                // responded: leads.filter(l => l.status === 'responded').length, // Legacy
                negotiating: leads.filter(l => l.status === 'negotiating').length,
                converted,
                revenue,
                ai_cost: aiCost,
                profit,
                roi
            };
        } catch (error) {
            logger.error({ error: error.message, campaignId }, 'getCampaignStats failed');
            return { total: 0, active: 0, converted: 0, revenue: 0, ai_cost: 0 };
        }
    }
    async getFlowStats(campaignId, scopedClient) {
        return this.leadService.getFlowStats(campaignId, scopedClient);
    }
}

module.exports = CampaignService;
