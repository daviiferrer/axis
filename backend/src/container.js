const { createContainer, asClass, asValue, asFunction, InjectionMode, Lifetime } = require('awilix');
const logger = require('./shared/Logger').createModuleLogger('di-container');

// --- Infrastructure ---
const { SupabaseClientFactory } = require('./infra/database/SupabaseClientFactory');
const WahaClient = require('./infra/clients/WahaClient');
const GeminiClient = require('./infra/clients/GeminiClient');
const RagClient = require('./infra/clients/RagClient');

// --- Services ---
const CompanyService = require('./core/services/system/CompanyService');
const ChatService = require('./core/services/chat/ChatService');
const SettingsService = require('./core/services/system/SettingsService');
const BillingService = require('./core/services/billing/BillingService');
const CampaignService = require('./core/services/campaign/CampaignService');
const LeadService = require('./core/services/campaign/LeadService');
const HistoryService = require('./core/services/chat/HistoryService');
const EmotionalStateService = require('./core/services/ai/EmotionalStateService');
const GuardrailService = require('./core/services/guardrails/GuardrailService');
const PromptService = require('./core/services/ai/PromptService');
const CsvParserService = require('./core/services/system/CsvParserService');

// --- Controllers ---
const SettingsController = require('./api/controllers/system/SettingsController');
const AnalyticsController = require('./api/controllers/analytics/AnalyticsController');
const AdminController = require('./api/controllers/system/AdminController');
const CampaignController = require('./api/controllers/campaign/CampaignController');
const OracleController = require('./api/controllers/chat/OracleController');
const LeadController = require('./api/controllers/campaign/LeadController');
const ApifyController = require('./api/controllers/apify/ApifyController');
const ApifyWebhookHandler = require('./api/controllers/apify/ApifyWebhookHandler');
const WebhookController = require('./api/controllers/chat/WebhookController');
const AgentController = require('./api/controllers/agents/AgentController');
const ProspectController = require('./api/controllers/campaign/ProspectController');
const ChatController = require('./api/controllers/chat/ChatController');
const HealthController = require('./api/controllers/system/HealthController');
const BillingController = require('./api/controllers/billing/BillingController');
const WahaSessionController = require('./api/controllers/waha/WahaSessionController');
const WahaAuthController = require('./api/controllers/waha/WahaAuthController');
const WahaProfileController = require('./api/controllers/waha/WahaProfileController');
const WahaChattingController = require('./api/controllers/waha/WahaChattingController');
const WahaPresenceController = require('./api/controllers/waha/WahaPresenceController');
const WahaMediaController = require('./api/controllers/waha/WahaMediaController');
const WahaObservabilityController = require('./api/controllers/waha/WahaObservabilityController');
const WahaScreenshotController = require('./api/controllers/waha/WahaScreenshotController');
const CompanyController = require('./api/controllers/system/CompanyController');

// --- Engines ---
const WorkflowEngine = require('./core/engines/workflow/WorkflowEngine');
// TriggerService, etc needed for WebhookController
const TriggerService = require('./core/services/automation/TriggerService');
const JidNormalizationService = require('./core/services/waha/JidNormalizationService');
const AgentService = require('./core/services/agents/AgentService');
const AgentGraphEngine = require('./core/engines/graph/AgentGraphEngine');
const ModelService = require('./core/services/ai/ModelService');
const SocketService = require('./shared/SocketService');
const NodeFactory = require('./core/engines/workflow/NodeFactory');
const QueueService = require('./core/services/queue/QueueService');

const container = createContainer({
    injectionMode: InjectionMode.PROXY
});

function configureContainer() {
    container.register({
        // 1. Configuration (Values)
        systemConfig: asValue({
            wahaUrl: process.env.WAHA_API_URL || 'http://localhost:3000',
            geminiKey: process.env.GEMINI_API_KEY,
            redisUrl: process.env.REDIS_URL,
            nodeEnv: process.env.NODE_ENV || 'development'
        }),

        // 2. Infrastructure
        supabaseClientFactory: asClass(SupabaseClientFactory).singleton(),

        // Admin Client (Singleton)
        supabaseAdmin: asFunction(({ supabaseClientFactory }) => {
            return supabaseClientFactory.createAdminClient();
        }).singleton(),

        wahaClient: asClass(WahaClient).singleton(),

        // Gemini & RAG
        geminiClient: asClass(GeminiClient).singleton(),
        ragClient: asClass(RagClient).singleton(),

        // 3. Core Services (Scoped by default for user context isolation if needed)
        // If they are strictly stateless, singleton is fine, but Scoped is safer for future context.
        companyService: asClass(CompanyService).scoped(),
        chatService: asClass(ChatService).scoped(),
        settingsService: asClass(SettingsService).scoped(),
        billingService: asClass(BillingService).scoped(),
        campaignService: asClass(CampaignService).scoped(),
        leadService: asClass(LeadService).scoped(),
        historyService: asClass(HistoryService).scoped(),
        agentService: asClass(AgentService).scoped(),
        triggerService: asClass(TriggerService).scoped(),
        jidService: asClass(JidNormalizationService).scoped(),
        modelService: asClass(ModelService).scoped(),
        promptService: asClass(PromptService).scoped(),
        csvParserService: asClass(CsvParserService).singleton(),
        emotionalStateService: asClass(EmotionalStateService).singleton(),
        guardrailService: asClass(GuardrailService).singleton(),

        // Singletons (Stateful/Global)
        // Singletons (Stateful/Global)
        socketService: asValue(SocketService),
        campaignSocket: asValue(SocketService), // Alias for AgentNode

        // Engines
        // WorkflowEngine needs many deps.
        nodeFactory: asClass(NodeFactory).singleton(),
        // QueueService might be Infrastructure or Core. Assuming Singleton.
        queueService: asClass(QueueService).singleton(),
        workflowEngine: asClass(WorkflowEngine).singleton(),
        agentGraphEngine: asClass(AgentGraphEngine).singleton(),

        // GLOBAL ALIAS for Singletons that strictly need an admin client (like Engines)
        // This is a tradeoff. Engines run globally, so they get the Admin details.
        // User requests will override 'supabaseClient' in the scope.
        // But for the ROOT container resolution, we map it to admin.
        supabaseClient: asFunction(({ supabaseAdmin }) => supabaseAdmin).singleton(),

        // ALIAS: 'supabase' -> 'supabaseClient'
        // Many controllers (Classic mode) ask for 'supabase' in constructor.
        // This provides the correct scoped client to them.
        supabase: asFunction(({ supabaseClient }) => supabaseClient).scoped(),

        // 4. Controllers (Registered as CLASSIC because they use positional args currently)
        settingsController: asClass(SettingsController).classic(),
        analyticsController: asClass(AnalyticsController).classic(),
        adminController: asClass(AdminController).classic(),
        campaignController: asClass(CampaignController).classic(),
        oracleController: asClass(OracleController).classic(),
        leadController: asClass(LeadController).classic(),
        apifyController: asClass(ApifyController).classic(),
        apifyWebhookHandler: asClass(ApifyWebhookHandler).classic(),
        webhookController: asClass(WebhookController).classic(),
        agentController: asClass(AgentController).classic(),
        prospectController: asClass(ProspectController).classic(),
        chatController: asClass(ChatController).classic(),
        healthController: asClass(HealthController).classic(),
        billingController: asClass(BillingController).classic(),
        companyController: asClass(CompanyController).classic(),

        // WAHA Controllers
        wahaSessionController: asClass(WahaSessionController).classic(),
        wahaAuthController: asClass(WahaAuthController).classic(),
        wahaProfileController: asClass(WahaProfileController).classic(),
        wahaChattingController: asClass(WahaChattingController).classic(),
        wahaPresenceController: asClass(WahaPresenceController).classic(),
        wahaMediaController: asClass(WahaMediaController).classic(),
        wahaObservabilityController: asClass(WahaObservabilityController).classic(),
        wahaScreenshotController: asClass(WahaScreenshotController).classic(),

        // Factories
        llmFactory: asClass(require('./core/factories/LlmFactory')).scoped(),
    });

    logger.info('✅ DI Container configured with Core Services.');
    return container;
}

module.exports = { configureContainer };
