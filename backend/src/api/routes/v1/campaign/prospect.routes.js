const express = require('express');

function createProspectRouter(prospectController) {
    const router = express.Router();

    router.post('/search', (req, res) => prospectController.search(req, res));
    router.get('/poll/:runId', (req, res) => prospectController.poll(req, res));
    router.post('/stop', (req, res) => prospectController.stop(req, res));

    return router;
}

module.exports = createProspectRouter;
