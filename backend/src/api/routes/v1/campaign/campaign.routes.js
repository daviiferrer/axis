const express = require('express');
const rbac = require('../../../middlewares/rbacMiddleware');
const { Resources, Actions } = require('../../../../core/config/rbacConfig');

function createCampaignRouter(campaignController, authMiddleware, riskMiddleware) {
    const router = express.Router();

    router.get('/', rbac(Resources.CAMPAIGN, Actions.READ), (req, res) => campaignController.listCampaigns(req, res));

    // High Risk Actions - Protected by Hardwall
    router.post('/:id/start', rbac(Resources.CAMPAIGN, Actions.START), riskMiddleware, (req, res) => campaignController.startCampaign(req, res));
    router.post('/:id/pause', rbac(Resources.CAMPAIGN, Actions.PAUSE), (req, res) => campaignController.pauseCampaign(req, res));
    router.post('/:id/strategy', rbac(Resources.CAMPAIGN, Actions.UPDATE), (req, res) => campaignController.saveStrategy(req, res));

    // Changing mode (e.g. to Autonomous) is also high risk
    router.patch('/:id/mode', rbac(Resources.CAMPAIGN, Actions.UPDATE), riskMiddleware, (req, res) => campaignController.updateMode(req, res));

    return router;
}

module.exports = createCampaignRouter;
