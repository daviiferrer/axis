const express = require('express');

module.exports = (authController) => {
    const router = express.Router();

    // GET /:session/qr
    router.get('/:session/qr', (req, res) => authController.getQR(req, res));

    // POST /:session/request-code
    router.post('/:session/request-code', (req, res) => authController.requestCode(req, res));

    return router;
};
