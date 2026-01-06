/**
 * Apify Routes - Lead Extraction Engine API
 */
const express = require('express');
const router = express.Router();

module.exports = (apifyController, apifyWebhookHandler) => {
    // Get actor catalog
    router.get('/catalog', (req, res) => apifyController.getCatalog(req, res));

    // Start extraction run
    router.post('/extract', (req, res) => apifyController.startExtraction(req, res));

    // Get run status
    router.get('/runs/:runId', (req, res) => apifyController.getRunStatus(req, res));

    // Get dataset items
    router.get('/datasets/:datasetId', (req, res) => apifyController.getDataset(req, res));

    // Abort a run
    router.post('/runs/:runId/abort', (req, res) => apifyController.abortRun(req, res));

    // Get extraction history for a campaign
    router.get('/campaigns/:campaignId/history', (req, res) => apifyController.getHistory(req, res));

    // Webhook endpoint (called by Apify)
    router.post('/webhook', (req, res) => apifyWebhookHandler.handleWebhook(req, res));

    return router;
};
