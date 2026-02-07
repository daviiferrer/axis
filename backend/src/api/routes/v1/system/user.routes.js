const express = require('express');

module.exports = (userParamsController) => {
    const router = express.Router();

    // PUT /:provider/key (Update API Key) - kept generic for future params
    router.put('/params', (req, res) => userParamsController.updateApiKey(req, res));

    // GET /params/:provider (Check if key exists)
    router.get('/params/:provider', (req, res) => userParamsController.hasApiKey(req, res));

    return router;
};
