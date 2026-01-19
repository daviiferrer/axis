const path = require('path');
const dotenv = require('dotenv');

// 1. CRITICAL: Load Root Environment Variables FIRST
// This matches user requirement: "pick from the root env folder"
const rootEnvPath = path.resolve(__dirname, '../../../../.env'); // Adjusted for where server.js is? No: server.js is in backend/src. 
// __dirname = backend/src. 
// ../ = backend
// ../../ = ÁXIS
// So path is ../../.env
const correctRootEnvPath = path.resolve(__dirname, '../../.env');

const result = dotenv.config({ path: correctRootEnvPath });

if (result.error) {
    console.error(`❌ [Server] CRITICAL: Could not load root .env file at: ${correctRootEnvPath}`);
    // Do not crash, maybe they are in process.env already (e.g. docker)
} else {
    console.log(`✅ [Server] Loaded root .env from: ${correctRootEnvPath}`);
}

// 2. VALIDATE Loaded Credentials
const sbUrl = process.env.SUPABASE_URL;
let sbKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;

if (sbKey) sbKey = sbKey.trim(); // SAFETY: Remove accidental whitespace

if (!sbUrl || !sbKey) {
    console.error('❌❌❌ CRITICAL: SUPABASE CREDENTIALS MISSING ❌❌❌');
    console.error('SUPABASE_URL:', sbUrl || 'UNDEFINED');
    console.error('SUPABASE_KEY:', sbKey ? 'EXISTS' : 'UNDEFINED');
    console.error('Tried loading from:', correctRootEnvPath);
    console.error('Current working directory:', process.cwd());
    throw new Error('SUPABASE CREDENTIALS MISSING - Cannot start server');
}

console.log('--- ENV VALIDATION ---');
console.log(`✅ SUPABASE_URL: ${sbUrl}`);
console.log(`✅ SUPABASE_KEY: ${sbKey.substring(0, 20)}...`);
console.log(`✅ Key Length: ${sbKey.length} chars`);
console.log('----------------------');

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

// --- Infrastructure ---
const WahaClient = require('./infra/clients/WahaClient');
const GeminiClient = require('./infra/clients/GeminiClient');
const RagClient = require('./infra/clients/RagClient');

// --- Core Services ---
const SettingsService = require('./core/services/system/SettingsService');
const CacheService = require('./core/services/system/CacheService');
const HistoryService = require('./core/services/chat/HistoryService');
const ChatService = require('./core/services/chat/ChatService');
const PresenceService = require('./core/services/automation/PresenceService');
const TriggerService = require('./core/services/automation/TriggerService');
const CampaignService = require('./core/services/campaign/CampaignService');
const LeadService = require('./core/services/campaign/LeadService');
const PromptService = require('./core/services/ai/PromptService');
const HealthService = require('./core/services/system/HealthService');

const WorkflowEngine = require('./core/engines/workflow/WorkflowEngine');
const NodeFactory = require('./core/engines/workflow/NodeFactory');
const AgentGraphEngine = require('./core/engines/graph/AgentGraphEngine');
const AgentService = require('./core/services/agents/AgentService');
const EmotionalStateService = require('./core/services/ai/EmotionalStateService');
const AnalyticsController = require('./api/controllers/analytics/AnalyticsController');

// --- Shared ---
const socketService = require('./shared/SocketService');

// --- API: Controllers ---
const SettingsController = require('./api/controllers/system/SettingsController');
const AdminController = require('./api/controllers/system/AdminController');
const CampaignController = require('./api/controllers/campaign/CampaignController');

const OracleController = require('./api/controllers/chat/OracleController');
const LeadController = require('./api/controllers/campaign/LeadController');
const ApifyController = require('./api/controllers/apify/ApifyController');
const ApifyWebhookHandler = require('./api/controllers/apify/ApifyWebhookHandler');
const HealthController = require('./api/controllers/system/HealthController');

// --- API: Routes ---
const WebhookController = require('./api/controllers/chat/WebhookController');
const AgentController = require('./api/controllers/agents/AgentController');
const ProspectController = require('./api/controllers/campaign/ProspectController');
const ChatController = require('./api/controllers/chat/ChatController');
const createRouter = require('./api/router');

async function bootstrap() {
    const app = express();
    const server = http.createServer(app);
    const io = new Server(server, {
        cors: { origin: "*", methods: ["GET", "POST"] }
    });

    // 1. Initialize DB Client
    const supabase = require('./infra/database/supabase');

    // DEBUG: Verify client structure
    console.log(`[Server] Supabase client created.`);
    console.log(`[Server] typeof supabase.from: ${typeof supabase.from}`);

    if (typeof supabase.from !== 'function') {
        console.error('CRITICAL: Supabase client is malformed. Keys:', Object.keys(supabase));
        process.exit(1);
    }

    // DIAGNOSTIC: Test Connectivity immediately
    try {
        console.log('Testing Supabase connectivity...');
        const { data, error } = await supabase.from('chats').select('id').limit(1);
        if (error) {
            console.error('❌ [Startup] Supabase Connection FAILED:', error.message);
        } else {
            console.log('✅ [Startup] Supabase Connection OK');
        }
    } catch (e) {
        console.error('❌ [Startup] Supabase Connection EXCEPTION:', e.message);
        console.error('Cause:', e.cause);
    }

    // 2. Initialize Shared & Services (Pre-Client)
    const settingsService = new SettingsService(supabase);

    // 3. Fetch Dynamic Configuration
    console.log('🔄 [Server] Fetching system settings from Supabase...');
    let systemSettings;
    try {
        systemSettings = await settingsService.getSettings();
        if (!systemSettings) {
            console.warn('⚠️ [Server] WARNING: No system settings found in DB. Using defaults/env where possible.');
        } else {
            console.log('✅ [Server] System settings loaded.');
        }
    } catch (e) {
        console.error('❌ [Server] Failed to fetch settings from DB:', e.message);
    }

    // Set NODE_ENV for middlewares to use - DEFAULT TO development
    process.env.NODE_ENV = (systemSettings?.active_env === 'prod') ? 'production' : 'development';
    console.log(`📡 [Server] System-wide NODE_ENV set to: ${process.env.NODE_ENV}`);

    const wahaUrl = systemSettings?.waha_url || process.env.WAHA_API_URL || 'http://localhost:3000';

    // Key Retrieval Strategy: DB > ENV
    const geminiKey = systemSettings?.gemini_api_key || process.env.GEMINI_API_KEY;

    if (!geminiKey) {
        console.warn('⚠️ [Server] Gemini API Key is missing in BOTH DB and ENV. AI features will fail.');
    } else {
        console.log(`✅ [Server] Gemini API Key loaded (${systemSettings?.gemini_api_key ? 'DB' : 'ENV'}).`);
        process.env.GEMINI_API_KEY = geminiKey;
    }

    // 4. Wrap Infrastructure
    // WahaClient expects { wahaUrl } in first arg
    const wahaClient = new WahaClient({ wahaUrl });

    // GeminiClient configuration
    // Default model is NOT set globally. Must be provided per request or agent config.
    const geminiClient = new GeminiClient(geminiKey, { defaultModel: undefined });
    const ragClient = new RagClient(supabase, geminiClient);

    // 3. Initialize Shared
    socketService.initialize(io);

    // 4. Initialize Core Services (settingsService already initialized)
    // Initialize Queue Service & Workers
    const QueueService = require('./core/services/queue/QueueService');
    const queueService = new QueueService(process.env.REDIS_URL, supabase);
    await queueService.initialize();

    // Register Scrape Worker
    // Register Scrape Worker
    // Initialize Orchestrator with Settings
    const ScraperOrchestrator = require('./core/services/extraction/ScraperOrchestrator');
    const scraperOrchestrator = new ScraperOrchestrator(settingsService);

    const createScrapeWorker = require('./workers/ScrapeWorker');
    const scrapeWorker = createScrapeWorker(scraperOrchestrator);
    queueService.registerWorker('scrape-requests', scrapeWorker);

    const cacheService = new CacheService();
    const BillingService = require('./core/services/billing/BillingService');
    const billingService = new BillingService(supabase);

    const historyService = new HistoryService(supabase);
    const chatService = new ChatService(supabase, billingService, wahaClient, settingsService);
    const leadService = new LeadService(supabase);
    const campaignService = new CampaignService(supabase);
    const promptService = new PromptService(supabase, ragClient, historyService);
    const healthService = new HealthService();

    const WebContentService = require('./core/services/extraction/WebContentService');
    const webContentService = new WebContentService(supabase, queueService);

    const JidNormalizationService = require('./core/services/waha/JidNormalizationService');
    const jidService = new JidNormalizationService(wahaClient, supabase);

    const presenceService = new PresenceService(supabase, wahaClient);
    const triggerService = new TriggerService(geminiClient, socketService);
    const AgentService = require('./core/services/agents/AgentService');
    const agentService = new AgentService(supabase);

    const AnalyticsService = require('./core/services/analytics/AnalyticsService');
    const analyticsService = new AnalyticsService(supabase);

    const GuardrailService = require('./core/services/guardrails/GuardrailService');
    const guardrailService = new GuardrailService(supabase);

    // ModelService - Centralizado para busca de modelo
    const ModelService = require('./core/services/ai/ModelService');
    const modelService = new ModelService(supabase);

    const emotionalStateService = new EmotionalStateService(supabase);

    // 5. Initialize Engines
    const dependencies = {
        supabase,
        wahaClient,
        geminiClient,
        promptService,
        historyService,
        leadService,
        campaignService,
        chatService,
        analyticsService,
        billingService,
        cacheService,
        guardrailService,
        modelService, // Serviço centralizado de modelo
        emotionalStateService, // Missing dependency fix
        agentService,
        jidService,
        campaignSocket: socketService
    };

    const nodeFactory = new NodeFactory(dependencies);
    const workflowEngine = new WorkflowEngine({
        nodeFactory,
        leadService,
        campaignService,
        supabase,
        campaignSocket: socketService,
        queueService // INJECTED: Fixes sync processing issue
    });
    const agentGraphEngine = new AgentGraphEngine(geminiClient);

    // 6. Initialize All Controllers
    const controllers = {
        settingsController: new SettingsController(settingsService, wahaClient),
        analyticsController: new AnalyticsController(analyticsService),
        adminController: new AdminController(supabase, wahaClient),
        campaignController: new CampaignController(campaignService, supabase),
        oracleController: new OracleController(geminiClient, historyService, modelService),
        leadController: new LeadController(workflowEngine, leadService),
        apifyController: new ApifyController(supabase, settingsService),
        apifyWebhookHandler: new ApifyWebhookHandler(supabase, triggerService),
        webhookController: new WebhookController(chatService, workflowEngine, socketService, wahaClient, supabase, jidService),
        agentController: new AgentController(agentService, geminiClient, agentGraphEngine),
        prospectController: new ProspectController(null, leadService, supabase),
        chatController: new ChatController(chatService, wahaClient, historyService, geminiClient, modelService),
        healthController: new HealthController(healthService),
        billingController: new (require('./api/controllers/billing/BillingController'))(billingService),
        workflowEngine: workflowEngine,
        chatService: chatService,
        wahaClient: wahaClient,
        // Expose for Router Injection if needed

        // WAHA Domain Controllers
        wahaSessionController: new (require('./api/controllers/waha/WahaSessionController'))(wahaClient, supabase),
        wahaAuthController: new (require('./api/controllers/waha/WahaAuthController'))(wahaClient),
        wahaProfileController: new (require('./api/controllers/waha/WahaProfileController'))(wahaClient),
        wahaChattingController: new (require('./api/controllers/waha/WahaChattingController'))(wahaClient, supabase),
        wahaPresenceController: new (require('./api/controllers/waha/WahaPresenceController'))(wahaClient),
        wahaMediaController: new (require('./api/controllers/waha/WahaMediaController'))(wahaClient),
        wahaObservabilityController: new (require('./api/controllers/waha/WahaObservabilityController'))(wahaClient),
        wahaScreenshotController: new (require('./api/controllers/waha/WahaScreenshotController'))(wahaClient),

        // System Controllers
        companyController: new (require('./api/controllers/system/CompanyController'))(new (require('./core/services/system/CompanyService'))(supabase))
    };

    // 7. Middlewares
    app.use(cors());
    app.use(express.json());

    const createAuthMiddleware = require('./api/middlewares/authMiddleware');
    const authMiddleware = createAuthMiddleware(supabase);

    const createRiskMiddleware = require('./api/middlewares/riskMiddleware');
    const riskMiddleware = createRiskMiddleware(supabase);

    // 7.5 Trace Context Middleware (Observability)
    const traceMiddleware = require('./api/middleware/traceMiddleware');
    app.use(traceMiddleware);

    // Add authMiddleware to controllers/dependencies object to pass to router
    controllers.authMiddleware = authMiddleware;
    controllers.riskMiddleware = riskMiddleware;

    // 8. Routes
    const router = createRouter(controllers);
    app.use('/api', router);

    // 9. Global Error Middleware (Safety Net)
    app.use((err, req, res, next) => {
        console.error('🔥 [Global Error Handler]', err);
        const statusCode = err.statusCode || 500;
        res.status(statusCode).json({
            error: true,
            message: err.message || 'Internal Server Error',
            code: err.code || 'INTERNAL_ERROR',
            // Omit stack trace in production for security
            stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
        });
    });

    // 10. Startup Logic
    presenceService.startPeriodicSync(300000); // 5 min

    const PORT = process.env.PORT || 3001;
    server.listen(PORT, () => {
        console.log(`
🚀 ÁXIS SERVER STARTED IN MODULAR MODE
📍 Port: ${PORT}
🛠️  WAHA: ${wahaUrl}
🧠  Gemini: ${process.env.GEMINI_API_KEY ? 'CONNECTED' : 'MISSING'}
        `);
    });

    // Handle Graceful Shutdown
    const shutdown = async () => {
        console.log('🛑 SIGTERM/SIGINT received. Shutting down...');

        // Stop periodic tasks
        presenceService.stopPeriodicSync();

        // Close Queue connections
        await queueService.shutdown();

        // Close Server
        server.close(() => {
            console.log('✅ HTTP Server closed.');
            process.exit(0);
        });

        // Force close if hangs
        setTimeout(() => {
            console.error('⚠️ Could not close connections in time, forcefully shutting down');
            process.exit(1);
        }, 10000);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
}

bootstrap().catch(err => {
    console.error('CRITICAL: Server failed to bootstrap:', err);
    process.exit(1);
});
