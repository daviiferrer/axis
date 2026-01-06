const express = require('express');

function createLeadRouter(leadController) {
    const router = express.Router();

    router.post('/import', (req, res) => leadController.importLeads(req, res));
    router.patch('/:id/stop', (req, res) => leadController.stopLead(req, res));
    router.post('/:id/trigger', (req, res) => leadController.triggerAi(req, res));

    return router;
}

module.exports = createLeadRouter;
