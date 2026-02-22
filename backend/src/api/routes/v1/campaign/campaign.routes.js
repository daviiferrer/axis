const express = require('express');
const rbac = require('../../../middlewares/rbacMiddleware');
const { Resources, Actions } = require('../../../../core/config/rbacConfig');

function createCampaignRouter(campaignController, authMiddleware, riskMiddleware) {
    const router = express.Router();

    router.get('/', rbac(Resources.CAMPAIGN, Actions.READ), (req, res) => campaignController.listCampaigns(req, res));
    router.post('/', rbac(Resources.CAMPAIGN, Actions.CREATE), (req, res) => campaignController.createCampaign(req, res));

    // Unified Status Management
    router.patch('/:id/status', rbac(Resources.CAMPAIGN, Actions.UPDATE), riskMiddleware, (req, res) => campaignController.updateStatus(req, res));

    // Delete Campaign
    router.delete('/:id', rbac(Resources.CAMPAIGN, Actions.DELETE), (req, res) => campaignController.deleteCampaign(req, res));

    router.get('/:id/flow', rbac(Resources.CAMPAIGN, Actions.READ), (req, res) => campaignController.getFlow(req, res));
    router.put('/:id/flow', rbac(Resources.CAMPAIGN, Actions.UPDATE), (req, res) => campaignController.saveFlow(req, res));
    router.post('/:id/publish', rbac(Resources.CAMPAIGN, Actions.UPDATE), riskMiddleware, (req, res) => campaignController.publishFlow(req, res));
    router.get('/:id/flow-stats', rbac(Resources.CAMPAIGN, Actions.READ), (req, res) => campaignController.getFlowStats(req, res));

    // Campaign Settings
    router.get('/:id/settings', rbac(Resources.CAMPAIGN, Actions.READ), (req, res) => campaignController.getSettings(req, res));
    router.patch('/:id/settings', rbac(Resources.CAMPAIGN, Actions.UPDATE), (req, res) => campaignController.updateSettings(req, res));

    return router;
}

module.exports = createCampaignRouter;
