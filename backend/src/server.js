const path = require('path');
const dotenv = require('dotenv');

// 1. Environment Loading
const rootEnvPath = path.resolve(__dirname, '../../.env');
const result = dotenv.config({ path: rootEnvPath });

if (result.error) {
    console.error(`❌ [Server] Could not load root .env file at: ${rootEnvPath}`);
} else {
    console.log(`✅ [Server] Loaded root .env from: ${rootEnvPath}`);
}

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const { scopePerRequest } = require('awilix-express');
const logger = require('./shared/Logger').createModuleLogger('server');

// DI Container
const { configureContainer } = require('./container');

// Router
const createRouter = require('./api/router');
const createAuthMiddleware = require('./api/middlewares/authMiddleware');
const riskMiddleware = require('./api/middlewares/riskMiddleware');

async function bootstrap() {
    const app = express();
    const server = http.createServer(app);
    const io = new Server(server, {
        cors: {
            origin: process.env.CORS_ORIGIN || "*",
            methods: ["GET", "POST"]
        }
    });

    io.on('connection', (socket) => {
        logger.info({ socketId: socket.id }, '🔌 New Client Connected via WebSocket');
        socket.on('disconnect', () => {
            logger.info({ socketId: socket.id }, '🔌 Client Disconnected');
        });
    });

    // 2. Configure Container
    const container = configureContainer();

    // Register IO (Runtime Value)
    const { asValue } = require('awilix');
    container.register({
        io: asValue(io),
        // SocketService expects 'io' to be passed to initialize, 
        // but here we might want to register it as a dependency if refactored.
        // For now, we keep the manual init for SocketService if it's a Singleton Module.
    });

    // 3. Middlewares
    app.use(helmet());
    app.use(cors({
        origin: process.env.CORS_ORIGIN || "*"
    }));
    app.use(express.json());

    // Metrics Middleware (Native - low overhead)
    const { metricsMiddleware, getMetrics } = require('./api/middlewares/metricsMiddleware');
    app.use(metricsMiddleware);

    // Awilix Scope per Request - Injects 'req.container'
    app.use(scopePerRequest(container));

    // Initialize Shared Services that need explicit startup
    const socketService = container.resolve('socketService');
    socketService.initialize(io);

    // 4. Resolve Controllers for Router
    // CRITICAL FIX: We cannot resolve Scoped Controllers (depending on Scoped Services) 
    // from the Root Container. We must resolve them PER REQUEST.
    // We use a Proxy pattern to lazy-resolve the controller from req.container.

    const makeLazyController = (name) => {
        return new Proxy({}, {
            get: (target, prop) => {
                // Return a function that Express/Router will call
                // This function grabs the request-scoped container and resolves the controller
                return (req, res, next) => {
                    if (!req.container) {
                        logger.error({ controller: name }, 'scopePerRequest middleware missing!');
                        return res.status(500).json({ error: 'Internal Server Error: DI Scope Missing' });
                    }
                    const controller = req.container.resolve(name);

                    // Allow for async methods or sync
                    // We assume it's a request handler: method(req, res, next)
                    if (typeof controller[prop] !== 'function') {
                        logger.error({ controller: name, method: prop }, 'Method not found on controller');
                        return res.status(404).json({ error: 'Endpoint Not Found' });
                    }

                    return controller[prop](req, res, next);
                };
            }
        });
    };

    const controllers = {
        settingsController: makeLazyController('settingsController'),
        analyticsController: makeLazyController('analyticsController'),
        dashboardController: makeLazyController('dashboardController'),
        adminController: makeLazyController('adminController'),
        campaignController: makeLazyController('campaignController'),
        oracleController: makeLazyController('oracleController'),
        leadController: makeLazyController('leadController'),
        apifyController: makeLazyController('apifyController'),
        apifyWebhookHandler: makeLazyController('apifyWebhookHandler'),
        webhookController: makeLazyController('webhookController'),
        agentController: makeLazyController('agentController'),
        prospectController: makeLazyController('prospectController'),
        chatController: makeLazyController('chatController'),
        healthController: makeLazyController('healthController'),
        billingController: makeLazyController('billingController'),
        companyController: makeLazyController('companyController'),

        // WAHA Controllers
        wahaSessionController: makeLazyController('wahaSessionController'),
        wahaAuthController: makeLazyController('wahaAuthController'),
        wahaProfileController: makeLazyController('wahaProfileController'),
        wahaChattingController: makeLazyController('wahaChattingController'),
        wahaPresenceController: makeLazyController('wahaPresenceController'),
        wahaMediaController: makeLazyController('wahaMediaController'),
        wahaObservabilityController: makeLazyController('wahaObservabilityController'),
        wahaScreenshotController: makeLazyController('wahaScreenshotController'),

        // Legacy/Direct injections
        // WorkflowEngine is Singleton, safe to resolve from Root
        workflowEngine: container.resolve('workflowEngine'),

        // ChatService is Scoped, so we need a Lazy Proxy for it too IF it's used as a controller/handler
        // dev.routes uses it directly. We should probably treat it like a controller here.
        chatService: makeLazyController('chatService'),

        // WahaClient is Singleton
        wahaClient: container.resolve('wahaClient'),

        // Middlewares
        authMiddleware: createAuthMiddleware(),
        // RiskMiddleware Active 🛡️
        riskMiddleware: riskMiddleware,
    };

    // 5. Routes
    const router = createRouter(controllers);

    // Metrics Endpoint (Public for monitoring)
    app.get('/api/v1/metrics', (req, res) => {
        res.json(getMetrics());
    });

    app.use('/api', router);

    // 6. Global Error Handler
    app.use((err, req, res, next) => {
        logger.error({ error: err.message, stack: err.stack }, 'Global error handler');
        res.status(err.statusCode || 500).json({ error: err.message });
    });

    // 7. Start Engine & Server
    await controllers.workflowEngine.start();

    const PORT = process.env.PORT || 8000;
    server.listen(PORT, () => {
        logger.info({ port: PORT, mode: container.options.injectionMode }, '🚀 ÁXIS SERVER STARTED');
    });

    // Graceful Shutdown (handles nodemon restarts and deployments)
    const gracefulShutdown = async (signal) => {
        logger.info({ signal }, '🛑 Graceful shutdown starting...');

        // Stop accepting new HTTP connections
        server.close();

        // Wait for queue workers to finish current jobs (max 30s)
        if (controllers.workflowEngine?.queueService) {
            try {
                await controllers.workflowEngine.queueService.shutdown();
                logger.info('✅ Queue workers stopped');
            } catch (err) {
                logger.warn({ error: err.message }, '⚠️ Queue shutdown error');
            }
        }

        await container.dispose();
        logger.info('✅ Graceful shutdown complete');
        process.exit(0);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));  // Ctrl+C / nodemon
}

bootstrap().catch(err => {
    logger.fatal({ error: err.message }, 'Fatal startup error');
    process.exit(1);
});
