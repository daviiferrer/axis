/**
 * SchedulingService - Native AXIS Appointment Management
 * 
 * Handles availability slots, booking creation, and appointment lifecycle.
 */
const logger = require('../../../shared/Logger').createModuleLogger('scheduling-service');

class SchedulingService {
    constructor({ supabaseClient }) {
        this.supabase = supabaseClient;
        this.DEFAULT_TIMEZONE = 'America/Sao_Paulo';
    }

    /**
     * Get available slots for the next N days
     * @param {string} companyId 
     * @param {number} days - Number of days to look ahead
     * @returns {Array<{date: string, slots: Array<{start: string, end: string}>}>}
     */
    async getAvailableSlots(userId, days = 7) {
        try {
            // 1. Get user's availability rules (or company's if re-added)
            // For now, assume generic or user-specific if table supported "user_id"
            // FIXME: Table 'availability_slots' is missing in DB. Using default mock slots.
            // Future implementation needed if custom slots are required.
            return this._generateDefaultSlots(days);

            if (rulesError) throw rulesError;

            if (!rules || rules.length === 0) {
                // Return default Mon-Fri 9-18 if no rules configured
                return this._generateDefaultSlots(days);
            }

            // 2. Get existing appointments to exclude
            const startDate = new Date();
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + days);

            const { data: existingAppointments, error: apptError } = await this.supabase
                .from('appointments')
                .select('start_time, end_time')
                .eq('company_id', companyId)
                .in('status', ['scheduled', 'confirmed'])
                .gte('start_time', startDate.toISOString())
                .lte('start_time', endDate.toISOString());

            if (apptError) throw apptError;

            // 3. Generate available slots
            const slots = this._generateSlots([], days, existingAppointments || []); // Empty rules = defaults

            return slots;
        } catch (error) {
            logger.error({ error: error.message, userId }, 'Failed to get available slots');
            throw error;
        }
    }

    /**
     * Generate slots based on availability rules
     */
    _generateSlots(rules, days, existingAppointments) {
        const result = [];
        const now = new Date();

        for (let d = 0; d < days; d++) {
            const date = new Date(now);
            date.setDate(date.getDate() + d);
            const dayOfWeek = date.getDay();

            // Find rules for this day
            const dayRules = rules.filter(r => r.day_of_week === dayOfWeek);
            if (dayRules.length === 0) continue;

            const daySlots = [];

            for (const rule of dayRules) {
                const slots = this._generateDaySlots(
                    date,
                    rule.start_time,
                    rule.end_time,
                    rule.slot_duration,
                    rule.buffer_between
                );

                // Filter out already booked slots
                const availableSlots = slots.filter(slot => {
                    return !existingAppointments.some(appt => {
                        const apptStart = new Date(appt.start_time);
                        const apptEnd = new Date(appt.end_time);
                        const slotStart = new Date(slot.start);
                        const slotEnd = new Date(slot.end);

                        // Check overlap
                        return (slotStart < apptEnd && slotEnd > apptStart);
                    });
                });

                daySlots.push(...availableSlots);
            }

            if (daySlots.length > 0) {
                result.push({
                    date: date.toISOString().split('T')[0],
                    dayName: this._getDayName(dayOfWeek),
                    slots: daySlots
                });
            }
        }

        return result;
    }

    /**
     * Generate slots for a single day
     */
    _generateDaySlots(date, startTime, endTime, duration, buffer) {
        const slots = [];
        const [startH, startM] = startTime.split(':').map(Number);
        const [endH, endM] = endTime.split(':').map(Number);

        const start = new Date(date);
        start.setHours(startH, startM, 0, 0);

        const end = new Date(date);
        end.setHours(endH, endM, 0, 0);

        const now = new Date();
        // Add 1 hour buffer for today's slots
        const minTime = new Date(now.getTime() + 60 * 60 * 1000);

        let current = new Date(start);

        while (current < end) {
            const slotEnd = new Date(current.getTime() + duration * 60 * 1000);

            // Skip if slot ends after end time
            if (slotEnd > end) break;

            // Skip if slot is in the past
            if (current >= minTime) {
                slots.push({
                    start: current.toISOString(),
                    end: slotEnd.toISOString(),
                    formatted: `${current.getHours().toString().padStart(2, '0')}:${current.getMinutes().toString().padStart(2, '0')}`
                });
            }

            // Move to next slot (duration + buffer)
            current = new Date(slotEnd.getTime() + buffer * 60 * 1000);
        }

        return slots;
    }

    /**
     * Generate default slots (Mon-Fri 9-18)
     */
    _generateDefaultSlots(days) {
        const rules = [];
        for (let dow = 1; dow <= 5; dow++) {
            rules.push({
                day_of_week: dow,
                start_time: '09:00',
                end_time: '18:00',
                slot_duration: 30,
                buffer_between: 10
            });
        }
        return this._generateSlots(rules, days, []);
    }

    _getDayName(dow) {
        const names = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
        return names[dow];
    }

    /**
     * Create a new appointment
     */
    async createAppointment(data) {
        const {
            userId, // Context User (Host)
            leadId,
            campaignId,
            hostUserId,
            startTime,
            endTime,
            title = 'Reunião',
            attendeeName,
            attendeePhone,
            attendeeEmail,
            notes
        } = data;

        try {
            // 1. Check if slot is still available
            const slotStart = new Date(startTime);
            const slotEnd = endTime ? new Date(endTime) : new Date(slotStart.getTime() + 30 * 60 * 1000);

            const { data: conflicts, error: conflictError } = await this.supabase
                .from('appointments')
                .select('id')
                .eq('host_user_id', userId) // Changed from company_id
                .in('status', ['scheduled', 'confirmed'])
                .lt('start_time', slotEnd.toISOString())
                .gt('end_time', slotStart.toISOString());

            if (conflictError) throw conflictError;

            if (conflicts && conflicts.length > 0) {
                return {
                    success: false,
                    error: 'SLOT_UNAVAILABLE',
                    message: 'Este horário não está mais disponível'
                };
            }

            // 2. Create appointment
            const { data: appointment, error: createError } = await this.supabase
                .from('appointments')
                .insert({
                    // company_id: companyId, // Removed
                    host_user_id: userId || hostUserId,
                    lead_id: leadId,
                    campaign_id: campaignId,
                    // host_user_id handled above
                    title,
                    start_time: slotStart.toISOString(),
                    end_time: slotEnd.toISOString(),
                    attendee_name: attendeeName,
                    attendee_phone: attendeePhone,
                    attendee_email: attendeeEmail,
                    notes,
                    status: 'scheduled'
                })
                .select()
                .single();

            if (createError) throw createError;

            logger.info({ appointmentId: appointment.id, leadId }, 'Appointment created');

            return {
                success: true,
                appointment
            };
        } catch (error) {
            logger.error({ error: error.message }, 'Failed to create appointment');
            throw error;
        }
    }

    /**
     * Cancel an appointment
     */
    async cancelAppointment(appointmentId, reason = null) {
        const { data, error } = await this.supabase
            .from('appointments')
            .update({
                status: 'cancelled',
                cancelled_at: new Date().toISOString(),
                cancellation_reason: reason
            })
            .eq('id', appointmentId)
            .select()
            .single();

        if (error) throw error;

        logger.info({ appointmentId, reason }, 'Appointment cancelled');
        return data;
    }

    /**
     * Confirm an appointment
     */
    async confirmAppointment(appointmentId) {
        const { data, error } = await this.supabase
            .from('appointments')
            .update({
                status: 'confirmed',
                confirmed_at: new Date().toISOString()
            })
            .eq('id', appointmentId)
            .select()
            .single();

        if (error) throw error;

        logger.info({ appointmentId }, 'Appointment confirmed');
        return data;
    }

    /**
     * Mark appointment as completed
     */
    async completeAppointment(appointmentId) {
        const { data, error } = await this.supabase
            .from('appointments')
            .update({
                status: 'completed',
                completed_at: new Date().toISOString()
            })
            .eq('id', appointmentId)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Mark appointment as no-show
     */
    async markNoShow(appointmentId) {
        const { data, error } = await this.supabase
            .from('appointments')
            .update({ status: 'no_show' })
            .eq('id', appointmentId)
            .select()
            .single();

        if (error) throw error;

        logger.info({ appointmentId }, 'Appointment marked as no-show');
        return data;
    }

    /**
     * Get upcoming appointments
     */
    async getUpcoming(userId, limit = 10) {
        const { data, error } = await this.supabase
            .from('appointments')
            .select('*, leads(name, phone)')
            .eq('host_user_id', userId) // Changed from company_id
            .in('status', ['scheduled', 'confirmed'])
            .gte('start_time', new Date().toISOString())
            .order('start_time', { ascending: true })
            .limit(limit);

        if (error) throw error;
        return data;
    }

    /**
     * Get appointment metrics for dashboard
     */
    async getMetrics(userId) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Appointments today
        const { count: todayCount } = await this.supabase
            .from('appointments')
            .select('*', { count: 'exact', head: true })
            .eq('host_user_id', userId) // Changed from company_id
            .gte('start_time', today.toISOString())
            .lt('start_time', tomorrow.toISOString());

        // This week
        const weekStart = new Date(today);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);

        const { count: weekCount } = await this.supabase
            .from('appointments')
            .select('*', { count: 'exact', head: true })
            .eq('host_user_id', userId)
            .gte('start_time', weekStart.toISOString())
            .lt('start_time', weekEnd.toISOString());

        // No-show rate (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { count: totalCompleted } = await this.supabase
            .from('appointments')
            .select('*', { count: 'exact', head: true })
            .eq('host_user_id', userId)
            .in('status', ['completed', 'no_show'])
            .gte('start_time', thirtyDaysAgo.toISOString());

        const { count: noShows } = await this.supabase
            .from('appointments')
            .select('*', { count: 'exact', head: true })
            .eq('host_user_id', userId)
            .eq('status', 'no_show')
            .gte('start_time', thirtyDaysAgo.toISOString());

        const noShowRate = totalCompleted > 0
            ? ((noShows / totalCompleted) * 100).toFixed(1)
            : 0;

        return {
            today: todayCount || 0,
            this_week: weekCount || 0,
            no_show_rate: noShowRate,
            total_completed: totalCompleted || 0
        };
    }

    /**
     * Format slots for WhatsApp message
     */
    formatSlotsForWhatsApp(slots, maxDays = 3, maxPerDay = 3) {
        let message = '📅 Horários disponíveis:\n\n';

        const limitedSlots = slots.slice(0, maxDays);

        for (const day of limitedSlots) {
            message += `*${day.dayName} (${day.date.split('-').reverse().slice(0, 2).join('/')})*\n`;

            const daySlots = day.slots.slice(0, maxPerDay);
            for (const slot of daySlots) {
                message += `  ⏰ ${slot.formatted}\n`;
            }
            message += '\n';
        }

        message += 'Qual horário funciona melhor para você?';

        return message;
    }
}

module.exports = SchedulingService;
