/**
 * StateCheckpointService - Durable State Persistence for Workflow Execution
 * 
 * Provides checkpoint-based state management that enables workflows to survive
 * server restarts and handle long-running sales cadences (30+ days).
 * 
 * Key Responsibilities:
 * 1. Save/restore workflow state (FSM position, context, variables)
 * 2. Find instances waiting for async events (timers, user replies)
 * 3. Track execution lifecycle (started, completed, failed)
 */

const logger = require('../../../shared/Logger').createModuleLogger('checkpoint-service');
const { NodeExecutionStateEnum } = require('../../types/CampaignEnums');

class StateCheckpointService {
    constructor({ supabaseClient }) {
        this.supabase = supabaseClient;
    }

    // =========================================================================
    // CHECKPOINT CRUD
    // =========================================================================

    /**
     * Save or update workflow checkpoint.
     * Called when node returns AWAITING_ASYNC status.
     * 
     * @param {string} leadId - The lead UUID
     * @param {string} campaignId - The campaign UUID
     * @param {Object} checkpoint - Checkpoint data
     */
    async saveCheckpoint(leadId, campaignId, checkpoint) {
        const {
            currentNodeId,
            executionState,
            nodeState = {},
            context = {},
            variables = {},
            waitingFor = null,
            waitUntil = null,
            correlationKey = null
        } = checkpoint;

        try {
            const { data, error } = await this.supabase
                .from('workflow_instances')
                .upsert({
                    lead_id: leadId,
                    campaign_id: campaignId,
                    current_node_id: currentNodeId,
                    execution_state: executionState,
                    node_state: nodeState,
                    context: context,
                    variables: variables,
                    waiting_for: waitingFor,
                    wait_until: waitUntil,
                    correlation_key: correlationKey,
                    last_executed_at: new Date().toISOString()
                }, {
                    onConflict: 'lead_id,campaign_id'
                })
                .select()
                .single();

            if (error) throw error;

            logger.info({
                instanceId: data.id,
                leadId,
                nodeId: currentNodeId,
                waitingFor
            }, '💾 Checkpoint saved');

            return data;
        } catch (error) {
            logger.error({ error: error.message, leadId, campaignId }, '❌ Failed to save checkpoint');
            throw error;
        }
    }

    /**
     * Load checkpoint for a lead/campaign combination.
     * Called when resuming workflow from async wait.
     * 
     * @param {string} leadId - The lead UUID
     * @param {string} campaignId - The campaign UUID
     * @returns {Object|null} Checkpoint data or null if not found
     */
    async loadCheckpoint(leadId, campaignId) {
        try {
            const { data, error } = await this.supabase
                .from('workflow_instances')
                .select('*')
                .eq('lead_id', leadId)
                .eq('campaign_id', campaignId)
                .is('completed_at', null)
                .single();

            if (error && error.code !== 'PGRST116') { // PGRST116 = not found
                throw error;
            }

            if (data) {
                logger.debug({
                    instanceId: data.id,
                    nodeId: data.current_node_id,
                    state: data.execution_state
                }, '📥 Checkpoint loaded');
            }

            return data;
        } catch (error) {
            logger.error({ error: error.message, leadId, campaignId }, '❌ Failed to load checkpoint');
            return null;
        }
    }

    /**
     * Get or create a workflow instance for a lead/campaign.
     * Used when a new lead enters the workflow.
     * 
     * @param {string} leadId 
     * @param {string} campaignId 
     * @param {string} entryNodeId - The start node ID
     */
    async getOrCreateInstance(leadId, campaignId, entryNodeId) {
        // Try to load existing
        let instance = await this.loadCheckpoint(leadId, campaignId);

        if (!instance) {
            // Create new instance
            const { data, error } = await this.supabase
                .from('workflow_instances')
                .insert({
                    lead_id: leadId,
                    campaign_id: campaignId,
                    current_node_id: entryNodeId,
                    execution_state: NodeExecutionStateEnum.ENTERED,
                    started_at: new Date().toISOString()
                })
                .select()
                .single();

            if (error) throw error;

            logger.info({
                instanceId: data.id,
                leadId,
                campaignId,
                entryNodeId
            }, '🚀 New workflow instance created');

            instance = data;
        }

        return instance;
    }

    // =========================================================================
    // ASYNC WAIT QUERIES
    // =========================================================================

    /**
     * Find all instances waiting for timer expiry.
     * Called by Timer Recovery Worker on interval.
     * 
     * @returns {Array} Instances with expired timers
     */
    async findExpiredTimers() {
        try {
            const { data, error } = await this.supabase
                .from('workflow_instances')
                .select(`
                    *,
                    leads (*),
                    campaigns (*, agents (*))
                `)
                .eq('waiting_for', 'TIMER')
                .lte('wait_until', new Date().toISOString())
                .is('completed_at', null);

            if (error) throw error;

            if (data?.length > 0) {
                logger.info({ count: data.length }, '⏰ Found expired timers');
            }

            return data || [];
        } catch (error) {
            logger.error({ error: error.message }, '❌ Failed to find expired timers');
            return [];
        }
    }

    /**
     * Find instance waiting for user reply by phone number.
     * Called by webhook handler when message received.
     * 
     * @param {string} phone - The user's phone number (cleaned)
     * @returns {Object|null} Instance waiting for reply
     */
    async findByLeadPhone(phone) {
        try {
            const { data, error } = await this.supabase
                .from('workflow_instances')
                .select(`
                    *,
                    leads!inner (*),
                    campaigns (*, agents (*))
                `)
                .eq('leads.phone', phone)
                .eq('waiting_for', 'USER_REPLY')
                .is('completed_at', null)
                .limit(1)
                .maybeSingle();

            if (error) throw error;

            if (data) {
                logger.debug({
                    instanceId: data.id,
                    phone,
                    nodeId: data.current_node_id
                }, '📱 Found instance by phone');
            }

            return data;
        } catch (error) {
            logger.error({ error: error.message, phone }, '❌ Failed to find instance by phone');
            return null;
        }
    }

    /**
     * Find all active instances for a campaign.
     * Used for admin/debug purposes.
     * 
     * @param {string} campaignId 
     * @returns {Array} Active instances
     */
    async findByCampaign(campaignId) {
        const { data, error } = await this.supabase
            .from('workflow_instances')
            .select('*, leads (*)')
            .eq('campaign_id', campaignId)
            .is('completed_at', null)
            .order('last_executed_at', { ascending: false });

        if (error) throw error;
        return data || [];
    }

    // =========================================================================
    // LIFECYCLE MANAGEMENT
    // =========================================================================

    /**
     * Mark instance as completed (reached end node).
     * 
     * @param {string} instanceId 
     */
    async markCompleted(instanceId) {
        const { error } = await this.supabase
            .from('workflow_instances')
            .update({
                execution_state: NodeExecutionStateEnum.EXITED,
                completed_at: new Date().toISOString(),
                waiting_for: null,
                wait_until: null
            })
            .eq('id', instanceId);

        if (error) throw error;

        logger.info({ instanceId }, '✅ Workflow instance completed');
    }

    /**
     * Mark instance as paused (handoff to human).
     * 
     * @param {string} instanceId 
     * @param {string} reason 
     */
    async markPaused(instanceId, reason = 'handoff') {
        const { error } = await this.supabase
            .from('workflow_instances')
            .update({
                execution_state: 'PAUSED',
                paused_at: new Date().toISOString(),
                waiting_for: null,
                node_state: { pause_reason: reason }
            })
            .eq('id', instanceId);

        if (error) throw error;

        logger.info({ instanceId, reason }, '⏸️ Workflow instance paused');
    }

    /**
     * Resume a paused instance (human hands back to bot).
     * 
     * @param {string} instanceId 
     */
    async resumeFromPause(instanceId) {
        const { data, error } = await this.supabase
            .from('workflow_instances')
            .update({
                execution_state: NodeExecutionStateEnum.ENTERED,
                paused_at: null
            })
            .eq('id', instanceId)
            .select()
            .single();

        if (error) throw error;

        logger.info({ instanceId }, '▶️ Workflow instance resumed');
        return data;
    }

    /**
     * Record an error on the instance.
     * Increments error count and stores last error.
     * 
     * @param {string} instanceId 
     * @param {string} errorMessage 
     */
    async recordError(instanceId, errorMessage) {
        // First get current error count
        const { data: current } = await this.supabase
            .from('workflow_instances')
            .select('error_count')
            .eq('id', instanceId)
            .single();

        const newCount = (current?.error_count || 0) + 1;

        const { error } = await this.supabase
            .from('workflow_instances')
            .update({
                error_count: newCount,
                last_error: errorMessage,
                last_error_at: new Date().toISOString(),
                execution_state: newCount >= 3 ? NodeExecutionStateEnum.FAILED : undefined
            })
            .eq('id', instanceId);

        if (error) throw error;

        logger.warn({ instanceId, errorCount: newCount, error: errorMessage }, '⚠️ Error recorded on instance');

        return newCount;
    }

    /**
     * Advance instance to next node.
     * Called after successful node execution.
     * 
     * @param {string} instanceId 
     * @param {string} nextNodeId 
     * @param {Object} updates - Additional fields to update
     */
    async advanceToNode(instanceId, nextNodeId, updates = {}) {
        const { error } = await this.supabase
            .from('workflow_instances')
            .update({
                current_node_id: nextNodeId,
                execution_state: NodeExecutionStateEnum.ENTERED,
                waiting_for: null,
                wait_until: null,
                last_executed_at: new Date().toISOString(),
                ...updates
            })
            .eq('id', instanceId);

        if (error) throw error;

        logger.debug({ instanceId, nextNodeId }, '➡️ Advanced to next node');
    }

    // =========================================================================
    // CLEANUP & MAINTENANCE
    // =========================================================================

    /**
     * Clean up old completed instances.
     * Should be run as a scheduled job.
     * 
     * @param {number} daysOld - Delete instances older than X days
     */
    async cleanupOldInstances(daysOld = 30) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysOld);

        const { count, error } = await this.supabase
            .from('workflow_instances')
            .delete()
            .not('completed_at', 'is', null)
            .lt('completed_at', cutoffDate.toISOString());

        if (error) throw error;

        if (count > 0) {
            logger.info({ deletedCount: count, daysOld }, '🧹 Cleaned up old instances');
        }

        return count;
    }
}

module.exports = StateCheckpointService;
