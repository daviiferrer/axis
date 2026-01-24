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
    constructor({ nodeFactory, leadService, campaignService, supabaseClient, campaignSocket, queueService }) {
        this.nodeFactory = nodeFactory;
        this.leadService = leadService;
        this.campaignService = campaignService;
        this.supabase = supabaseClient;
        this.campaignSocket = campaignSocket;
        this.queueService = queueService;
        this.runnerIntervalId = null;
        this.useQueues = false;

        // Anti-Race Condition Lock
        this.processingPhones = new Set();
    }

    /**
     * Starts the workflow engine.
     * Uses BullMQ if available, falls back to setInterval polling.
     */
    async start() {
        // Try to initialize queue-based processing
        if (this.queueService) {
            const connected = await this.queueService.initialize();
            if (connected) {
                this.useQueues = true;
                this.#registerWorkers();
                logger.info('🚀 WorkflowEngine started (Queue Mode - BullMQ)');
                return;
            }
        }

        // Fallback to polling mode
        logger.info('🚀 WorkflowEngine started (Polling Mode - setInterval)');
        this.runnerIntervalId = setInterval(async () => {
            await this.pulse();
        }, 10000);
    }

    /**
     * A single "pulse" of the engine - processes all active campaigns.
     */
    async pulse() {
        if (!this.isBusinessHours()) return;

        try {
            const { data: campaigns } = await this.supabase
                .from('campaigns')
                .select('*, agents(*)')
                .eq('status', 'active');

            if (!campaigns) return;

            for (const campaign of campaigns) {
                const leads = await this.leadService.getLeadsForProcessing(campaign.id);
                for (const lead of leads) {
                    await this.processLead(lead, campaign);
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
    async triggerAiForLead(phone, messageBody = null, referral = null) {
        // Standardize phone (remove non-digits)
        const cleanPhone = phone.replace(/\D/g, '');

        if (this.processingPhones.has(cleanPhone)) {
            logger.warn({ phone: cleanPhone }, '⏳ Race Condition: Already processing this phone. Skipping trigger.');
            return;
        }

        this.processingPhones.add(cleanPhone);

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
                    updatePayload.ad_source_id = referral.source_id;
                    updatePayload.ad_headline = referral.headline;
                    updatePayload.ad_body = referral.body;
                    updatePayload.ad_media_type = referral.media_type;
                    updatePayload.ad_source_url = referral.source_url;

                    // Also update source attribution if it was generic before
                    updatePayload.source = 'ad_click';
                    logger.info({ referral }, '💾 Updating Ad Context (Professional Columns) for Existing Lead');
                }

                await this.supabase.from('leads').update(updatePayload).eq('phone', cleanPhone);
            }

            // 2. Find lead by phone
            let { data: leads, error: findError } = await this.supabase
                .from('leads')
                .select('*, campaigns(*, agents(*))')
                .eq('phone', cleanPhone)
                .limit(1);

            if (findError) {
                logger.error({ error: findError.message, phone: cleanPhone }, '❌ Lead Lookup Failed (DB Error)');
            }

            let lead = leads?.[0];

            // 3. Triage / New Lead Logic
            if (!lead) {
                const { data: inboxParams } = await this.supabase
                    .from('campaigns')
                    .select('id')
                    .or('name.ilike.%Triagem%,name.ilike.%Inbox%')
                    .eq('status', 'active')
                    .limit(1)
                    .maybeSingle();

                const campaignId = inboxParams?.id || null;

                // Prepare Ad Context
                let adContext = {};
                if (referral) {
                    adContext = {
                        ad_source_id: referral.source_id,
                        ad_headline: referral.headline,
                        ad_body: referral.body,
                        ad_media_type: referral.media_type,
                        ad_source_url: referral.source_url
                    };
                    logger.info({ referral }, '💾 Persisting Ad Context (Professional Columns)');
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

            const campaigns = lead.campaigns || (lead.campaign_id ? await this.campaignService.getCampaign(lead.campaign_id) : null);

            if (campaigns) {
                // Check if campaign has FSM graph - use new FSM path
                const graph = campaigns.strategy_graph || campaigns.graph;
                if (graph && graph.nodes && graph.nodes.length > 0) {
                    logger.info({ leadId: lead.id, campaignId: campaigns.id }, '🔄 Using FSM path (handleUserReply)');
                    await this.handleUserReply(lead, campaigns, messageBody);
                } else {
                    // Legacy path - use processLead
                    await this.processLead(lead, campaigns);
                }
            }
        } catch (error) {
            logger.error({ error: error.message, phone: cleanPhone }, 'triggerAiForLead failed');
        } finally {
            this.processingPhones.delete(cleanPhone);
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

            // Update lead presence in DB (optional, for analytics)
            const { data: lead } = await this.supabase
                .from('leads')
                .select('id, name, campaign_id')
                .eq('phone', phone)
                .single();

            if (lead) {
                logger.debug({ phone, status, leadId: lead.id }, 'Presence update');

                // Emit real-time presence
                if (this.campaignSocket) {
                    this.campaignSocket.emit('lead.presence', {
                        leadId: lead.id,
                        phone,
                        status,
                        session: sessionName
                    });
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
            logger.info({ leadId: lead.id, campaign: fullCampaign.name }, '⚙️ Workflow processing started');
            const graph = this.#loadGraph(fullCampaign);

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
                    const entryNode = graph.nodes.find(n => n.type === 'leadEntry');
                    if (entryNode) {
                        // --- SOURCE VALIDATION (Node-Based Authority) ---
                        const leadSource = lead.source || 'imported';
                        const campaignType = fullCampaign.type || 'inbound';

                        // 1. Check Node Configuration (The Authority)
                        const nodeAllowedSources = entryNode.data?.allowedSources;

                        if (nodeAllowedSources && Array.isArray(nodeAllowedSources)) {
                            // Node explicitly defines what is allowed. Obey the Node.
                            if (!nodeAllowedSources.includes(leadSource)) {
                                logger.warn({ leadId: lead.id, source: leadSource, allowed: nodeAllowedSources }, '⛔ Lead Entry rejected by Node Source Filter');
                                break;
                            }
                            logger.info({ leadId: lead.id, source: leadSource }, '✅ Lead Entry approved by Node Configuration');
                        } else {
                            // 2. Fallback: Strict Type Enforcement (Safety for unconfigured nodes)
                            // Inbound Campaigns (Ads) should NOT process Cold Leads (Apify) automatically unless explicitly allowed by the node.
                            if (campaignType === 'inbound' && (leadSource === 'imported' || leadSource === 'apify')) {
                                logger.warn({ leadId: lead.id, source: leadSource, campaignType }, '⛔ Strict Block: Cold Lead in Inbound Campaign (No Node Override)');
                                break;
                            }
                        }

                        // 3. Transition to Entry Node
                        await this.leadService.transitionToNode(lead.id, entryNode.id);
                        lead.current_node_id = entryNode.id;
                        currentNodeId = entryNode.id;
                    } else {
                        logger.error({ leadId: lead.id }, 'No entry node found');
                        break;
                    }
                }

                const node = graph.nodes.find(n => n.id === currentNodeId);
                if (!node) break;

                // 2. Lead Entry bypass
                if (node.type === 'leadEntry') {
                    const next = this.#getNextNode(node.id, graph);
                    if (next) {
                        await this.#transition(lead, next.id, fullCampaign.id);
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
                logger.info({ leadId: lead.id, node: node.id, type: node.type }, '▶️ Executing Node');
                const result = await executor.execute(lead, fullCampaign, node, graph);

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

                if (result.status === 'success' || result.status === 'complete') {
                    if (result.markExecuted) {
                        await this.leadService.markNodeExecuted(lead.id, lead.node_state);
                    }

                    // 5. Hierarchy of Scopes (Action/Transition Logic)
                    const actionLabel = result.action || (result.response?.crm_actions?.[0]);
                    let next = this.#getNextNode(node.id, graph, actionLabel);

                    // 6. Semantic Routing / Fallback
                    if (!next && result.action !== 'default') {
                        const fallbackId = node.data?.fallback_route || node.data?.fallbackId;
                        if (fallbackId) {
                            next = graph.nodes.find(n => n.id === fallbackId);
                        }
                    }

                    if (next) {
                        await this.#transition(lead, next.id, fullCampaign.id);
                        lead.current_node_id = next.id;

                        // If we just executed an agentic node, we usually stop and wait for reply
                        // UNLESS it's a logic node or something that should chain.
                        // CHECKPOINT: Break after communication nodes to prevent "racing" through the flow.
                        if (node.type === 'agentic' || node.type === 'agent' || node.type === 'broadcast') break;

                        continue;
                    }
                    break;
                } else if (result.status === 'waiting') {
                    logger.info({ leadId: lead.id, node: node.id }, '⏸️ Node requested wait, stopping pulse');
                    break;
                } else {
                    // result.status error or unknown
                    break;
                }
            }
        } catch (err) {
            logger.error({ leadId: lead.id, error: err.message }, 'Error processing lead');
        }
    }

    #loadGraph(campaign) {
        let strategy = campaign.strategy_graph || campaign.strategy || { nodes: [], edges: [] };
        if (typeof strategy === 'string') {
            try {
                strategy = JSON.parse(strategy);
            } catch (e) {
                strategy = { nodes: [], edges: [] };
            }
        }

        // Ensure structure exists to prevent crashes
        if (!strategy.nodes) strategy.nodes = [];
        if (!strategy.edges) strategy.edges = [];

        return strategy;
    }

    #getNextNode(currentNodeId, graph, actionLabel = null) {
        if (actionLabel) {
            // Case-insensitive semantic match
            const smartEdge = graph.edges.find(e =>
                e.source === currentNodeId &&
                e.label?.toLowerCase() === actionLabel.toLowerCase()
            );
            if (smartEdge) return graph.nodes.find(n => n.id === smartEdge.target);
        }

        // Default transition (first matching edge or labeled 'default')
        const edge = graph.edges.find(e => e.source === currentNodeId && (!e.label || e.label === 'default'));
        if (!edge) return null;
        return graph.nodes.find(n => n.id === edge.target);
    }

    async #transition(lead, nextNodeId, campaignId) {
        await this.leadService.transitionToNode(lead.id, nextNodeId, campaignId);
        if (this.campaignSocket) {
            this.campaignSocket.emitLeadUpdate(lead.id, { current_node_id: nextNodeId }, campaignId);
        }
    }

    /**
     * Register BullMQ workers for queue-based processing.
     */
    #registerWorkers() {
        // Worker for AI generation
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

        // Worker for on-demand lead processing
        this.queueService.registerWorker('lead-processing', async (job) => {
            const { phone } = job.data;
            await this.triggerAiForLead(phone);
            return { status: 'completed' };
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

    isBusinessHours() {
        const now = new Date();
        const day = now.getDay();
        const hour = now.getHours();
        const isWeekday = day >= 1 && day <= 5;
        const isWorkingHour = hour >= 8 && hour < 20;
        return isWeekday && isWorkingHour;
    }
    /**
     * Discrete-First FSM Core: Advance the state of a campaign instance.
     * @param {string} instanceId - UUID of the campaign_instance
     * @param {object} event - { type: EventTypeEnum, payload: any }
     */
    async advanceState(instanceId, event) {
        // 1. Load Instance & Campaign
        const { data: instance, error } = await this.supabase
            .from('campaign_instances')
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
                // End of flow
                await this._updateState(instanceId, { status: CampaignStatusEnum.COMPLETED });
                logger.info({ instanceId }, 'FSM: Campaign completed - no more nodes');
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
        // Update State -> ENTERED
        await this._updateState(instance.id, {
            current_node_id: nodeId,
            node_state: NodeExecutionStateEnum.ENTERED
        });

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

        // Fetch full lead
        const { data: lead } = await this.supabase
            .from('leads')
            .select('*')
            .eq('id', instance.lead_id)
            .single();

        if (!lead) {
            logger.error({ leadId: instance.lead_id }, 'FSM: Lead not found');
            return;
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
                logger.warn({ instanceId: instance.id, nodeId }, 'FSM: No transition resolved and not awaiting async');
            }
        } catch (e) {
            logger.error({ instanceId: instance.id, nodeId, error: e.message, stack: e.stack }, 'FSM: Node Execution Failed');
            await this._updateState(instance.id, {
                node_state: NodeExecutionStateEnum.FAILED,
                status: CampaignStatusEnum.PAUSED_SYSTEM_ERROR
            });
        }
    }

    async _updateState(instanceId, updates) {
        await this.supabase.from('campaign_instances').update({
            ...updates,
            updated_at: new Date().toISOString()
        }).eq('id', instanceId);
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
            .from('campaign_instances')
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
            .from('campaign_instances')
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
            .from('campaign_instances')
            .insert({
                campaign_id: campaign.id,
                lead_id: lead.id,
                current_node_id: entryNode.id,
                node_state: NodeExecutionStateEnum.ENTERED,
                status: CampaignStatusEnum.RUNNING,
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
     */
    async handleUserReply(lead, campaign, messageBody) {
        // Get or create instance
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
            return this.processLead(lead, campaign);
        }
    }
}

module.exports = WorkflowEngine;
