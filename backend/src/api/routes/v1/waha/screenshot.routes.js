const express = require('express');

module.exports = (screenshotController) => {
    const router = express.Router();

    // GET /:session
    router.get('/:session', (req, res) => screenshotController.getScreenshot(req, res));

    return router;
};
