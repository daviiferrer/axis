const { createContainer, asClass, asValue, asFunction, InjectionMode, Lifetime } = require('awilix');
const logger = require('./shared/Logger').createModuleLogger('di-container');

// --- Infrastructure ---
const RedisLockClient = require('./infra/clients/RedisLockClient');
const { SupabaseClientFactory } = require('./infra/database/SupabaseClientFactory');
const WahaClient = require('./infra/clients/WahaClient');
const GeminiClient = require('./infra/clients/GeminiClient');
const RagClient = require('./infra/clients/RagClient');

// --- Services ---
const CompanyService = require('./core/services/system/CompanyService');
const ChatService = require('./core/services/chat/ChatService');
const SettingsService = require('./core/services/system/SettingsService');
const ConfigService = require('./core/services/system/ConfigService'); // [NEW]
const BillingService = require('./core/services/billing/BillingService');
const CampaignService = require('./core/services/campaign/CampaignService');
const LeadService = require('./core/services/campaign/LeadService');
const HistoryService = require('./core/services/chat/HistoryService');
const EmotionalStateService = require('./core/services/ai/EmotionalStateService');
const GuardrailService = require('./core/services/guardrails/GuardrailService');
const PromptService = require('./core/services/ai/PromptService');
const CsvParserService = require('./core/services/system/CsvParserService');
const HealthService = require('./core/services/system/HealthService');
const AnalyticsService = require('./core/services/analytics/AnalyticsService');
const DashboardService = require('./core/services/analytics/DashboardService');
const SchedulingService = require('./core/services/scheduling/SchedulingService');
const EmbeddingService = require('./core/services/rag/EmbeddingService');
const HybridSearchService = require('./core/services/rag/HybridSearchService');

// --- Controllers ---
const SettingsController = require('./api/controllers/system/SettingsController');
const UserParamsController = require('./api/controllers/system/UserParamsController');
const AnalyticsController = require('./api/controllers/analytics/AnalyticsController');
const DashboardController = require('./api/controllers/analytics/DashboardController');
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
const SchedulingController = require('./api/controllers/scheduling/SchedulingController');

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
const StateCheckpointService = require('./core/services/workflow/StateCheckpointService');

const container = createContainer({
    injectionMode: InjectionMode.PROXY
});

function configureContainer() {
    container.register({
        // 1. Configuration (Values)
        systemConfig: asValue({
            wahaUrl: process.env.WAHA_API_URL || 'http://localhost:3000',
            apiKey: process.env.WAHA_API_KEY || '',
            redisUrl: process.env.REDIS_URL,
            nodeEnv: process.env.NODE_ENV || 'development'
        }),

        // 2. Infrastructure
        supabaseClientFactory: asClass(SupabaseClientFactory).singleton(),

        // Admin Client (Singleton)
        supabaseAdmin: asFunction(({ supabaseClientFactory }) => {
            return supabaseClientFactory.createAdminClient();
        }).singleton(),

        wahaClient: asClass(WahaClient).singleton().inject((c) => ({
            configService: c.configService
        })),

        // Gemini & RAG
        geminiClient: asClass(GeminiClient).singleton(),
        ragClient: asClass(RagClient).singleton(),

        // Distributed Locking (for multi-instance scalability)
        redisLockClient: asClass(RedisLockClient).singleton(),

        // 3. Core Services (Scoped by default for user context isolation if needed)
        // If they are strictly stateless, singleton is fine, but Scoped is safer for future context.
        companyService: asClass(CompanyService).scoped(),
        chatService: asClass(ChatService).scoped(),
        settingsService: asClass(SettingsService).scoped(),
        configService: asClass(ConfigService).singleton().inject((c) => ({
            supabaseClient: c.supabaseClient
        })),
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

        // Durable Execution Services
        stateCheckpointService: asClass(StateCheckpointService).singleton(),

        // System & Analytics
        healthService: asClass(HealthService).singleton(),
        analyticsService: asClass(AnalyticsService).scoped(),
        dashboardService: asClass(DashboardService).scoped(),
        schedulingService: asClass(SchedulingService).scoped(),

        // RAG Services (optional - disabled without API keys)
        embeddingService: asClass(EmbeddingService).singleton().inject((c) => ({
            settingsService: c.settingsService,
            systemConfig: c.systemConfig
        })),
        hybridSearchService: asClass(HybridSearchService).singleton(),

        // Singletons (Stateful/Global)
        // Singletons (Stateful/Global)
        socketService: asValue(SocketService),
        campaignSocket: asValue(SocketService), // Alias for AgentNode

        // Engines
        // WorkflowEngine needs many deps.
        nodeFactory: asClass(NodeFactory).singleton(),
        // QueueService might be Infrastructure or Core. Assuming Singleton.
        queueService: asClass(QueueService).singleton(),

        // ARCHITECTURE NOTE: WorkflowEngine is a Singleton running in background (God Mode).
        // It injects 'leadService' (Scoped), which in turn injects 'supabaseClient' (Singleton Admin).
        // This is safe for background processing as it bypasses RLS.
        // BEWARE: Do not inject 'req.scoped' services that rely on 'req.user' here.
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
        // 4. Controllers (Registered as PROXY by default in this container)
        settingsController: asClass(SettingsController),
        userParamsController: asClass(UserParamsController),
        analyticsController: asClass(AnalyticsController),
        dashboardController: asClass(DashboardController),
        schedulingController: asClass(SchedulingController),
        adminController: asClass(AdminController),
        campaignController: asClass(CampaignController),
        oracleController: asClass(OracleController),
        leadController: asClass(LeadController),
        apifyController: asClass(ApifyController),
        apifyWebhookHandler: asClass(ApifyWebhookHandler),
        webhookController: asClass(WebhookController),
        agentController: asClass(AgentController),
        prospectController: asClass(ProspectController),
        chatController: asClass(ChatController),
        healthController: asClass(HealthController),
        billingController: asClass(BillingController),
        companyController: asClass(CompanyController),

        // WAHA Controllers
        wahaSessionController: asClass(WahaSessionController).inject((c) => ({
            configService: c.configService
        })),
        wahaAuthController: asClass(WahaAuthController),
        wahaProfileController: asClass(WahaProfileController),
        wahaChattingController: asClass(WahaChattingController),
        wahaPresenceController: asClass(WahaPresenceController),
        wahaMediaController: asClass(WahaMediaController),
        wahaObservabilityController: asClass(WahaObservabilityController),
        wahaScreenshotController: asClass(WahaScreenshotController),

        // Factories
        llmFactory: asClass(require('./core/factories/LlmFactory')).scoped(),
    });

    logger.info('✅ DI Container configured with Core Services.');
    return container;
}

module.exports = { configureContainer };
