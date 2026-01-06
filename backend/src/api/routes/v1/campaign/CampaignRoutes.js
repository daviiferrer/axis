const express = require('express');

function createCampaignRouter(campaignController) {
    const router = express.Router();

    router.get('/available-agents', (req, res) => campaignController.listAvailableAgents(req, res));
    router.post('/:id/strategy', (req, res) => campaignController.saveStrategy(req, res));
    router.post('/:id/start', (req, res) => campaignController.startCampaign(req, res));
    router.post('/:id/pause', (req, res) => campaignController.pauseCampaign(req, res));

    return router;
}

module.exports = createCampaignRouter;
