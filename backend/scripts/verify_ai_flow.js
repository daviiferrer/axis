require('dotenv').config({ path: '../.env' });
const { createClient } = require('@supabase/supabase-js');

// Mock Waha to avoid needing real WhatsApp connection, 
// BUT log the "Sending" action to verify the flow reach that point.
// If the user WANTS real sending, we can comment this out and use real WahaClient if env is set.
// For "testing flow", seeing the logs is usually enough, but let's try to use the REAL WahaClient if WAHA_URL is present, 
// to be "real flow".
const WahaClient = require('../src/infra/clients/WahaClient');
const GeminiClient = require('../src/infra/clients/GeminiClient');
const WorkflowEngine = require('../src/core/engines/workflow/WorkflowEngine');
const NodeFactory = require('../src/core/engines/workflow/NodeFactory');
const LeadService = require('../src/core/services/campaign/LeadService');
const CampaignService = require('../src/core/services/campaign/CampaignService');
const ChatService = require('../src/core/services/chat/ChatService');
const BillingService = require('../src/core/services/billing/BillingService');
const SettingsService = require('../src/core/services/system/SettingsService');
const HistoryService = require('../src/core/services/chat/HistoryService');
const PromptService = require('../src/core/services/ai/PromptService');
const RagClient = require('../src/infra/clients/RagClient');
const EmotionalStateService = require('../src/core/services/ai/EmotionalStateService');
// Mock Guardrail Service for simplicity or require real one if easy
const guardrailService = { process: (text) => text }; // Mock for now

async function runTest() {
    console.log('🚀 Starting Manual Flow Verification...');

    // 1. Setup Dependencies
    const sbUrl = process.env.SUPABASE_URL;
    const sbKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;

    if (!sbUrl || !sbKey) throw new Error('Missing Supabase Config');

    const supabase = createClient(sbUrl, sbKey);
    console.log('✅ Supabase Connected');

    const settingsService = new SettingsService(supabase);
    const billingService = new BillingService(supabase);

    // Load Settings for Real Integration
    const settings = await settingsService.getSettings();
    const wahaUrl = settings?.waha_url || process.env.WAHA_URL || 'http://localhost:3000';
    const geminiKey = settings?.gemini_key || process.env.GEMINI_API_KEY;

    if (!geminiKey) throw new Error('Missing Gemini Key');

    const wahaClient = new WahaClient({ wahaUrl });
    const geminiClient = new GeminiClient(geminiKey);
    const ragClient = new RagClient(supabase, geminiClient);

    // Services
    const historyService = new HistoryService(supabase);
    // Explicitly enabling credit deduction for test? Or respecting DB?
    // Let's respect DB (ChatService reads it).
    const chatService = new ChatService(supabase, billingService, wahaClient, settingsService);

    // Override sendText to Log instead of failing if WAHA is offline
    // OR, we try real send. 
    // Let's wrapping wahaClient.sendText to catch errors gracefully if WAHA is down, but log the ATTEMPT.
    const originalSend = wahaClient.sendText.bind(wahaClient);
    wahaClient.sendText = async (session, chatId, text) => {
        console.log(`\n📨 [WAHA INTERCEPT] Attempting to send to ${chatId}: "${text}"`);
        try {
            // Uncomment to attempt real send:
            // return await originalSend(session, chatId, text);
            console.log('   (Simulating success to satisfy flow)');
            return { id: 'sim_msg_' + Date.now() };
        } catch (e) {
            console.error('   WAHA Send Failed:', e.message);
            throw e;
        }
    };

    const leadService = new LeadService(supabase);
    const campaignService = new CampaignService(supabase);
    const promptService = new PromptService(supabase, ragClient, historyService);
    const emotionalStateService = new EmotionalStateService(supabase);

    // Dependencies Bundle
    const dependencies = {
        supabase,
        wahaClient,
        geminiClient,
        promptService,
        historyService,
        leadService,
        campaignService,
        emotionalStateService,
        guardrailService,
        analyticsService: { logEvent: () => { } }, // Mock
        billingService,
        cacheService: { get: () => null, set: () => null }, // Mock
        campaignSocket: { emit: (ev, data) => console.log(`🔌 [Socket] ${ev}:`, data?.type || '') }
    };

    const nodeFactory = new NodeFactory(dependencies);
    const workflowEngine = new WorkflowEngine({
        nodeFactory,
        leadService,
        campaignService,
        supabase,
        campaignSocket: dependencies.campaignSocket
    });

    // 2. Prepare Lead
    const targetPhone = '5518998232124';
    console.log(`\n👤 Preparing Lead: ${targetPhone}`);

    // Create a dummy campaign if needed, or find one
    // For this test, assume we just want to run the "Graph" or "Agent" flow.
    // We need a lead in the DB.
    let { data: lead } = await supabase.from('campaign_leads').select('*').eq('phone', targetPhone).single();

    if (!lead) {
        console.log('   Creating new temp lead...');
        const { data: newLead, error } = await supabase.from('campaign_leads').insert({
            phone: targetPhone,
            name: 'Test Valued User',
            status: 'new',
            campaign_id: '00000000-0000-0000-0000-000000000000' // Needs a valid UUID? Or nullable?
            // If campaign_id is FK, we might fail. Let's try to fetch ANY campaign.
        }).select().single();

        if (error) {
            // If FK fails, fetch a campaign first
            const { data: campaigns } = await supabase.from('campaigns').select('id').limit(1);
            if (campaigns && campaigns.length > 0) {
                const { data: leadRetry } = await supabase.from('campaign_leads').insert({
                    phone: targetPhone,
                    name: 'Test Valued User',
                    status: 'new',
                    campaign_id: campaigns[0].id
                }).select().single();
                lead = leadRetry;
            } else {
                throw new Error('No campaigns found to attach lead to. Please create a campaign first.');
            }
        } else {
            lead = newLead;
        }
    }
    console.log(`   Lead ID: ${lead.id}`);

    // 3. Trigger Flow
    console.log('\n▶️ Triggering AI Workflow...');

    // Calling processLead on the workflow engine
    // This assumes the campaign has a graph. If not, it might just exit.
    // For "Test Flow", maybe we want to simulate an INCOMING message?

    // METHOD A: Process Lead (Outbound/start)
    // await workflowEngine.processLead(lead);

    // METHOD B: Simulate Incoming Message (Inbound)
    // This triggers the "Agent" or "Response" nodes typically.

    // Let's try to simulate the "Initial Outreach" (Start)
    const result = await workflowEngine.processLead(lead);

    console.log('\n✅ Flow Execution Finished.');
}

runTest().catch(e => console.error('❌ Test Failed:', e));
