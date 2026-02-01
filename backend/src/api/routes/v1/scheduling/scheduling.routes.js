/**
 * Scheduling Routes
 * API routes for appointment management
 */
const express = require('express');

module.exports = function (schedulingController, authMiddleware) {
    const router = express.Router();

    // All scheduling routes require authentication
    router.use(authMiddleware);

    // GET /api/v1/scheduling/slots - Get available slots
    router.get('/slots', (req, res) => schedulingController.getSlots(req, res));

    // POST /api/v1/scheduling/book - Create booking
    router.post('/book', (req, res) => schedulingController.createBooking(req, res));

    // GET /api/v1/scheduling/upcoming - Get upcoming appointments
    router.get('/upcoming', (req, res) => schedulingController.getUpcoming(req, res));

    // GET /api/v1/scheduling/metrics - Dashboard metrics
    router.get('/metrics', (req, res) => schedulingController.getMetrics(req, res));

    // PATCH /api/v1/scheduling/:id/confirm
    router.patch('/:id/confirm', (req, res) => schedulingController.confirm(req, res));

    // PATCH /api/v1/scheduling/:id/cancel
    router.patch('/:id/cancel', (req, res) => schedulingController.cancel(req, res));

    // PATCH /api/v1/scheduling/:id/complete
    router.patch('/:id/complete', (req, res) => schedulingController.complete(req, res));

    // PATCH /api/v1/scheduling/:id/no-show
    router.patch('/:id/no-show', (req, res) => schedulingController.noShow(req, res));

    return router;
};
