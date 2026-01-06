const express = require('express');

module.exports = (mediaController) => {
    const router = express.Router();

    // POST /convert/voice
    router.post('/convert/voice', (req, res) => mediaController.convertVoice(req, res));

    // POST /convert/video
    router.post('/convert/video', (req, res) => mediaController.convertVideo(req, res));

    return router;
};
