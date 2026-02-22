const express = require('express');
const rbac = require('../../../middlewares/rbacMiddleware');
const { Resources, Actions } = require('../../../../core/config/rbacConfig');

function createAgentRouter(agentController) {
    const router = express.Router();

    // Voice Management (MUST remain above /:id to avoid UUID parsing errors)
    router.get('/voices', rbac(Resources.AGENT, Actions.READ), (req, res) => agentController.listVoices(req, res));
    router.post('/voice-enroll', rbac(Resources.AGENT, Actions.UPDATE), (req, res) => agentController.enrollVoice(req, res));
    router.delete('/voices/:voiceId', rbac(Resources.AGENT, Actions.DELETE), (req, res) => agentController.deleteVoice(req, res));
    router.post('/voice-preview', rbac(Resources.AGENT, Actions.READ), (req, res) => agentController.previewVoice(req, res));

    // Agent CRUD
    router.get('/available', rbac(Resources.AGENT, Actions.READ), (req, res) => agentController.listAvailable(req, res));
    router.post('/', rbac(Resources.AGENT, Actions.CREATE), (req, res) => agentController.createAgent(req, res));
    router.get('/:id', rbac(Resources.AGENT, Actions.READ), (req, res) => agentController.getAgent(req, res));
    router.put('/:id', rbac(Resources.AGENT, Actions.UPDATE), (req, res) => agentController.updateAgent(req, res));
    router.delete('/:id', rbac(Resources.AGENT, Actions.DELETE), (req, res) => agentController.deleteAgent(req, res));

    router.post('/chat', rbac(Resources.AGENT, Actions.READ), (req, res) => agentController.chat(req, res));

    return router;
}

module.exports = createAgentRouter;
