const express = require('express');

const sessionRoutes = require('./session.routes');
const authRoutes = require('./auth.routes');
const profileRoutes = require('./profile.routes');
const chattingRoutes = require('./chatting.routes');
const presenceRoutes = require('./presence.routes');
const mediaRoutes = require('./media.routes');
const observabilityRoutes = require('./observability.routes');
const screenshotRoutes = require('./screenshot.routes');

module.exports = (controllers) => {
    const router = express.Router();

    // Use specific controllers from the injected object
    // Assuming controllers object structure:
    // { 
    //   wahaSessionController, 
    //   wahaAuthController, 
    //   wahaProfileController, 
    //   wahaChattingController, 
    //   wahaPresenceController, 
    //   wahaMediaController, 
    //   wahaObservabilityController, 
    //   wahaScreenshotController 
    // }

    router.use('/sessions', sessionRoutes(controllers.wahaSessionController));
    router.use('/auth', authRoutes(controllers.wahaAuthController));
    router.use('/profile', profileRoutes(controllers.wahaProfileController));
    router.use('/chatting', chattingRoutes(controllers.wahaChattingController));
    router.use('/presence', presenceRoutes(controllers.wahaPresenceController));
    router.use('/media', mediaRoutes(controllers.wahaMediaController));
    router.use('/media', mediaRoutes(controllers.wahaMediaController));
    // router.use('/observability', observabilityRoutes(controllers.wahaObservabilityController)); // Moved to public router in api/router.js
    router.use('/screenshot', screenshotRoutes(controllers.wahaScreenshotController));
    router.use('/screenshot', screenshotRoutes(controllers.wahaScreenshotController));

    return router;
};
