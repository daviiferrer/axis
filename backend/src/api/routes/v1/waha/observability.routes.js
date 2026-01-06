const express = require('express');

module.exports = (observabilityController) => {
    const router = express.Router();

    router.get('/ping', (req, res) => observabilityController.ping(req, res));
    router.get('/health', (req, res) => observabilityController.health(req, res));
    router.get('/server/version', (req, res) => observabilityController.version(req, res));
    router.get('/server/status', (req, res) => observabilityController.serverStatus(req, res));

    router.post('/server/stop', (req, res) => observabilityController.stopServer(req, res));
    router.get('/server/debug/cpu', (req, res) => observabilityController.debugCpu(req, res));

    return router;
};
