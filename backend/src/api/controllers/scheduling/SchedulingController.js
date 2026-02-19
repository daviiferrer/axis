/**
 * SchedulingController - API endpoints for appointments
 */
const logger = require('../../../shared/Logger').createModuleLogger('scheduling');

class SchedulingController {
    constructor({ schedulingService }) {
        this.schedulingService = schedulingService;
    }

    /**
     * GET /api/v1/scheduling/slots
     * Get available slots for booking
     * Query: ?days=7
     */
    async getSlots(req, res) {
        try {
            const userId = req.user?.id;
            const days = parseInt(req.query.days) || 7;

            // if (!companyId) ... removed

            const slots = await this.schedulingService.getAvailableSlots(userId, days);
            return res.json(slots);
        } catch (error) {
            logger.error({ err: error }, 'Error fetching slots');
            return res.status(500).json({ error: 'Failed to fetch available slots' });
        }
    }

    /**
     * POST /api/v1/scheduling/book
     * Create a new appointment
     */
    async createBooking(req, res) {
        try {
            const userId = req.user?.id;
            const { leadId, startTime, endTime, title, attendeeName, attendeePhone, notes } = req.body;

            // if (!companyId) ... removed

            if (!startTime) {
                return res.status(400).json({ error: 'Start time is required' });
            }

            const result = await this.schedulingService.createAppointment({
                userId,
                leadId,
                campaignId: req.body.campaignId,
                startTime,
                endTime,
                title,
                attendeeName,
                attendeePhone,
                attendeeEmail: req.body.attendeeEmail,
                notes
            });

            if (!result.success) {
                return res.status(409).json({
                    error: result.error,
                    message: result.message
                });
            }

            return res.status(201).json(result.appointment);
        } catch (error) {
            logger.error({ err: error }, 'Error creating booking');
            return res.status(500).json({ error: 'Failed to create booking' });
        }
    }

    /**
     * GET /api/v1/scheduling/upcoming
     * Get upcoming appointments
     */
    async getUpcoming(req, res) {
        try {
            const userId = req.user?.id;
            const limit = parseInt(req.query.limit) || 10;

            // if (!companyId) ... removed

            const appointments = await this.schedulingService.getUpcoming(userId, limit);
            return res.json(appointments);
        } catch (error) {
            logger.error({ err: error }, 'Error fetching upcoming');
            return res.status(500).json({ error: 'Failed to fetch appointments' });
        }
    }

    /**
     * GET /api/v1/scheduling/metrics
     * Get appointment metrics for dashboard
     */
    async getMetrics(req, res) {
        try {
            const userId = req.user?.id;

            // if (!companyId) ... removed

            const metrics = await this.schedulingService.getMetrics(userId);
            return res.json(metrics);
        } catch (error) {
            logger.error({ err: error }, 'Error fetching metrics');
            return res.status(500).json({ error: 'Failed to fetch metrics' });
        }
    }

    /**
     * PATCH /api/v1/scheduling/:id/confirm
     */
    async confirm(req, res) {
        try {
            const { id } = req.params;
            const appointment = await this.schedulingService.confirmAppointment(id);
            return res.json(appointment);
        } catch (error) {
            logger.error({ err: error }, 'Error confirming');
            return res.status(500).json({ error: 'Failed to confirm appointment' });
        }
    }

    /**
     * PATCH /api/v1/scheduling/:id/cancel
     */
    async cancel(req, res) {
        try {
            const { id } = req.params;
            const { reason } = req.body;
            const appointment = await this.schedulingService.cancelAppointment(id, reason);
            return res.json(appointment);
        } catch (error) {
            logger.error({ err: error }, 'Error cancelling');
            return res.status(500).json({ error: 'Failed to cancel appointment' });
        }
    }

    /**
     * PATCH /api/v1/scheduling/:id/complete
     */
    async complete(req, res) {
        try {
            const { id } = req.params;
            const appointment = await this.schedulingService.completeAppointment(id);
            return res.json(appointment);
        } catch (error) {
            logger.error({ err: error }, 'Error completing');
            return res.status(500).json({ error: 'Failed to complete appointment' });
        }
    }

    /**
     * PATCH /api/v1/scheduling/:id/no-show
     */
    async noShow(req, res) {
        try {
            const { id } = req.params;
            const appointment = await this.schedulingService.markNoShow(id);
            return res.json(appointment);
        } catch (error) {
            logger.error({ err: error }, 'Error marking no-show');
            return res.status(500).json({ error: 'Failed to mark no-show' });
        }
    }
}

module.exports = SchedulingController;
