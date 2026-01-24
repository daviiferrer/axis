const express = require('express');

function createChatRouter(chatController) {
    const router = express.Router();

    router.get('/sessions', (req, res) => chatController.getSessions(req, res));
    router.post('/send', (req, res) => chatController.sendMessage(req, res));
    router.post('/tags', (req, res) => chatController.updateTags(req, res));
    router.post('/oracle-hint', (req, res) => chatController.getOracleHint(req, res));
    router.get('/:id/presence', (req, res) => chatController.getPresence(req, res));

    return router;
}

module.exports = createChatRouter;
