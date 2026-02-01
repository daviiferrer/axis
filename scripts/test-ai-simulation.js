require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const readline = require('readline');
const colors = require('colors'); // You might need to install this or use standard codes

// --- MOCK CLIENTS ---

class MockWahaClient {
    constructor() {
        console.log(colors.cyan('🔹 MockWahaClient Initialized'));
    }

    async sendText(session, chatId, text) {
        console.log('\n' + colors.green('🤖 AI: ') + text);
        return { id: `mock_${Date.now()}` };
    }

    async sendVoiceBase64(session, chatId, base64) {
        console.log('\n' + colors.green('🤖 AI (Voice Note): ') + '[AUDIO SENT - Check Logs]');
        return { id: `mock_audio_${Date.now()}` };
    }

    async setPresence(session, chatId, status) {
        if (status === 'composing') {
            process.stdout.write(colors.dim('... AI is thinking ...\r'));
        }
    }
}

class MockSocket {
    emit(event, data) {
        // console.log(colors.dim(`[Socket] ${event}`), data);
    }
    emitLeadUpdate(leadId, data) {
        // console.log(colors.dim(`[Socket] Lead Update`));
    }
}

class MockQueueService {
    initialize() { return false; } // Force polling mode or internal direct calls
}

// --- CORE IMPORTS (Adjust paths as needed) ---
const PromptService = require('../backend/src/core/services/ai/PromptService');
const CampaignService = require('../backend/src/core/services/campaign/CampaignService');
const LeadService = require('../backend/src/core/services/campaign/LeadService');
const ChatService = require('../backend/src/core/services/chat/ChatService');
const HistoryService = require('../backend/src/core/services/chat/HistoryService');
const GeminiClient = require('../backend/src/core/integrations/ai/GeminiClient');
const WorkflowEngine = require('../backend/src/core/engines/workflow/WorkflowEngine');
const NodeFactory = require('../backend/src/core/engines/workflow/NodeFactory');
const ModelService = require('../backend/src/core/services/ai/ModelService');
const AgentService = require('../backend/src/core/services/agents/AgentService');

// --- MAIN SCRIPT ---

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const ask = (query) => new Promise(resolve => rl.question(query, resolve));

async function main() {
    console.clear();
    console.log(colors.bgBlue.white.bold('  ÁXIS AI SIMULATION TERMINAL  ') + '\n');

    // 1. Initialize DB
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // MUST use service role for backend ops

    if (!supabaseUrl || !supabaseKey) {
        console.error(colors.red('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env'));
        process.exit(1);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log(colors.gray('✅ Supabase connected'));

    // 2. Initialize Services
    const geminiClient = new GeminiClient({ apiKey: process.env.GEMINI_API_KEY });
    const wahaClient = new MockWahaClient();
    const socket = new MockSocket();
    const queueService = new MockQueueService();

    const services = {
        supabaseClient: supabase,
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

    // Circular dependency resolution (ChatService needs WorkflowEngine, Engine needs ChatService? No, usually distinct)
    // ChatService needs supabase, historyService, socketService, wahaClient, contactService(optional)
    services.chatService = new ChatService(services);

    // Node Factory needs ALL services to pass to nodes
    const nodeFactory = new NodeFactory(services);
    services.nodeFactory = nodeFactory;

    const workflowEngine = new WorkflowEngine({
        ...services,
        stateCheckpointService: null // Disable for simple sim? or mock if needed. existing engine checks if (this.stateCheckpointService) so null is safe.
    });

    // 3. Setup Test Context
    const phoneInput = await ask(colors.yellow('Enter Target Phone (e.g. 5511999999999): '));
    const phone = phoneInput.replace(/\D/g, '');

    const sessionName = await ask(colors.yellow('Enter Waha Session Name (Campaign Link): '));

    console.log(colors.gray(`\n🔄 Initializing Simulation for ${phone} on session ${sessionName}...`));

    // 4. Chat Loop
    console.log(colors.cyan('\n--- CHAT STARTED (Type "exit" to quit, "reset" to clear history) ---\n'));

    const processUserMessage = async (msg) => {
        if (msg.toLowerCase() === 'exit') {
            console.log('Exiting...');
            process.exit(0);
        }

        if (msg.toLowerCase() === 'reset') {
            console.log(colors.yellow('🧹 Clearing chat history for this lead...'));
            // Find lead first
            const { data: leads } = await supabase
                .from('leads')
                .select('id')
                .eq('phone', phone);

            if (leads && leads.length > 0) {
                const leadId = leads[0].id;
                // Delete messages
                // Get chat id
                const { data: chat } = await supabase.from('chats').select('id').eq('lead_id', leadId).single();
                if (chat) {
                    await supabase.from('messages').delete().eq('chat_id', chat.id);
                }
                // Reset lead status/node
                await supabase.from('leads').update({
                    current_node_id: null,
                    node_state: {},
                    context: {},
                    status: 'new'
                }).eq('id', leadId);
                console.log(colors.green('✅ History cleared.'));
            } else {
                console.log(colors.red('❌ Lead not found to reset.'));
            }
            return;
        }

        // --- SIMULATE INCOMING MESSAGE FLOW ---
        // 1. We skip WebhookController and call Trigger directly? 
        // Real flow: Webhook -> ChatService.processIncomingMessage -> WorkflowEngine.triggerAiForLead

        // Let's mimic WebhookController logic partially 

        console.log(colors.dim('Processing inbound...'));

        // Trigger AI
        // triggerAiForLead(phone, messageBody, referral = null, sessionName = null)
        try {
            await workflowEngine.triggerAiForLead(phone, msg, null, sessionName);
        } catch (e) {
            console.error(colors.red('❌ Error:'), e.message);
        }
    };

    rl.on('line', (line) => {
        if (line.trim()) processUserMessage(line.trim());
        rl.prompt();
    });

    rl.prompt();
}

main().catch(err => console.error(err));
