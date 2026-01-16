const express = require('express');
const rbac = require('../../../middlewares/rbacMiddleware');
const { Resources, Actions } = require('../../../../core/config/rbacConfig');

function createAgentRouter(agentController) {
    const router = express.Router();

    router.get('/available', rbac(Resources.AGENT, Actions.READ), (req, res) => agentController.listAvailable(req, res));
    router.post('/', rbac(Resources.AGENT, Actions.CREATE), (req, res) => agentController.createAgent(req, res));
    router.get('/:id', rbac(Resources.AGENT, Actions.READ), (req, res) => agentController.getAgent(req, res));
    router.put('/:id', rbac(Resources.AGENT, Actions.UPDATE), (req, res) => agentController.updateAgent(req, res));
    router.delete('/:id', rbac(Resources.AGENT, Actions.DELETE), (req, res) => agentController.deleteAgent(req, res));

    router.post('/chat', rbac(Resources.AGENT, Actions.READ), (req, res) => agentController.chat(req, res));
    router.post('/graph-chat', rbac(Resources.AGENT, Actions.READ), (req, res) => agentController.graphChat(req, res));

    return router;
}

module.exports = createAgentRouter;
