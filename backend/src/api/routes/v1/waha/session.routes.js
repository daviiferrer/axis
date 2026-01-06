const express = require('express');

module.exports = (sessionController) => {
    const router = express.Router();

    // GET / (List all sessions)
    router.get('/', (req, res) => sessionController.getSessions(req, res));

    // POST / (Create session)
    router.post('/', (req, res) => sessionController.createSession(req, res));

    // GET /:session (Get session info)
    router.get('/:session', (req, res) => sessionController.getSession(req, res));

    // PUT /:session (Update session config)
    router.put('/:session', (req, res) => sessionController.updateSession(req, res));

    // DELETE /:session (Delete session)
    router.delete('/:session', (req, res) => sessionController.deleteSession(req, res));

    // GET /:session/me (Get own contact info)
    router.get('/:session/me', (req, res) => sessionController.getSessionMe(req, res));

    // POST /:session/start
    router.post('/:session/start', (req, res) => sessionController.startSession(req, res));

    // POST /:session/stop
    router.post('/:session/stop', (req, res) => sessionController.stopSession(req, res));

    // POST /:session/logout
    router.post('/:session/logout', (req, res) => sessionController.logoutSession(req, res));

    // POST /:session/restart
    router.post('/:session/restart', (req, res) => sessionController.restartSession(req, res));

    return router;
};
