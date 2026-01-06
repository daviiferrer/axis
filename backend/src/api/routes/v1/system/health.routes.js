const express = require('express');

function createHealthRouter(healthController) {
    const router = express.Router();

    router.get('/', (req, res) => healthController.getHealth(req, res));

    return router;
}

module.exports = createHealthRouter;
