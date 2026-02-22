/**
 * WorkflowEngine - The orchestrator of campaign flows.
 * Supports both queue-based (BullMQ) and polling (setInterval) modes.
 */
const logger = require('../../../shared/Logger').createModuleLogger('workflow');
const { composingCache } = require('../../services/system/CacheService');
const {
    CampaignStatusEnum,
    NodeExecutionStateEnum,
    EventTypeEnum,
    NodeTypeEnum
} = require('../../types/CampaignEnums');
const transitionResolver = require('../../services/workflow/TransitionResolver');

class WorkflowEngine {
    constructor({ nodeFactory, leadService, campaignService, supabaseClient, campaignSocket, queueService, stateCheckpointService, redisLockClient }) {
        this.nodeFactory = nodeFactory;
        this.leadService = leadService;
        this.campaignService = campaignService;
        this.supabase = supabaseClient;
        this.campaignSocket = campaignSocket;
        this.queueService = queueService;
        this.stateCheckpointService = stateCheckpointService; // Durable state persistence
        this.redisLockClient = redisLockClient; // NEW: Distributed locking for multi-instance
        this.runnerIntervalId = null;
        this.timerRecoveryIntervalId = null;
        this.useQueues = false;

        // Legacy in-memory lock (fallback when Redis unavailable)
        this.processingPhones = new Set();
    }

    /**
     * Starts the workflow engine.
     * Uses BullMQ if available and enabled, falls back to setInterval polling.
     */
    async start() {
        const { ENABLE_BULLMQ } = require('../../../config/featureFlags');

        // Try to initialize queue-based processing if enabled
        if (ENABLE_BULLMQ && this.queueService) {
            const connected = await this.queueService.initialize();
            if (connected) {
                this.useQueues = true;
                this._registerWorkers();
                logger.info('🚀 WorkflowEngine started (Queue Mode - BullMQ)');
                return;
            }
            logger.warn('BullMQ enabled but failed to connect, falling back to polling');
        }

        // Fallback to polling mode
        logger.info('🚀 WorkflowEngine started (Polling Mode - Recursive Timeout)');

        const runPulse = async () => {
            try {
                await this.pulse();
            } catch (err) {
                logger.error({ error: err.message }, 'Pulse Loop Error');
            } finally {
                // Schedule next pulse only after current one finishes
                this.runnerIntervalId = setTimeout(runPulse, 10000);
            }
        };

        runPulse();

        // NEW: Timer Recovery Loop - processes expired DelayNode timers
        // Runs every 15 seconds to check for workflows waiting on timers
        if (this.stateCheckpointService) {
            this.timerRecoveryIntervalId = setInterval(async () => {
                await this.processExpiredTimers();
            }, 15000);

            // NEW: Lead Recycling Loop - processes stale workflow instances
            // Runs every 15 minutes to recover zombie leads (default: 48 hours inactive)
            this.staleRecoveryIntervalId = setInterval(async () => {
                try {
                    await this.stateCheckpointService.recycleStaleInstances(48);
                } catch (e) {
                    logger.error({ err: e.message }, 'Failed to run stale recovery loop');
                }
            }, 15 * 60 * 1000);

            logger.info('⏰ Timer Recovery Loop (15s) and Stale Recovery Loop (15m) started');
        }
    }

    /**
     * NEW: Process workflows with expired timers (DelayNode completion).
     * Called by timer recovery loop.
     */
    async processExpiredTimers() {
        try {
            const expiredInstances = await this.stateCheckpointService.findExpiredTimers();

            if (expiredInstances.length === 0) return;

            logger.info({ count: expiredInstances.length }, '⏰ Processing expired timer checkpoints');

            for (const instance of expiredInstances) {
                try {
                    await this.resumeFromCheckpoint(instance, { event: 'TIMER_EXPIRED' });
                } catch (err) {
                    logger.error({
                        instanceId: instance.id,
                        error: err.message
                    }, '❌ Failed to resume from checkpoint');

                    // Record error on instance
                    await this.stateCheckpointService.recordError(instance.id, err.message);
                }
            }
        } catch (error) {
            logger.error({ error: error.message }, '❌ Timer recovery loop error');
        }
    }

    /**
     * NEW: Resume workflow execution from a checkpoint.
     * Called when timer expires or user reply received.
     */
    async resumeFromCheckpoint(instance, triggerEvent = {}) {
        const { leads: lead, campaigns: campaign } = instance;

        if (!lead || !campaign) {
            logger.error({ instanceId: instance.id }, 'Invalid checkpoint: missing lead or campaign');
            return;
        }

        logger.info({
            instanceId: instance.id,
            leadId: lead.id,
            nodeId: instance.current_node_id,
            trigger: triggerEvent.event
        }, '▶️ Resuming from checkpoint');

        // Restore context from checkpoint
        const restoredLead = {
            ...lead,
            current_node_id: instance.current_node_id,
            node_state: instance.node_state,
            context: instance.context
        };

        // Clear waiting state before execution
        await this.stateCheckpointService.advanceToNode(
            instance.id,
            instance.current_node_id,
            { waiting_for: null, wait_until: null }
        );

        // Get the graph and proceed to next node (timer completed)
        const graph = campaign.strategy_graph || campaign.graph || { nodes: [], edges: [] };
        const currentNode = graph.nodes?.find(n => n.id === instance.current_node_id);

        if (!currentNode) {
            logger.error({ nodeId: instance.current_node_id }, 'Current node not found in graph');
            return;
        }

        // For timer expiry, find the next node and transition
        const nextNode = this._getNextNode(currentNode.id, graph, 'default');

        if (nextNode) {
            logger.info({
                instanceId: instance.id,
                from: currentNode.id,
                to: nextNode.id
            }, '➡️ Timer completed, advancing to next node');

            // Update checkpoint to new node
            await this.stateCheckpointService.advanceToNode(instance.id, nextNode.id, {
                context: instance.context
            });

            // Continue processing with legacy processLead (will use restored context)
            await this.processLead(restoredLead, campaign);
        } else {
            // No next node = end of flow
            await this.stateCheckpointService.markCompleted(instance.id);
            logger.info({ instanceId: instance.id }, '✅ Workflow completed (timer was final step)');
        }
    }

    /**
     * A single "pulse" of the engine - processes all active campaigns.
     * Optimized to batch load leads (eliminates N+1 query).
     */
    async pulse() {

        try {
            // 1. Get all active campaigns for CURRENT ENVIRONMENT
            // This prevents Localhost from stealing Prod jobs and vice-versa.
            const currentEnv = process.env.NODE_ENV || 'development';

            const { data: campaigns } = await this.supabase
                .from('campaigns')
                .select('*')
                .eq('status', 'active')
                .eq('env', currentEnv); // STRICT ISOLATION

            if (!campaigns || campaigns.length === 0) return;

            // Fetch agents manually (Schema fix)
            const campaignIds = campaigns.map(c => c.id);
            const { data: allAgents } = await this.supabase
                .from('agents')
                .select('*')
                .in('campaign_id', campaignIds);

            // Map agents to campaigns
            const agentsByCampaign = (allAgents || []).reduce((acc, agent) => {
                if (!acc[agent.campaign_id]) acc[agent.campaign_id] = [];
                acc[agent.campaign_id].push(agent);
                return acc;
            }, {});

            for (const campaign of campaigns) {
                campaign.agents = agentsByCampaign[campaign.id] || [];
            }

            // 2. Batch load leads for ALL active campaigns at once (eliminates N+1)
            const { data: allLeads, error: leadsError } = await this.supabase
                .from('leads')
                .select('*')
                .in('campaign_id', campaignIds)
                .in('status', ['new', 'contacted', 'interested', 'qualified'])
                .order('updated_at', { ascending: true });

            if (leadsError) {
                logger.error({ error: leadsError.message }, 'Failed to batch load leads');
                return;
            }

            if (!allLeads || allLeads.length === 0) return;

            // 3. Group leads by campaign_id for O(1) lookup
            const leadsByCampaign = allLeads.reduce((acc, lead) => {
                if (!acc[lead.campaign_id]) acc[lead.campaign_id] = [];
                acc[lead.campaign_id].push(lead);
                return acc;
            }, {});

            // 4. Process campaigns with their pre-loaded leads (per-campaign business hours)
            for (const campaign of campaigns) {
                // Per-campaign business hours check
                if (!this.isBusinessHours(campaign)) {
                    logger.debug({ campaignId: campaign.id, campaignName: campaign.name }, '⏸️ Outside business hours for campaign, skipping');
                    continue;
                }

                const leads = leadsByCampaign[campaign.id] || [];

                // Read delay/batch from the Broadcast node's config (per-node rate limiting)
                const graph = this._loadGraph(campaign);
                const broadcastNode = graph?.nodes?.find(n => n.type === 'broadcast');
                const delayMs = (broadcastNode?.data?.delayBetweenLeads ?? 30) * 1000;
                const batchSize = broadcastNode?.data?.batchSize ?? 20;
                const batch = leads.slice(0, batchSize);

                for (let i = 0; i < batch.length; i++) {
                    await this.processLead(batch[i], campaign);
                    // Delay between leads to avoid WhatsApp rate limits
                    if (i < batch.length - 1 && delayMs > 0) {
                        await new Promise(resolve => setTimeout(resolve, delayMs));
                    }
                }
            }
        } catch (e) {
            logger.error({ error: e.message }, 'Pulse Error');
        }
    }

    /**
     * Triggers AI processing for a lead by phone number.
     * Called by WebhookController when a message arrives.
     */
    async triggerAiForLead(phone, messageBody = null, referral = null, sessionName = null, imageData = null) {
        // Standardize phone (remove non-digits)
        let cleanPhone = phone.replace(/\D/g, '');

        // FIX: Removed naive '55' prepending for 10/11 digit numbers.
        // This was breaking US numbers (10 digits) by turning them into invalid BR numbers.
        // We now expect the input 'phone' to contain the DDI or be handled by the frontend/Waha.
        // if (cleanPhone.length >= 10 && cleanPhone.length <= 11) {
        //     cleanPhone = '55' + cleanPhone;
        // }

        // Try to acquire distributed lock first (Redis), fallback to in-memory
        let lock = null;
        // Distributed Lock (15s TTL - enough for AI, auto-releases if crash)
        if (this.redisLockClient?.enabled) {
            // Use phone-based locking to prevent parallel processing of same user
            try {
                lock = await this.redisLockClient.acquireLock(`phone:${cleanPhone}`, 15000);
            } catch (err) {
                logger.warn({ phone: cleanPhone }, '⏳ Race Condition: Phone locked by another instance. Skipping.');
                return;
            }
        } else {
            // Fallback to in-memory lock (single instance only)
            if (this.processingPhones.has(cleanPhone)) {
                logger.warn({ phone: cleanPhone }, '⏳ Race Condition: Already processing this phone. Skipping trigger.');
                return;
            }
            this.processingPhones.add(cleanPhone);
        }

        try {
            // 1. Update Lead with latest message data (Last Inbound)
            // This is CRITICAL for LogicNode reply detection.
            if (messageBody) {
                const updatePayload = {
                    last_message_body: messageBody,
                    last_message_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                };

                // Inject Ad Context if present (Ad Click Update)
                if (referral) {
                    updatePayload.ad_attribution = {
                        source_id: referral.source_id,
                        headline: referral.headline,
                        body: referral.body,
                        media_type: referral.media_type,
                        source_url: referral.source_url
                    };

                    // Also update source attribution if it was generic before
                    updatePayload.source = 'ad_click';
                    logger.info({ referral }, '💾 Updating Ad Context (JSONB) for Existing Lead');
                }

                // Store image data reference on lead for AI Vision 
                if (imageData) {
                    updatePayload.last_media_data = {
                        type: 'image',
                        mimeType: imageData.mimeType,
                        receivedAt: new Date().toISOString()
                    };
                }

                await this.supabase.from('leads').update(updatePayload).eq('phone', cleanPhone);
            }

            // 1. Resolve Target Campaign ID from Session (Multi-Tenancy Fix)
            // This ensures we look up the lead for the *correct* campaign context.
            let targetCampaign = null;
            if (sessionName && sessionName !== 'default') {
                targetCampaign = await this.campaignService.getCampaignBySession(sessionName);
                if (targetCampaign) {
                    logger.info({ sessionName, campaignId: targetCampaign.id }, '🎯 Resolved Target Campaign from Session');
                }
            }

            // 2. Find lead by phone AND campaign (Scoping)
            let query = this.supabase
                .from('leads')
                .select('*, campaigns(*)')
                .eq('phone', cleanPhone);

            // STRICT SCOPING: If we know the target campaign, ONLY find lead for that campaign.
            // This prevents "Lead A" (Campaign A) from being loaded when user talks to "Session B".
            if (targetCampaign) {
                query = query.eq('campaign_id', targetCampaign.id);
            }

            let { data: leads, error: findError } = await query.limit(1);

            if (findError) {
                logger.error({ error: findError.message, phone: cleanPhone }, '❌ Lead Lookup Failed (DB Error)');
            }

            let lead = leads?.[0];

            // 3. Triage / New Lead Logic
            if (!lead) {
                // If we already resolved the campaign, use it to create the lead
                let campaignId = targetCampaign?.id || null;

                // Fallback: If no session campaign, check if we should look for "Any" lead?
                // No, strict scoping means if I didn't find a lead for THIS campaign, I create one.

                if (!campaignId) {
                    // Check again if we can find a campaign (reduncancy for safety)
                    if (sessionName && sessionName !== 'default') {
                        /* Already checked above */
                    } else {
                        // Triage/Inbox Logic (No session provided)
                        logger.warn({ sessionName, phone: cleanPhone }, '⚠️ No session specific campaign. Lead might be orphaned.');
                    }
                }


                // If no session-specific campaign, we DO NOT fall back to Triage/Inbox.
                // Strict One-to-One mapping as requested.
                if (!campaignId) {
                    logger.warn({ sessionName, phone: cleanPhone }, '⚠️ No campaign linked to this session. Lead will be saved but NO flow triggered.');
                    // We continue to save the lead below, but without a campaign_id, logic later will skip AI.
                }

                // Prepare Ad Context
                let adContext = {};
                if (referral) {
                    adContext = {
                        ad_attribution: {
                            source_id: referral.source_id,
                            headline: referral.headline,
                            body: referral.body,
                            media_type: referral.media_type,
                            source_url: referral.source_url
                        }
                    };
                    logger.info({ referral }, '💾 Persisting Ad Context (JSONB)');
                }

                // Create the lead
                const { data: newLead, error: createError } = await this.supabase
                    .from('leads')
                    .insert({
                        phone: cleanPhone,
                        name: cleanPhone, // FIX: Use Phone as Name (Requested by User)
                        status: 'new',
                        source: referral ? 'ad_click' : 'inbound', // Attribution
                        campaign_id: campaignId,
                        last_message_body: messageBody,
                        last_message_at: new Date().toISOString(),
                        created_at: new Date().toISOString(),
                        ...adContext // Spread specialized columns directly
                    })
                    .select('*, campaigns(*)')
                    .single();

                if (createError) {
                    logger.error({ error: createError.message }, 'Failed to create Triage lead');
                    return;
                }

                lead = newLead;
                logger.info({ leadId: lead.id, campaignId }, '✅ Triage Lead Created');

                if (!campaignId) {
                    logger.info('⚠️ No Triage/Inbox campaign found. Lead saved but AI not triggered.');
                    return;
                }
            }

            // Anti-Collision: Check if client is typing
            const chatId = `${cleanPhone}@c.us`;
            if (composingCache.isComposing(chatId)) {
                logger.info({ phone: cleanPhone, chatId }, '🛑 Skipping AI - client is composing');
                return;
            }

            logger.info({ phone: cleanPhone, leadId: lead.id }, '🤖 Processing incoming message for lead');

            let campaigns = lead.campaigns;
            if (Array.isArray(campaigns)) campaigns = campaigns[0];

            if (!campaigns && lead.campaign_id) {
                campaigns = await this.campaignService.getCampaign(lead.campaign_id);
            }

            // FIX: Check if campaign is ACTIVE before processing
            if (campaigns && campaigns.status !== 'active' && campaigns.status !== 'RUNNING') {
                logger.warn({
                    phone: cleanPhone,
                    campaignId: campaigns.id,
                    campaignName: campaigns.name,
                    status: campaigns.status
                }, '🛑 Campaign is PAUSED/INACTIVE. Skipping processing.');
                return;
            }

            // NEW: Enforce Business Hours
            if (campaigns && !this.isBusinessHours(campaigns)) {
                logger.info({
                    phone: cleanPhone,
                    campaignId: campaigns.id,
                    campaignName: campaigns.name,
                }, '🌙 Campaign is OUTSIDE BUSINESS HOURS. Skipping AI processing.');
                return;
            }

            logger.info({
                leadCampaignId: lead.campaign_id,
                campaignsType: typeof campaigns,
                hasGraph: campaigns ? !!(campaigns.graph || campaigns.strategy_graph) : false
            }, '🔍 Debugging Campaign Extraction');

            if (campaigns) {
                // INJECT SESSION NAME FROM WEBHOOK (Fix for WAHA 422)
                if (sessionName && sessionName !== 'default') {
                    campaigns.session_name = sessionName;
                    campaigns.waha_session_name = sessionName; // Dual compatibility
                    logger.info({ sessionName }, '💉 Injected sessionName into Campaign Context');
                }

                // QUEUE MODE: Offload to BullMQ for robustness + Debounce Buffer
                if (this.useQueues) {
                    const bufferKey = `buffer:lead:${lead.id}:messages`;
                    const jobId = `debounce-lead-${lead.id}`;
                    const typingKey = `lead:${lead.id}:is_typing`;

                    // 1. Append message to Redis Buffer (List)
                    if (messageBody) {
                        await this.queueService.connection.rpush(bufferKey, messageBody);
                        await this.queueService.connection.expire(bufferKey, 300); // 5 min TTL safety
                    }

                    // 2. Add Delayed Job (Debounce + Smart Presence)
                    try {
                        // Remove existing job to "reset" the timer
                        const existingJob = await this.queueService.queues.leadProcessing.getJob(jobId);
                        if (existingJob) {
                            await existingJob.remove().catch(() => { });
                        }

                        // Check typing status to determine delay
                        // If typing: Wait long (10s)
                        // If not typing: Wait window (5s) for follow-up messages
                        const isTyping = await this.queueService.connection.get(typingKey);
                        const delay = isTyping ? 10000 : 5000;

                        logger.info({ leadId: lead.id, queue: 'lead-processing', isTyping: !!isTyping, delay }, '📥 Buffering Lead Message');

                        await this.queueService.queues.leadProcessing.add('process-message', {
                            leadId: lead.id,
                            campaignId: campaigns.id,
                            sessionName
                        }, {
                            jobId: jobId, // Deduplication Key
                            delay,
                            attempts: 3,
                            backoff: { type: 'exponential', delay: 1000 },
                            removeOnComplete: true
                        });
                    } catch (err) {
                        logger.warn({ error: err.message }, '⚠️ Error managing job debounce, buffering anyway.');
                    }

                    return; // Exit, worker will pick it up
                }

                // SYNC MODE PROTECTION
                let syncLock = null;
                try {
                    if (this.redisLockClient) {
                        // Use a distinct lock key for sync execution
                        syncLock = await this.redisLockClient.acquireLock(`sync:lead:${lead.id}`, 30000);
                        if (!syncLock) {
                            logger.warn({ leadId: lead.id }, '🔒 Sync Lock busy. Skipping concurrent trigger.');
                            return;
                        }
                    }

                    // Check if campaign has FSM graph - use new FSM path
                    const graph = campaigns.strategy_graph || campaigns.graph;
                    if (graph && graph.nodes && graph.nodes.length > 0) {
                        logger.info({ leadId: lead.id, campaignId: campaigns.id }, '🔄 Using FSM path (handleUserReply)');
                        // Attach transient image data to lead for AI Vision
                        if (imageData) lead._imageData = imageData;
                        await this.handleUserReply(lead, campaigns, messageBody);
                    } else {
                        // Legacy path - use processLead
                        if (imageData) lead._imageData = imageData;
                        await this.processLead(lead, campaigns);
                    }
                } finally {
                    if (syncLock) {
                        await this.redisLockClient?.releaseLock(syncLock);
                    }
                }
            }
        } catch (error) {
            // Suppress Redlock errors for concurrency (debounce handles it)
            if (error.message && (error.message.includes('Redlock') || error.message.includes('0 of the 1 requested resources'))) {
                logger.debug({ phone: cleanPhone }, '🔒 Concurrency lock active (skipping duplicate trigger)');
                return;
            }
            logger.error({ error: error.message, phone: cleanPhone }, 'triggerAiForLead failed');
        } finally {
            // Release lock (distributed or in-memory)
            if (lock) {
                try {
                    await this.redisLockClient?.releaseLock(lock);
                } catch (e) {
                    // Ignore release errors
                }
            } else {
                this.processingPhones.delete(cleanPhone);
            }
        }
    }

    /**
     * Handles presence updates from WAHA webhooks.
     * Updates lead status and emits real-time events.
     */
    async handlePresenceUpdate(rawId, status, sessionName) {
        try {
            // Extract phone from JID
            const phone = rawId?.split('@')?.[0];
            if (!phone) return;

            // 1. Fetch Lead (Minimal fields needed)
            const { data: lead } = await this.supabase
                .from('leads')
                .select('id, name, campaign_id')
                .eq('phone', phone)
                .single();

            if (!lead) return;

            logger.debug({ phone, status, leadId: lead.id }, 'Presence update');

            // 2. Emit Socket Event (Visuals)
            if (this.campaignSocket) {
                this.campaignSocket.emit('lead.presence', {
                    leadId: lead.id,
                    phone,
                    status, // 'composing' | 'paused' | 'available' | 'recording'
                    session: sessionName,
                    lastSeen: Date.now()
                });
            }

            // 3. Cognitive Concurrency (Smart Buffer)
            if (this.useQueues) {
                // Access the queue instance (assuming getter or direct property)
                const queue = this.queueService.queues?.leadProcessing || this.queueService.leadProcessingQueue;
                if (!queue) return;

                const typingKey = `lead:${lead.id}:is_typing`;
                const jobId = `debounce-lead-${lead.id}`;
                const bufferKey = `buffer:lead:${lead.id}:messages`;

                if (status === 'composing' || status === 'recording') {
                    // USER STARTED TYPING/RECORDING
                    // Mark state (TTL 30s safety net)
                    await this.queueService.connection.set(typingKey, 'true', 'EX', 30);

                    // Check if there's a pending trigger
                    const existingJob = await queue.getJob(jobId);
                    if (existingJob) {
                        // User is typing, so PAUSE execution (extend delay significantly)
                        // We remove the current countdown and restart with a long buffer (10s)
                        await existingJob.remove().catch(() => { });

                        await queue.add('process-message', {
                            leadId: lead.id,
                            campaignId: lead.campaign_id, // Best effort
                            sessionName
                        }, {
                            jobId,
                            delay: 10000, // Wait 10s while typing
                            removeOnComplete: true
                        });

                        logger.info({ leadId: lead.id }, '⏳ User typing... Extending AI wait window (10s)');
                    }

                } else if (status === 'paused' || status === 'available') {
                    // USER STOPPED TYPING
                    // Clear typing state
                    await this.queueService.connection.del(typingKey);

                    // If we were waiting for them to finish, now is the time to trigger (with small grace period)
                    const existingJob = await queue.getJob(jobId);
                    const bufferLen = await this.queueService.connection.llen(bufferKey);

                    // Trigger if we have a job pending OR unassigned messages in buffer
                    if (existingJob || bufferLen > 0) {
                        if (existingJob) await existingJob.remove().catch(() => { });

                        // Short debounce (2s) to catch "broken typing" (typing... pause... typing)
                        // This corresponds to the "Silence Window"
                        await queue.add('process-message', {
                            leadId: lead.id,
                            campaignId: lead.campaign_id,
                            sessionName
                        }, {
                            jobId,
                            delay: 2000,
                            removeOnComplete: true
                        });

                        logger.info({ leadId: lead.id }, '⚡ User stopped typing. Scheduling processing (2s Silence Window)');
                    }
                }
            }

        } catch (error) {
            logger.error({ error: error.message }, 'handlePresenceUpdate failed');
        }
    }

    /**
     * Processes a single lead through its current node in the graph.
     */
    async processLead(lead, campaign = null) {
        let maxSteps = 5;
        let steps = 0;

        try {
            const fullCampaign = campaign || await this.campaignService.getCampaign(lead.campaign_id);

            // FIX: Enforce Campaign Status Check in Core Processor
            if (fullCampaign && fullCampaign.status !== 'active' && fullCampaign.status !== 'RUNNING') {
                logger.warn({
                    leadId: lead.id,
                    campaignId: fullCampaign.id,
                    status: fullCampaign.status
                }, '🛑 ProcessLead aborted: Campaign is PAUSED/INACTIVE.');
                return;
            }

            logger.info({ leadId: lead.id, campaign: fullCampaign.name }, '⚙️ Workflow processing started');
            const graph = this._loadGraph(fullCampaign);

            // FIX: Prevent execution of empty/invalid graphs (User Request: "se os fluxos não estiverem certos não deveria funcionar")
            if (!graph || !graph.nodes || graph.nodes.length === 0) {
                logger.warn({ leadId: lead.id, campaignId: fullCampaign.id }, '⛔ Graph is empty or invalid. Aborting execution.');
                return;
            }

            while (steps < maxSteps) {
                steps++;
                let currentNodeId = lead.current_node_id;

                // 1. Initial Transition (Lead Entry)
                if (!currentNodeId) {
                    const entryNode = graph.nodes.find(n => n.type === 'leadEntry' || n.type === 'trigger' || n.data?.isEntry);
                    if (entryNode) {
                        // --- SOURCE VALIDATION REMOVED (User Request: "remova essa logica") ---
                        // We now allow ANY lead source to enter the flow if it hits the entry node.
                        // The responsibility for filtering is now delegated to the logic nodes or conditional edges if needed.
                        logger.info({ leadId: lead.id, source: lead.source || 'unknown' }, '✅ Lead Entry Allowed (Triage Logic Disabled)');

                        // 3. Transition to Entry Node
                        await this.leadService.transitionToNode(lead.id, entryNode.id);
                        lead.current_node_id = entryNode.id;
                        currentNodeId = entryNode.id;

                        // NEW: Emit realtime event for Lead Entry
                        if (this.campaignSocket) {
                            this.campaignSocket.emitLeadUpdate(lead.id, {
                                current_node_id: entryNode.id,
                                previous_node_id: null,
                                metadata: {
                                    leadName: lead.name,
                                    leadPhone: lead.phone
                                }
                            }, fullCampaign.id);
                        }
                    } else {
                        logger.error({ leadId: lead.id }, 'No entry node found');
                        break;
                    }
                }

                let node = graph.nodes.find(n => n.id === currentNodeId);

                // SELF-HEALING: If current node is invalid (e.g. graph changed), reset to Entry Node
                if (!node && currentNodeId) {
                    logger.warn({ leadId: lead.id, staleNodeId: currentNodeId }, '⚠️ Stale State Detected (Node missing). Restarting flow from Entry.');

                    const entryNode = graph.nodes.find(n => n.type === 'leadEntry' || n.type === 'trigger' || n.data?.isEntry);
                    if (entryNode) {
                        await this.leadService.transitionToNode(lead.id, entryNode.id);
                        lead.current_node_id = entryNode.id;
                        currentNodeId = entryNode.id;
                        node = entryNode;
                    }
                }

                if (!node) {
                    logger.warn({ leadId: lead.id, currentNodeId }, '⛔ Node not found and no entry fallback available. Aborting.');
                    break;
                }

                // 2. Lead Entry bypass
                if (node.type === 'leadEntry') {
                    const next = this._getNextNode(node.id, graph);
                    if (next) {
                        await this._transitionLegacy(lead, next.id, fullCampaign.id);
                        lead.current_node_id = next.id;
                        continue;
                    }
                    break;
                }

                // 3. Executor Retrieval
                const executor = this.nodeFactory.getExecutor(node.type);
                if (!executor) {
                    logger.warn({ nodeType: node.type }, 'No executor for node type');
                    break;
                }

                // 4. Execution context
                // Initialize execution context from lead or DB
                let executionContext = lead.context || {};

                logger.info({ leadId: lead.id, node: node.id, type: node.type }, '▶️ Executing Node');

                // CORRECTED SIGNATURE CALL: execute(lead, campaign, node, graph, context)
                const result = await executor.execute(lead, fullCampaign, node, graph, executionContext);

                logger.info({
                    leadId: lead.id,
                    nodeId: node.id,
                    resultStatus: result.status,
                    resultAction: result.action
                }, '✅ Node Executed. Transitioning...');

                // CONTEXT PROPAGATION: Update context from node output
                if (result.output) {
                    executionContext = { ...executionContext, ...result.output };

                    // NEW: AUTO-UPDATE LEAD STATUS FROM INTENT (Kanban Logic)
                    if (result.output.intent) {
                        try {
                            await this.leadService.updateLeadStatusFromIntent(lead.id, result.output.intent);
                        } catch (intentError) {
                            logger.warn({ leadId: lead.id, error: intentError.message }, 'Failed to auto-update lead status from intent');
                        }
                    }

                    // Persist updated context to DB
                    await this.supabase.from('leads').update({
                        context: executionContext,
                        // Optional: Save snapshot of current node context for debugging
                        current_node_context: {
                            tenantId: node.data?.tenantId,
                            sessionName: node.data?.sessionName,
                            timestamp: new Date().toISOString()
                        }
                    }).eq('id', lead.id);

                    // Update local lead reference so next node sees it if we loop
                    lead.context = executionContext;
                }

                // GOTO SUPPORT: Handle Direct Transition
                if (result.status === NodeExecutionStateEnum.EXITED && result.gotoTarget) {
                    logger.info({ leadId: lead.id, from: node.id, to: result.gotoTarget }, '🦘 Executing GOTO Jump');
                    await this._transitionLegacy(lead, result.gotoTarget, fullCampaign.id);
                    lead.current_node_id = result.gotoTarget;
                    continue; // Loop continues to execute destination node immediately
                }

                // PERSIST NODE STATE (if provided by executor)
                if (result.nodeState) {
                    const mergedState = { ...(lead.node_state || {}), ...result.nodeState };
                    await this.supabase
                        .from('leads')
                        .update({ node_state: mergedState })
                        .eq('id', lead.id);
                    lead.node_state = mergedState;
                }

                if (result.action === 'transfer_campaign') {
                    const { targetCampaignId, reason } = result.output;
                    logger.info({ leadId: lead.id, from: fullCampaign.id, to: targetCampaignId, reason }, '🔀 Executing Campaign Transfer');

                    // 1. Move Lead to New Campaign Table/Context
                    await this.supabase.from('leads').update({
                        campaign_id: targetCampaignId,
                        current_node_id: null, // Reset execution pointer
                        node_state: {},         // Reset state
                        updated_at: new Date().toISOString()
                    }).eq('id', lead.id);

                    // 2. Terminate Current Instance
                    // Assuming we are in FSM mode (instance exists in context, or implicit)
                    // If running via processLead (legacy loop), we just break.
                    if (lead.instance_id) { // If we have instance context
                        await this._updateState(lead.instance_id, {
                            status: 'transferred',
                            context: { ...lead.context, transferred_to: targetCampaignId }
                        });
                    }

                    // 3. Trigger New Campaign Start (Optional: Immediate or wait for next pulse)
                    // Ideally, we let the next Pulse pick it up as a "New Lead" in that campaign
                    // or we force-boot it here. For safety, let's just break and let Pulse handle it.
                    // But to be "Robust", we should ensure the target campaign exists.

                    logger.info({ leadId: lead.id }, '✅ Lead transferred successfully. Next pulse will pick up in new campaign.');
                    break;
                }

                if (result.status === 'success' || result.status === 'complete' || result.status === NodeExecutionStateEnum.EXITED) {
                    if (result.markExecuted) {
                        await this.leadService.markNodeExecuted(lead.id, lead.node_state);
                    }

                    // 5. Hierarchy of Scopes (Action/Transition Logic)
                    const actionLabel = result.action || (result.response?.crm_actions?.[0]);
                    let next = this._getNextNode(node.id, graph, actionLabel);

                    // 6. Semantic Routing / Fallback
                    if (!next && result.action !== 'default') {
                        const fallbackId = node.data?.fallback_route || node.data?.fallbackId;
                        if (fallbackId) {
                            next = graph.nodes.find(n => n.id === fallbackId);
                        }
                    }

                    if (next) {
                        await this._transitionLegacy(lead, next.id, fullCampaign.id);
                        lead.current_node_id = next.id;

                        // Allow any node that transitioned to proceed immediately
                        // if (!result.continueExecution && (node.type === 'agentic' || node.type === 'agent' || node.type === 'broadcast')) break;

                        continue;
                    }

                    // NO NEXT NODE: Clear checkpoint to prevent re-execution loop.
                    // Without this, handleUserReply finds a stale USER_REPLY checkpoint
                    // and re-invokes the same node on every subsequent message.
                    if (this.stateCheckpointService) {
                        const staleCheckpoint = await this.stateCheckpointService.loadCheckpoint(lead.id, fullCampaign.id);
                        if (staleCheckpoint) {
                            await this.stateCheckpointService.markCompleted(staleCheckpoint.id);
                            logger.info({ leadId: lead.id, nodeId: node.id }, '🏁 No outgoing edge — workflow instance completed');
                        }
                    }
                    break;
                } else if (result.status === 'waiting' || result.status === NodeExecutionStateEnum.AWAITING_ASYNC) {
                    // DURABLE EXECUTION: Save checkpoint for async wait
                    if (this.stateCheckpointService && result.checkpoint) {
                        await this.stateCheckpointService.saveCheckpoint(lead.id, fullCampaign.id, {
                            currentNodeId: node.id,
                            executionState: NodeExecutionStateEnum.AWAITING_ASYNC,
                            nodeState: result.nodeState || lead.node_state || {},
                            context: lead.context || {},
                            waitingFor: result.checkpoint.waitingFor,
                            waitUntil: result.checkpoint.waitUntil,
                            correlationKey: result.checkpoint.correlationKey
                        });

                        logger.info({
                            leadId: lead.id,
                            node: node.id,
                            waitingFor: result.checkpoint.waitingFor,
                            waitUntil: result.checkpoint.waitUntil
                        }, '💾 Checkpoint saved (AWAITING_ASYNC)');
                    } else {
                        logger.info({ leadId: lead.id, node: node.id }, '⏸️ Node requested wait, stopping pulse');
                    }
                    break;
                } else {
                    // result.status error or unknown
                    break;
                }
            }
        } catch (err) {
            logger.error({ leadId: lead.id, error: err.message }, 'Error processing lead');

            // ERROR VISUALIZATION: Persist error state to DB
            // This allows the frontend to show the "Red Node" badge
            try {
                await this.supabase.from('leads').update({
                    node_state: {
                        ...(lead.node_state || {}), // Preserve existing state if any
                        error: true,
                        errorMessage: err.message,
                        failedAt: new Date().toISOString()
                    }
                }).eq('id', lead.id);
            } catch (dbErr) {
                logger.error({ error: dbErr.message }, 'Failed to persist error state');
            }
        }
    }

    _loadGraph(campaign) {
        let strategy = campaign.strategy_graph || campaign.graph || campaign.strategy || { nodes: [], edges: [] };
        if (typeof strategy === 'string') {
            try {
                strategy = JSON.parse(strategy);
            } catch (e) {
                strategy = { nodes: [], edges: [] };
            }
        }

        if (!strategy.nodes) strategy.nodes = [];
        if (!strategy.edges) strategy.edges = [];



        return strategy;
    }

    _getNextNode(currentNodeId, graph, actionLabel = null) {
        if (actionLabel) {
            // 1. Try sourceHandle match (for condition nodes with output-0, output-1...)
            const handleEdge = graph.edges.find(e =>
                e.source === currentNodeId &&
                e.sourceHandle === actionLabel
            );
            if (handleEdge) {
                logger.debug({ currentNodeId, actionLabel, target: handleEdge.target }, '🔀 Edge matched by sourceHandle');
                return graph.nodes.find(n => n.id === handleEdge.target);
            }

            // 2. Fallback: Case-insensitive label match
            const smartEdge = graph.edges.find(e =>
                e.source === currentNodeId &&
                e.label?.toLowerCase() === actionLabel.toLowerCase()
            );
            if (smartEdge) return graph.nodes.find(n => n.id === smartEdge.target);
        }

        // Default transition (first matching edge or labeled 'default')
        const edge = graph.edges.find(e => e.source === currentNodeId && (!e.label || e.label === 'default'));

        if (!edge) {
            logger.warn({ currentNodeId, availableEdges: graph.edges.filter(e => e.source === currentNodeId) }, '⚠️ No edge found from node');
            return null;
        }

        return graph.nodes.find(n => n.id === edge.target);
    }

    async _transitionLegacy(lead, nextNodeId, campaignId) {
        const previousNodeId = lead.current_node_id;
        await this.leadService.transitionToNode(lead.id, nextNodeId, campaignId);

        // SYNC FIX: Update workflow_instance to match lead state
        // This prevents handleUserReply from reverting to a stale node
        try {
            await this.supabase.from('workflow_instances')
                .update({
                    current_node_id: nextNodeId,
                    node_state: NodeExecutionStateEnum.ENTERED,
                    updated_at: new Date().toISOString()
                })
                .eq('lead_id', lead.id)
                .eq('campaign_id', campaignId);
        } catch (e) {
            // Ignore if instance doesn't exist yet (legacy mode)
        }

        if (this.campaignSocket) {
            this.campaignSocket.emitLeadUpdate(lead.id, {
                current_node_id: nextNodeId,
                previous_node_id: previousNodeId || null,
                metadata: {
                    leadName: lead.name,
                    leadPhone: lead.phone
                }
            }, campaignId);
        }
    }

    /**
     * Register BullMQ workers for queue-based processing.
     */
    _registerWorkers() {
        if (!this.queueService) return;

        // Worker for Lead Processing (Inbound Messages)
        this.queueService.registerWorker('lead-processing', async (job) => {
            const { leadId, campaignId, sessionName } = job.data;
            logger.info({ leadId, jobId: job.id }, '📨 Processing Buffered Messages (Debounce Complete)');

            // CONCURRENCY FIX: Acquire distributed lock to prevent parallel processing
            let workerLock = null;
            if (this.redisLockClient?.enabled) {
                workerLock = await this.redisLockClient.acquireLock(`worker:lead:${leadId}`, 45000);
                if (!workerLock) {
                    logger.warn({ leadId, jobId: job.id }, '🔒 Worker Lock busy. Job will retry.');
                    throw new Error('Lead is being processed by another worker');
                }
            }

            try {
                // 1. Fetch buffered messages
                const bufferKey = `buffer:lead:${leadId}:messages`;
                const messages = await this.queueService.connection.lrange(bufferKey, 0, -1);

                // 2. Clear buffer immediately (atomic-ish)
                await this.queueService.connection.del(bufferKey);

                const finalMessageBody = messages.length > 0 ? messages.join('\n') : job.data.messageBody;

                if (!finalMessageBody) {
                    logger.warn({ leadId }, '⚠️ Job executed but no messages found in buffer. Skipping.');
                    return;
                }

                logger.info({ leadId, count: messages.length, finalBody: finalMessageBody }, '📦 Aggregated Messages');

                // 3. Re-fetch fresh lead data
                const { data: lead } = await this.supabase
                    .from('leads')
                    .select('*, campaigns(*)')
                    .eq('id', leadId)
                    .single();

                if (!lead) throw new Error(`Lead ${leadId} not found`);

                // 4. Update Lead with FINAL Aggregated Text (Important for AI Context)
                await this.supabase.from('leads').update({
                    last_message_body: finalMessageBody,
                    last_message_at: new Date().toISOString()
                }).eq('id', leadId);

                lead.last_message_body = finalMessageBody; // Local update

                // 5. Route to Logic
                // INJECT SESSION NAME FROM WEBHOOK (Fix for WAHA 422)
                if (sessionName && sessionName !== 'default') {
                    if (lead.campaigns) {
                        lead.campaigns.session_name = sessionName;
                        lead.campaigns.waha_session_name = sessionName;
                    }
                }

                const campaigns = lead.campaigns;
                const graph = campaigns?.strategy_graph || campaigns?.graph;

                if (graph && graph.nodes && graph.nodes.length > 0) {
                    logger.info({ leadId: lead.id }, '🔄 resuming FSM logic with aggregated text');
                    await this.handleUserReply(lead, campaigns, finalMessageBody);
                } else {
                    await this.processLead(lead, campaigns);
                }

            } catch (err) {
                logger.error({ error: err.message, leadId }, '❌ Worker Failed');
                throw err;
            } finally {
                // Always release the lock
                if (workerLock) {
                    await this.redisLockClient?.releaseLock(workerLock);
                }
            }
        });

        // Worker for AI generation (Future use / specific tasks)
        this.queueService.registerWorker('ai-generation', async (job) => {
            const { leadId, campaignId, agentId } = job.data;
            logger.info({ leadId, jobId: job.id }, '🧠 Processing AI generation job');

            const { data: lead } = await this.supabase
                .from('leads')
                .select('*, campaigns(*)')
                .eq('id', leadId)
                .single();

            if (!lead) throw new Error(`Lead ${leadId} not found`);

            // Process the lead through its current node
            const result = await this.processLead(lead, lead.campaigns);
            return result;
        });

        // Worker for WhatsApp send (runs after AI generation)
        this.queueService.registerWorker('whatsapp-send', async (job) => {
            const { leadId, phone, sessionName } = job.data;

            // Get child job results (AI generation output)
            const childrenValues = await job.getChildrenValues();
            logger.info({ leadId, childrenCount: Object.keys(childrenValues).length }, '📤 Processing WhatsApp send job');

            // The actual sending is handled by the node executor
            // This worker just ensures the flow completes
            return { status: 'completed', leadId };
        });

        logger.info('📋 Queue workers registered');
    }

    /**
     * Queue-based pulse: adds leads to queue instead of processing directly.
     */
    async pulseWithQueues() {
        if (!this.isBusinessHours()) return;

        try {
            const { data: campaigns } = await this.supabase
                .from('campaigns')
                .select('*, agents(*)')
                .eq('status', 'active');

            if (!campaigns) return;

            let jobCount = 0;
            for (const campaign of campaigns) {
                const leads = await this.leadService.getLeadsForProcessing(campaign.id);
                for (const lead of leads) {
                    await this.queueService.addLeadJob(lead, campaign);
                    jobCount++;
                }
            }

            if (jobCount > 0) {
                logger.info({ jobCount }, 'Added leads to processing queue');
            }
        } catch (e) {
            logger.error({ error: e.message }, 'Pulse (Queue) Error');
        }
    }

    /**
     * Checks if current time is within business hours for a campaign.
     * Reads from campaign.settings.businessHours if available, otherwise uses defaults.
     * @param {object} [campaign] - Campaign object with optional settings.businessHours
     */
    isBusinessHours(campaign = null) {
        const bh = campaign?.settings?.businessHours;

        // If business hours are explicitly disabled, always allow
        if (bh && bh.enabled === false) return true;

        const tz = bh?.timezone || 'America/Sao_Paulo';
        const start = bh?.start ?? 8;
        const end = bh?.end ?? 20;

        // NEW: Default includes Saturday [1-6] based on user feedback/context
        const workDays = bh?.workDays ?? [1, 2, 3, 4, 5, 6];

        // Get current time in the campaign's timezone
        try {
            const now = new Date();
            const formatter = new Intl.DateTimeFormat('en-US', {
                timeZone: tz,
                hour: 'numeric',
                minute: 'numeric',
                weekday: 'short',
                hour12: false
            });
            const parts = formatter.formatToParts(now);
            const hourPart = parseInt(parts.find(p => p.type === 'hour')?.value || '0');
            const weekdayStr = parts.find(p => p.type === 'weekday')?.value || '';

            // Map weekday string to JS day number (0=Sun, 1=Mon, ..., 6=Sat)
            const dayMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
            const dayNum = dayMap[weekdayStr] ?? now.getDay();

            const isWorkDay = workDays.includes(dayNum);
            const isWorkingHour = hourPart >= start && hourPart < end;

            if (!isWorkDay) {
                logger.debug({ campaignId: campaign?.id, dayNum, workDays }, '🌙 Outside business hours: Not a work day');
            } else if (!isWorkingHour) {
                logger.debug({ campaignId: campaign?.id, hour: hourPart, start, end }, '🌙 Outside business hours: Not working hours');
            }

            return isWorkDay && isWorkingHour;
        } catch (e) {
            // Fallback to server time if timezone fails
            logger.warn({ tz, error: e.message }, 'Failed to parse timezone, falling back to server time');
            const now = new Date();
            const day = now.getDay();
            const hour = now.getHours();
            return workDays.includes(day) && hour >= start && hour < end;
        }
    }
    /**
     * Discrete-First FSM Core: Advance the state of a campaign instance.
     * @param {string} instanceId - UUID of the campaign_instance
     * @param {object} event - { type: EventTypeEnum, payload: any }
     */
    async advanceState(instanceId, event) {
        // 1. Load Instance & Campaign
        const { data: instance, error } = await this.supabase
            .from('workflow_instances')
            .select(`
                *,
                campaigns (
                    id,
                    graph,
                    agents (*)
                )
            `)
            .eq('id', instanceId)
            .single();

        if (error || !instance) {
            logger.error({ instanceId, error }, 'FSM: Failed to load instance');
            return;
        }

        const campaign = instance.campaigns;
        const currentNodeId = instance.current_node_id;

        // 2. Log Event (Event Sourcing)
        await this.supabase.from('event_log').insert({
            instance_id: instanceId,
            event_type: event.type,
            payload: event.payload
        });

        logger.info({ instanceId, event: event.type, node: currentNodeId }, 'FSM: Processing Event');

        // 3. Handle Events by Type
        if (event.type === EventTypeEnum.TRANSITION) {
            // TRANSITION: Move to next node
            const graph = campaign.strategy_graph || campaign.graph;
            const nextNodeId = this._findNextNode(graph, currentNodeId, event.payload?.edgeLabel);
            if (nextNodeId) {
                await this._transitionTo(instance, nextNodeId);
            } else {
                // End of flow: Clean up lead presence from the node so it disappears from UI
                await this._updateState(instanceId, { status: CampaignStatusEnum.COMPLETED });

                // Remove it from the node in the DB so it doesn't linger in stats
                await this.leadService.transitionToNode(instance.lead_id, null);

                // Notify frontend to remove the avatar
                if (this.campaignSocket) {
                    this.campaignSocket.emitLeadUpdate(instance.lead_id, {
                        current_node_id: null,
                        previous_node_id: currentNodeId,
                        metadata: {
                            isCompleted: true
                        }
                    }, instance.campaign_id);
                }

                logger.info({ instanceId, leadId: instance.lead_id, lastNodeId: currentNodeId }, 'FSM: Campaign completed - lead removed from flow');
            }
        } else if (event.type === EventTypeEnum.USER_REPLY) {
            // USER_REPLY: Re-execute current node with new context
            // The node (e.g., AgenticNode) will process the new message
            logger.info({ instanceId, node: currentNodeId }, 'FSM: Processing USER_REPLY - re-executing node');
            await this._transitionTo(instance, currentNodeId);
        } else if (event.type === EventTypeEnum.NODE_ENTER) {
            // NODE_ENTER: Execute the current node
            await this._transitionTo(instance, currentNodeId);
        }
    }

    /**
     * Moves FSM to a new node and executes it.
     */
    async _transitionTo(instance, nodeId) {
        const previousNodeId = instance.current_node_id; // Capture before transition

        // Update State -> ENTERED
        await this._updateState(instance.id, {
            current_node_id: nodeId,
            node_state: NodeExecutionStateEnum.ENTERED
        }, instance.lead_id);

        const campaign = instance.campaigns;
        const graph = campaign.strategy_graph || campaign.graph || { nodes: [], edges: [] };

        // Execute Node Logic
        const nodeConfig = this._getNodeConfig(graph, nodeId);
        if (!nodeConfig) {
            logger.error({ instanceId: instance.id, nodeId }, 'FSM: Node config not found');
            return;
        }

        const executor = this.nodeFactory.getExecutor(nodeConfig.type);
        if (!executor) {
            logger.warn({ nodeType: nodeConfig.type }, 'FSM: No executor for node type, skipping');
            return;
        }

        // Fetch full lead first before emitting update
        const { data: lead } = await this.supabase
            .from('leads')
            .select('*')
            .eq('id', instance.lead_id)
            .single();

        if (!lead) {
            logger.error({ leadId: instance.lead_id }, 'FSM: Lead not found');
            return;
        }

        // Emit real-time event to frontend canvas (WITH METADATA)
        if (this.campaignSocket) {
            this.campaignSocket.emitLeadUpdate(instance.lead_id, {
                current_node_id: nodeId,
                previous_node_id: previousNodeId || null,
                metadata: {
                    leadName: lead.name,
                    leadPhone: lead.phone,
                    profile_picture_url: lead.profile_picture_url,
                    slots: lead.custom_fields?.qualification || {},
                    sentiment: lead.temperature || 0,
                    intentScore: lead.intent_score || 0
                }
            }, instance.campaign_id);
        }


        try {
            logger.info({ instanceId: instance.id, nodeId, nodeType: nodeConfig.type }, 'FSM: Executing node');

            // Execute returns { status, output, edge, nodeState }
            const result = await executor.execute(lead, campaign, nodeConfig, graph);

            // 1. Store output in instance context
            if (result.output) {
                await this._updateState(instance.id, {
                    context: {
                        ...instance.context,
                        lastOutput: result.output,
                        lastIntent: result.output.intent,
                        lastSentiment: result.output.sentiment
                    }
                });
            }

            // 2. Resolve Next Transition (Declarative)
            const edgeLabel = transitionResolver.resolve(nodeConfig, result);

            if (edgeLabel) {
                logger.info({ instanceId: instance.id, edgeLabel }, 'FSM: Transitioning via resolved edge');
                await this.advanceState(instance.id, {
                    type: EventTypeEnum.TRANSITION,
                    payload: { edgeLabel }
                });
            } else if (result.status === NodeExecutionStateEnum.AWAITING_ASYNC) {
                // Stay in state, wait for external event
                await this._updateState(instance.id, {
                    node_state: NodeExecutionStateEnum.AWAITING_ASYNC
                });
                logger.info({ instanceId: instance.id }, 'FSM: Node awaiting async (e.g., user reply)');
            } else {
                logger.info({ instanceId: instance.id, nodeId }, 'FSM: End of flow reached (EXITED or no transition). Marking completed.');

                // Finalize the workflow instance in the database (sets completed_at)
                if (this.checkpointService && this.checkpointService.markCompleted) {
                    await this.checkpointService.markCompleted(instance.id);
                }

                // Also update lead's current_node_id to null so it doesn't stay tied to the last node
                await this.leadService.transitionToNode(instance.lead_id, null, campaign.id);

                // Try to emit real-time event to clear avatar from canvas
                if (this.campaignSocket) {
                    this.campaignSocket.emitLeadUpdate(instance.lead_id, {
                        current_node_id: null,
                        previous_node_id: nodeId,
                        metadata: {
                            leadName: lead.name,
                            leadPhone: lead.phone,
                            isCompleted: true
                        }
                    }, instance.campaign_id);
                }
            }
        } catch (e) {
            logger.error({ instanceId: instance.id, nodeId, error: e.message, stack: e.stack }, 'FSM: Node Execution Failed');
            await this._updateState(instance.id, {
                node_state: NodeExecutionStateEnum.FAILED,
                status: CampaignStatusEnum.PAUSED_SYSTEM_ERROR
            });
        }
    }

    async _updateState(instanceId, updates, leadId = null) {
        await this.supabase.from('workflow_instances').update({
            ...updates,
            updated_at: new Date().toISOString()
        }).eq('id', instanceId);

        // SYNC FIX: Update leads table as well so stats are populated correctly!
        if (updates.current_node_id && leadId) {
            await this.leadService.transitionToNode(leadId, updates.current_node_id);
        }
    }

    _findNextNode(graph, currentNodeId, edgeLabel = 'default') {
        const edge = graph.edges.find(e => e.source === currentNodeId && (e.label === edgeLabel || !e.label));
        return edge ? edge.target : null;
    }

    _getNodeConfig(graph, nodeId) {
        return graph.nodes.find(n => n.id === nodeId);
    }

    /**
     * MICRO-FLOW SWITCHING
     * Jumps the lead to a specific named flow (e.g., 'sdr', 'recovery').
     * @param {string} instanceId
     * @param {string} flowName
     */
    async jumpToFlow(instanceId, flowName) {
        // 1. Get Instance & Graph
        const { data: instance } = await this.supabase
            .from('workflow_instances')
            .select('*, campaigns(graph, strategy_graph)')
            .eq('id', instanceId)
            .single();

        if (!instance) throw new Error(`Instance ${instanceId} not found`);

        const graph = instance.campaigns.strategy_graph || instance.campaigns.graph;

        // 2. Find Entry Point for Flow
        const entryNode = graph.nodes.find(n =>
            n.type === 'entry_point' && n.data?.flow_name === flowName
        );

        if (!entryNode) {
            logger.warn({ instanceId, flowName }, '⚠️ Flow Entry Point not found');
            return false;
        }

        logger.info({ instanceId, flowName, targetNode: entryNode.id }, '🔀 Jumping to Micro-Flow');

        // 3. Update State & Transition
        await this._updateState(instanceId, {
            current_node_id: entryNode.id,
            node_state: NodeExecutionStateEnum.ENTERED,
            context: { ...instance.context, current_flow: flowName } // Track current flow
        });

        // 4. Execute the Entry Node immediately
        await this._transitionTo(instance, entryNode.id);
        return true;
    }

    /**
     * FSM Entry Point: Get or create a campaign instance for a lead.
     * This is the bridge between the old processLead and the new FSM.
     */
    async getOrCreateInstance(lead, campaign) {
        // Check if instance already exists
        const { data: existing } = await this.supabase
            .from('workflow_instances')
            .select('*')
            .eq('campaign_id', campaign.id)
            .eq('lead_id', lead.id)
            .single();

        if (existing) {
            return existing;
        }

        // Find the entry node (TRIGGER type or first node)
        const graph = campaign.strategy_graph || campaign.graph || { nodes: [], edges: [] };
        const entryNode = graph.nodes?.find(n =>
            n.type === 'leadEntry' || n.type === 'trigger' || n.data?.isEntry
        ) || graph.nodes?.[0];

        if (!entryNode) {
            logger.warn({ campaignId: campaign.id }, 'FSM: No entry node found in graph');
            return null;
        }

        // Create new instance
        const { data: instance, error } = await this.supabase
            .from('workflow_instances')
            .insert({
                campaign_id: campaign.id,
                lead_id: lead.id,
                current_node_id: entryNode.id,
                node_state: NodeExecutionStateEnum.ENTERED,
                // status: CampaignStatusEnum.RUNNING, // REMOVED: Column does not exist in workflow_instances
                context: {}
            })
            .select('*')
            .single();

        if (error) {
            logger.error({ error, leadId: lead.id, campaignId: campaign.id }, 'FSM: Failed to create instance');
            return null;
        }

        // Log entry event
        await this.supabase.from('event_log').insert({
            instance_id: instance.id,
            event_type: EventTypeEnum.CAMPAIGN_START,
            payload: { leadId: lead.id, entryNode: entryNode.id }
        });

        logger.info({ instanceId: instance.id, leadId: lead.id, node: entryNode.id }, '🚀 FSM: New instance created');
        return instance;
    }

    /**
     * FSM: Handle incoming message (USER_REPLY event)
     * This triggers the next transition in the FSM.
     * 
     * DURABLE EXECUTION: First checks workflow_instances for checkpoint,
     * then falls back to campaign_instances for backward compatibility.
     */
    async handleUserReply(lead, campaign, messageBody) {
        // DURABLE PATH: Check if there's a checkpoint waiting for user reply
        if (this.stateCheckpointService) {
            const checkpoint = await this.stateCheckpointService.loadCheckpoint(lead.id, campaign.id);

            if (checkpoint && checkpoint.waiting_for === 'USER_REPLY') {
                logger.info({
                    instanceId: checkpoint.id,
                    nodeId: checkpoint.current_node_id,
                    leadId: lead.id
                }, '📥 Resuming from USER_REPLY checkpoint');

                // Resume from checkpoint with user message context
                await this.resumeFromCheckpointWithReply(checkpoint, lead, campaign, messageBody);
                return;
            }
        }

        // LEGACY PATH: Use campaign_instances
        const instance = await this.getOrCreateInstance(lead, campaign);
        if (!instance) {
            logger.warn({ leadId: lead.id }, 'FSM: No instance, falling back to processLead');
            return this.processLead(lead, campaign);
        }

        // If instance is in AWAITING_ASYNC, trigger transition
        if (instance.node_state === NodeExecutionStateEnum.AWAITING_ASYNC) {
            logger.info({ instanceId: instance.id }, 'FSM: Handling USER_REPLY event');

            await this.advanceState(instance.id, {
                type: EventTypeEnum.USER_REPLY,
                payload: { messageBody }
            });
        } else {
            // Instance is in another state, use processLead for now
            logger.info({ instanceId: instance.id, state: instance.node_state }, 'FSM: Instance not awaiting, using processLead');

            // SYNC: Ensure lead has the instance's node pointer
            lead.current_node_id = instance.current_node_id;

            return this.processLead(lead, campaign);
        }
    }

    /**
     * NEW: Resume workflow from checkpoint when user replies.
     * Re-executes the current node with the new message context.
     */
    async resumeFromCheckpointWithReply(checkpoint, lead, campaign, messageBody) {
        logger.info({
            instanceId: checkpoint.id,
            nodeId: checkpoint.current_node_id,
            messagePreview: messageBody?.substring(0, 50)
        }, '💬 Processing user reply on checkpoint');

        // Clear waiting state
        await this.stateCheckpointService.advanceToNode(
            checkpoint.id,
            checkpoint.current_node_id,
            {
                waiting_for: null,
                context: {
                    ...checkpoint.context,
                    lastUserMessage: messageBody,
                    lastReplyAt: new Date().toISOString()
                }
            }
        );

        // Restore lead with checkpoint context
        const restoredLead = {
            ...lead,
            current_node_id: checkpoint.current_node_id,
            node_state: checkpoint.node_state,
            context: checkpoint.context,
            last_message_body: messageBody, // Ensure current message is available
            _imageData: lead._imageData || null // Carry over transient image data
        };

        // Continue processing - the agentic node will see the new message
        await this.processLead(restoredLead, campaign);
    }
}

module.exports = WorkflowEngine;
