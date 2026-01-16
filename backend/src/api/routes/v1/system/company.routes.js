const express = require('express');

module.exports = (companyController) => {
    const router = express.Router();

    // POST /api/v1/company - Create a new company
    router.post('/', (req, res) => companyController.create(req, res));

    return router;
};
