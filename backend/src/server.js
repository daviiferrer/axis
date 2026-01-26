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
                        console.error('❌ [Server] scopePerRequest middleware missing! Cannot resolve', name);
                        return res.status(500).json({ error: 'Internal Server Error: DI Scope Missing' });
                    }
                    const controller = req.container.resolve(name);

                    // Allow for async methods or sync
                    // We assume it's a request handler: method(req, res, next)
                    if (typeof controller[prop] !== 'function') {
                        console.error(`❌ [Server] Method ${prop} not found on controller ${name}`);
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
    app.use('/api', router);

    // 6. Global Error Handler
    app.use((err, req, res, next) => {
        console.error('🔥 [Global Error]', err);
        res.status(err.statusCode || 500).json({ error: err.message });
    });

    // 7. Start
    const PORT = process.env.PORT || 8000;
    server.listen(PORT, () => {
        console.log(`🚀 ÁXIS SERVER STARTED (Clean Slate Build) on Port ${PORT}`);
        console.log(`Container Mode: ${container.options.injectionMode} (Proxied)`);
    });

    // Graceful Shutdown
    process.on('SIGTERM', async () => {
        await container.dispose();
        server.close();
        process.exit(0);
    });
}

bootstrap().catch(err => {
    console.error('Fatal Error:', err);
    process.exit(1);
});
