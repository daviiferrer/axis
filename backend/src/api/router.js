const express = require('express');
const riskMiddleware = require('./middlewares/riskMiddleware');

function createRouter(controllers) {
    const router = express.Router();
    const v1Router = express.Router();

    const {
        campaignController,
        agentController,
        leadController,
        chatController,
        prospectController,
        settingsController,
        webhookController,
        adminController,
        healthController,
        analyticsController,
        billingController,
        apifyController,
        apifyWebhookHandler,
        workflowEngine,
        chatService,
        wahaClient,
        authMiddleware
    } = controllers;

    // Resource Routes
    v1Router.use('/campaigns', authMiddleware, require('./routes/v1/campaign/campaign.routes')(campaignController, authMiddleware, riskMiddleware));
    v1Router.use('/agents', authMiddleware, require('./routes/v1/agents/agent.routes')(agentController, authMiddleware));
    v1Router.use('/analytics', require('./routes/v1/analytics/AnalyticsRoutes')(analyticsController));
    v1Router.use('/leads', require('./routes/v1/campaign/lead.routes')(leadController));
    v1Router.use('/chats', require('./routes/v1/chat/chat.routes')(chatController));
    v1Router.use('/prospects', require('./routes/v1/campaign/prospect.routes')(prospectController));
    v1Router.use('/settings', require('./routes/v1/system/settings.routes')(settingsController, authMiddleware));
    v1Router.use('/webhook', require('./routes/v1/chat/webhook.routes')(webhookController));
    v1Router.use('/health', require('./routes/v1/system/health.routes')(healthController));
    v1Router.use('/billing', require('./routes/v1/billing/billing.routes')(billingController, authMiddleware));
    v1Router.use('/apify', require('./routes/v1/apify/apify.routes')(apifyController, apifyWebhookHandler));
    v1Router.use('/company', authMiddleware, require('./routes/v1/system/company.routes')(controllers.companyController));

    // WAHA Routes (Domain Driven)
    // Public Observability (Health Check)
    v1Router.use('/waha/observability', require('./routes/v1/waha/observability.routes')(controllers.wahaObservabilityController));

    // Protected WAHA Routes
    v1Router.use('/waha', authMiddleware, require('./routes/v1/waha/index')(controllers));

    // Admin Routes (v1)
    v1Router.use('/admin', require('./routes/v1/system/AdminRoutes')(adminController, authMiddleware));

    // Dev Routes (Conditional)
    if (process.env.NODE_ENV !== 'production') {
        process.stdout.write('🛠️  [Router] Loading Development Routes (Simulator enabled)\n');
        v1Router.use('/dev', require('./routes/v1/dev/dev.routes')(workflowEngine, chatService));
    }

    // Prefix all v1 routes
    router.use('/v1', v1Router);

    return router;
}

module.exports = createRouter;
