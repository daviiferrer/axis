const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { createClient } = require('@supabase/supabase-js');
const WahaClient = require(path.join(__dirname, '../src/infra/clients/WahaClient'));
const GeminiClient = require(path.join(__dirname, '../src/infra/clients/GeminiClient'));
const WorkflowEngine = require(path.join(__dirname, '../src/core/engines/workflow/WorkflowEngine'));
const NodeFactory = require(path.join(__dirname, '../src/core/engines/workflow/NodeFactory'));
const LeadService = require(path.join(__dirname, '../src/core/services/campaign/LeadService'));
const CampaignService = require(path.join(__dirname, '../src/core/services/campaign/CampaignService'));
const ChatService = require(path.join(__dirname, '../src/core/services/chat/ChatService'));
const BillingService = require(path.join(__dirname, '../src/core/services/billing/BillingService'));
const SettingsService = require(path.join(__dirname, '../src/core/services/system/SettingsService'));
const HistoryService = require(path.join(__dirname, '../src/core/services/chat/HistoryService'));
const PromptService = require(path.join(__dirname, '../src/core/services/ai/PromptService'));
const RagClient = require(path.join(__dirname, '../src/infra/clients/RagClient'));
const EmotionalStateService = require(path.join(__dirname, '../src/core/services/ai/EmotionalStateService'));
// GuardrailService imported dynamically below

async function runComplexVerification() {
    console.log('🚀 Starting COMPLEX Flow Verification...');

    // 1. Config & Connections
    const sbUrl = process.env.SUPABASE_URL;
    const sbKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;
    if (!sbUrl || !sbKey) throw new Error('Missing Supabase Config');

    const supabase = createClient(sbUrl, sbKey);
    console.log('✅ Supabase Connected');

    const settingsService = new SettingsService(supabase);
    const settings = await settingsService.getSettings();
    const wahaUrl = settings?.waha_url || process.env.WAHA_URL || 'http://localhost:3000';
    const geminiKey = settings?.gemini_key || process.env.GEMINI_API_KEY;
    if (!geminiKey) throw new Error('Missing Gemini Key');

    // 2. Services Initialization
    // Use REAL WahaClient (User said they are turning it on)
    const wahaClient = new WahaClient({ wahaUrl });

    // GeminiClient with configured default model (from DB or env)
    const defaultGeminiModel = settings?.default_gemini_model || process.env.DEFAULT_GEMINI_MODEL;
    const geminiClient = new GeminiClient(geminiKey, { defaultModel: defaultGeminiModel });
    const ragClient = new RagClient(supabase, geminiClient);
    const historyService = new HistoryService(supabase);
    const billingService = new BillingService(supabase);
    const leadService = new LeadService(supabase);
    const campaignService = new CampaignService(supabase);
    const promptService = new PromptService(supabase, ragClient, historyService);
    const emotionalStateService = new EmotionalStateService(supabase);

    // Mock or Real Guardrail (Let's use a passthrough if file not found, but try require)
    let guardrailService;
    try {
        const RealGuardrail = require(path.join(__dirname, '../src/core/services/guardrails/GuardrailService'));
        guardrailService = new RealGuardrail(supabase);
    } catch (e) {
        console.log('⚠️ GuardrailService not found, using Mock');
        guardrailService = { process: (text) => text };
    }

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
        analyticsService: { logEvent: (ev) => console.log(`📊 [Analytics] ${ev}`) },
        billingService,
        cacheService: { get: () => null, set: () => null, isComposing: () => false }, // Mock Cache
        campaignSocket: {
            emit: (ev, data) => console.log(`🔌 [Socket] ${ev}`, data),
            emitLeadUpdate: (id, data) => console.log(`🔌 [Socket] Lead Update: ${id}`, data)
        }
    };

    const nodeFactory = new NodeFactory(dependencies);
    const workflowEngine = new WorkflowEngine({
        nodeFactory,
        leadService,
        campaignService,
        supabase,
        campaignSocket: dependencies.campaignSocket
    });

    // 3. Setup TEST DATA (The "Rich Context")
    console.log('\n🛠️  Setting up Test Campaign with Rich Context...');

    // Define the Strategy Graph (Lead Entry -> Qualification -> Delay -> Logic -> Branch)
    const complexGraph = {
        nodes: [
            { id: 'start', type: 'leadEntry', data: {} },
            {
                id: 'qualify_lead',
                type: 'qualification',
                data: {
                    stepName: 'Qualificação Inicial',
                    // model: 'gemini-3-flash-preview', // Removed to use Agent default (gemini-3.5-preview)
                    systemPrompt: 'Você é Sofia, SDR. Pergunte educadamente sobre o papel do lead e desafios de prospecção. Use SPIN Selling.',
                    criticalSlots: ['role', 'challenge', 'timeline']
                }
            },
            {
                id: 'wait_reply',
                type: 'delay',
                data: { duration: 5, description: 'Esperando resposta...' }
            },
            {
                id: 'check_reply',
                type: 'logic',
                data: { condition: 'has_replied', description: 'Lead respondeu?' }
            },
            {
                id: 'closure',
                type: 'closing',
                data: { stepName: 'Agendamento' }
            },
            {
                id: 'nudge',
                type: 'agentic',
                data: { stepName: 'Nudge (Cobrança)', systemPrompt: 'O lead não respondeu. Mande um alô.' }
            }
        ],
        edges: [
            { source: 'start', target: 'qualify_lead' },
            { source: 'qualify_lead', target: 'wait_reply' },
            { source: 'wait_reply', target: 'check_reply' },
            { source: 'check_reply', target: 'closure', label: 'true' },
            { source: 'check_reply', target: 'nudge', label: 'false' },
            { source: 'nudge', target: 'wait_reply' } // Loop back check
        ]
    };

    // 3. Setup TEST DATA
    console.log('\n🛠️  Setting up Test Campaign...');

    // Authenticate as Test User to pass RLS (Robust/Fallback mode)
    let validUserId = '1181d724-0036-4295-9bcd-9e3997b9f2e6'; // Default Fallback
    try {
        const testEmail = 'luisdaviferrer@gmail.com';
        const testPassword = 'Cucucu321@';
        console.log(`   Authenticating as ${testEmail}...`);

        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: testEmail,
            password: testPassword
        });

        if (!signInError && signInData.session) {
            validUserId = signInData.user.id;
            // console.log('   ✅ Logged in.');
        } else {
            // Try Sign Up if Login failed
            const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                email: testEmail,
                password: testPassword
            });
            if (signUpData?.user) validUserId = signUpData.user.id;
        }
    } catch (e) {
        console.warn('   ⚠️ Auth/RLS skipped (using fallback ID). If writes fail, check Supabase Settings.');
    }
    console.log('   Using User ID:', validUserId);

    // 3a. Setup Campaign
    let campaign;
    const { data: existing } = await supabase.from('campaigns').select('*, agents(*)').eq('name', 'Verificação Fluxo Real (Script)').limit(1).maybeSingle();

    if (existing) {
        console.log('   Using existing campaign.');
        campaign = existing;
    } else {
        console.error('❌ Campaign not found and cannot create (RLS). Please contact Admin to seed data.');
        throw new Error('RLS Blocked Campaign Creation');
    }
    console.log(`   Campaign ID: ${campaign.id}`);
    campaign.user_id = validUserId; // Standardize user_id from auth context

    // 3b. Setup Product (Prospecção Fria 3.0)
    console.log('   Checking Product context...');
    let product;
    // Check if product exists for this user
    const { data: existingProd, error: prodError } = await supabase.from('products')
        .select('*').eq('user_id', validUserId).ilike('name', '%Prospecção Fria%').limit(1).maybeSingle();

    if (existingProd) {
        console.log('   Using existing Product:', existingProd.name);
        product = existingProd;
    } else {
        console.log('   Creating Test Product...');
        // Note: This insert might fail due to RLS if running as Anon without Service Key.
        // We will try/catch and warn.
        try {
            const { data: newProd, error: createProdError } = await supabase.from('products').insert({
                user_id: validUserId,
                name: 'Prospecção Fria 3.0',
                description: 'Plataforma completa de automação de prospecção com IA, Waha e Supabase.',
                price: 297.00,
                currency: 'BRL'
            }).select().single();

            if (createProdError) throw createProdError;
            product = newProd;
        } catch (err) {
            console.error('⚠️ Failed to create Product (Likely RLS). Using Mock Object for Context.');
            console.error('   Hint: Add SUPABASE_SERVICE_KEY to .env to fix database write permissions.');
            product = {
                name: 'Prospecção Fria 3.0 (Mock)',
                description: 'Plataforma completa de automação de prospecção com IA.'
            };
        }
    }

    // Agents
    console.log('   Configuring Agent...');
    // We already fetched agents with campaign, but let's double check or use that one.
    const existingAgent = campaign.agents?.[0] || (Array.isArray(campaign.agents) ? null : campaign.agents);

    if (existingAgent) {
        console.log(`   Using existing Agent: ${existingAgent.name} (Model: ${existingAgent.model})`);
        // Do NOT update. User wants to use the existing record exactly as is.
    } else {
        console.log('   Creating NEW Agent (Target Model: gemini-3.5-preview)...');
        await supabase.from('agents').insert({
            campaign_id: campaign.id,
            name: 'Sofia - SDR',
            model: 'gemini-3.5-preview',
            tone: 'Profissional',
            personality: 'Expert',
            product_context: 'Plataforma Prospecção Fria 3.0',
            goals: 'Vender',
            language: 'pt-BR'
        });
    }

    // 4. Setup Lead
    const targetPhone = '5518998232124';
    console.log(`\n👤 Preparing Lead: ${targetPhone}`);

    let { data: lead } = await supabase.from('campaign_leads').select('*').eq('phone', targetPhone).eq('campaign_id', campaign.id).single();

    if (lead) {
        console.log('   Using existing Lead.');
    } else {
        console.error('❌ Lead not found and cannot create (RLS). Please contact Admin to seed data.');
        throw new Error('RLS Blocked Lead Creation');
    }

    // 5. Trigger
    console.log('\n▶️  Executing Workflow...');
    await workflowEngine.processLead(lead, campaign);

    console.log('\n✅ Workflow Execution Cycle Completed.');
    console.log('   Check WhatsApp for message from "Sofia".');
}

runComplexVerification().catch(e => console.error('❌ Failed:', e));
