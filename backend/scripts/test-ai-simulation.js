require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const readline = require('readline');

const col = {
    cyan: (text) => `\x1b[36m${text}\x1b[0m`,
    green: (text) => `\x1b[32m${text}\x1b[0m`,
    dim: (text) => `\x1b[2m${text}\x1b[0m`,
    red: (text) => `\x1b[31m${text}\x1b[0m`,
    yellow: (text) => `\x1b[33m${text}\x1b[0m`,
    bgBlue: (text) => `\x1b[44m${text}\x1b[0m`,
    white: (text) => `\x1b[37m${text}\x1b[0m`,
    gray: (text) => `\x1b[90m${text}\x1b[0m`,
};

class MockSocket {
    emit(event, data) { }
    emitLeadUpdate(leadId, data) { }
}

class MockQueueService {
    initialize() { return false; }
}

// --- CORE IMPORTS ---
const PromptService = require('../src/core/services/ai/PromptService');
const CampaignService = require('../src/core/services/campaign/CampaignService');
const LeadService = require('../src/core/services/campaign/LeadService');
const ChatService = require('../src/core/services/chat/ChatService');
const HistoryService = require('../src/core/services/chat/HistoryService');
const GeminiClient = require('../src/infra/clients/GeminiClient');
const WahaClient = require('../src/infra/clients/WahaClient');
const WorkflowEngine = require('../src/core/engines/workflow/WorkflowEngine');
const NodeFactory = require('../src/core/engines/workflow/NodeFactory');
const ModelService = require('../src/core/services/ai/ModelService');
const AgentService = require('../src/core/services/agents/AgentService');
const SettingsService = require('../src/core/services/system/SettingsService');

async function main() {
    console.clear();
    console.log(col.bgBlue('  ÁXIS LIVE AI RUNNER (AUTO-LINK MODE)  ') + '\n');

    // 1. Initialize DB
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        process.exit(1);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log(col.gray('✅ Supabase connected'));

    // 2. Initialize Services
    const settingsService = new SettingsService({ supabaseClient: supabase });

    const geminiClient = new GeminiClient({
        apiKey: process.env.GEMINI_API_KEY,
        settingsService
    });

    // REAL WAHA CLIENT
    const wahaClient = new WahaClient({
        apiUrl: process.env.WAHA_API_URL || 'http://localhost:3000',
        apiKey: process.env.WAHA_API_KEY
    });
    console.log(col.cyan(`🔹 WahaClient Connected to ${process.env.WAHA_API_URL}`));

    const socket = new MockSocket();
    const queueService = new MockQueueService();

    const services = {
        supabaseClient: supabase,
        settingsService,
        geminiClient,
        wahaClient,
        campaignSocket: socket,
        queueService
    };

    services.promptService = new PromptService();
    services.campaignService = new CampaignService(services);
    services.leadService = new LeadService(services);
    services.historyService = new HistoryService(services);
    services.modelService = new ModelService(services);
    services.agentService = new AgentService(services);
    services.chatService = new ChatService(services);
    services.nodeFactory = new NodeFactory(services);

    const workflowEngine = new WorkflowEngine({
        ...services,
        stateCheckpointService: null
    });

    console.log(col.green('\n🚀 SYSTEM READY. WAITING FOR MESSAGES...'));
    console.log(col.dim('(Auto-linking leads to active campaign sessions)'));

    // CACHE ACTIVE CAMPAIGNS to avoid pounding DB on every msg
    let activeCampaignsCache = [];
    const refreshCampaigns = async () => {
        const { data, error } = await supabase.from('campaigns').select('id, name, session_name, user_id').eq('status', 'active');
        if (data) {
            activeCampaignsCache = data;
            console.log(col.dim(`Loaded ${data.length} active campaigns.`));
        }
    };
    await refreshCampaigns();
    setInterval(refreshCampaigns, 30000); // Refresh every 30s

    // 3. LISTEN TO REALTIME EVENTS
    const channel = supabase
        .channel('messages-listener')
        .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'messages' },
            async (payload) => {
                const newMsg = payload.new;
                if (newMsg.from_me) return; // Ignore bots

                console.log(col.yellow(`\n[NEW MSG] ID: ${newMsg.id} | Body: "${newMsg.body}"`));

                try {
                    // Fetch Chat & Lead
                    const { data: chatData, error: chatError } = await supabase
                        .from('chats')
                        .select('*, leads(*)')
                        .eq('id', newMsg.chat_id)
                        .single();

                    if (chatError || !chatData || !chatData.leads) {
                        console.error(col.red('❌ Chat/Lead not found.'));
                        return;
                    }

                    const lead = chatData.leads;
                    const phone = lead.phone;

                    // --- RESOLVE SESSION & CAMPAIGN ---
                    let targetCampaign = null;
                    let targetSession = null;

                    // 1. Check if lead already has a campaign
                    if (lead.campaign_id) {
                        // Find it in our cache or fetch
                        targetCampaign = activeCampaignsCache.find(c => c.id === lead.campaign_id);
                        if (!targetCampaign) {
                            // Maybe it's not active anymore, or cache stale. Fetch fresh.
                            const { data: c } = await supabase.from('campaigns').select('*').eq('id', lead.campaign_id).single();
                            if (c && c.status === 'active') targetCampaign = c;
                        }
                    }

                    // 2. If NO linked campaign (or linked one is inactive), AUTO-MATCH
                    if (!targetCampaign) {
                        if (activeCampaignsCache.length === 1) {
                            // Perfect match
                            targetCampaign = activeCampaignsCache[0];
                            console.log(col.cyan(`Lead has no campaign. Linking to single active campaign: ${targetCampaign.name}`));

                            // LINK IT!
                            await supabase.from('leads').update({ campaign_id: targetCampaign.id }).eq('id', lead.id);

                        } else if (activeCampaignsCache.length > 1) {
                            // Multiple campaigns. We must pick one.
                            // In a real webhook, Waha tells us the session name. Here we don't know which session received it strictly.
                            // BUT, user said "Use the session in the DB". 
                            // We will pick the first one and hope it matches the Waha session connected.
                            // Better yet, log a warning used.
                            targetCampaign = activeCampaignsCache[0];
                            console.log(col.yellow(`Multiple campaigns found. Defaulting to: ${targetCampaign.name} (${targetCampaign.session_name})`));
                            // LINK IT!
                            await supabase.from('leads').update({ campaign_id: targetCampaign.id }).eq('id', lead.id);
                        } else {
                            console.error(col.red('❌ NO ACTIVE CAMPAIGNS FOUND. Cannot process message.'));
                            return;
                        }
                    }

                    if (targetCampaign) {
                        targetSession = targetCampaign.session_name;
                    } else {
                        // Should be impossible given logic above
                        console.error(col.red('❌ Could not determine campaign.'));
                        return;
                    }

                    console.log(col.gray(`Processing for Lead: ${phone} | Session: ${targetSession}`));

                    // Trigger AI
                    await workflowEngine.triggerAiForLead(phone, newMsg.body, null, targetSession);

                    console.log(col.green('✅ AI Triggered.'));

                } catch (err) {
                    console.error(col.red('❌ Error processing message:'), err);
                }
            }
        )
        .subscribe();

    // Prevent script from exiting
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.on('line', (line) => {
        if (line.trim().toLowerCase() === 'exit') process.exit(0);
    });
}

main().catch(err => console.error(err));
