/**
 * SchedulingController - API endpoints for appointments
 */
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
            const companyId = req.user?.profile?.company_id;
            const days = parseInt(req.query.days) || 7;

            if (!companyId) {
                return res.status(400).json({ error: 'Company ID required' });
            }

            const slots = await this.schedulingService.getAvailableSlots(companyId, days);
            return res.json(slots);
        } catch (error) {
            console.error('Error fetching slots:', error);
            return res.status(500).json({ error: 'Failed to fetch available slots' });
        }
    }

    /**
     * POST /api/v1/scheduling/book
     * Create a new appointment
     */
    async createBooking(req, res) {
        try {
            const companyId = req.user?.profile?.company_id;
            const { leadId, startTime, endTime, title, attendeeName, attendeePhone, notes } = req.body;

            if (!companyId) {
                return res.status(400).json({ error: 'Company ID required' });
            }

            if (!startTime) {
                return res.status(400).json({ error: 'Start time is required' });
            }

            const result = await this.schedulingService.createAppointment({
                companyId,
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
            console.error('Error creating booking:', error);
            return res.status(500).json({ error: 'Failed to create booking' });
        }
    }

    /**
     * GET /api/v1/scheduling/upcoming
     * Get upcoming appointments
     */
    async getUpcoming(req, res) {
        try {
            const companyId = req.user?.profile?.company_id;
            const limit = parseInt(req.query.limit) || 10;

            if (!companyId) {
                return res.status(400).json({ error: 'Company ID required' });
            }

            const appointments = await this.schedulingService.getUpcoming(companyId, limit);
            return res.json(appointments);
        } catch (error) {
            console.error('Error fetching upcoming:', error);
            return res.status(500).json({ error: 'Failed to fetch appointments' });
        }
    }

    /**
     * GET /api/v1/scheduling/metrics
     * Get appointment metrics for dashboard
     */
    async getMetrics(req, res) {
        try {
            const companyId = req.user?.profile?.company_id;

            if (!companyId) {
                return res.status(400).json({ error: 'Company ID required' });
            }

            const metrics = await this.schedulingService.getMetrics(companyId);
            return res.json(metrics);
        } catch (error) {
            console.error('Error fetching metrics:', error);
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
            console.error('Error confirming:', error);
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
            console.error('Error cancelling:', error);
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
            console.error('Error completing:', error);
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
            console.error('Error marking no-show:', error);
            return res.status(500).json({ error: 'Failed to mark no-show' });
        }
    }
}

module.exports = SchedulingController;
