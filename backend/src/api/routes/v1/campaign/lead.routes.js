const express = require('express');
const multer = require('multer');

// Configure upload (Memory Storage for processing immediately)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

function createLeadRouter(leadController) {
    const router = express.Router();

    router.post('/import', upload.single('file'), (req, res) => leadController.importLeads(req, res));
    router.patch('/:id/stop', (req, res) => leadController.stopLead(req, res));
    router.post('/:id/trigger', (req, res) => leadController.triggerAi(req, res));

    return router;
}

module.exports = createLeadRouter;
