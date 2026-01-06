const express = require('express');

module.exports = (presenceController) => {
    const router = express.Router();

    // POST /:session
    router.post('/:session', (req, res) => presenceController.setPresence(req, res));

    // GET /:session
    router.get('/:session', (req, res) => presenceController.getPresence(req, res));

    // GET /:session/:chatId
    router.get('/:session/:chatId', (req, res) => presenceController.getChatPresence(req, res));

    // POST /:session/:chatId/subscribe
    router.post('/:session/:chatId/subscribe', (req, res) => presenceController.subscribePresence(req, res));

    return router;
};
