const express = require('express');

module.exports = (screenshotController) => {
    const router = express.Router();

    // GET /
    router.get('/', (req, res) => screenshotController.getScreenshot(req, res));

    return router;
};
