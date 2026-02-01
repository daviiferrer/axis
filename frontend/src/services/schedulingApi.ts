import api from './api';

export interface AppointmentMetrics {
    today: number;
    this_week: number;
    no_show_rate: string | number;
    total_completed: number;
}

export interface Appointment {
    id: string;
    title: string;
    start_time: string;
    end_time: string;
    status: 'scheduled' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
    attendee_name?: string;
    attendee_phone?: string;
    attendee_email?: string;
    notes?: string;
    leads?: {
        name: string;
        phone: string;
    };
}

export interface TimeSlot {
    start: string;
    end: string;
    formatted: string;
}

export interface DaySlots {
    date: string;
    dayName: string;
    slots: TimeSlot[];
}

/**
 * Scheduling API Service
 */
export const schedulingApi = {
    /**
     * Get available slots for booking
     */
    async getSlots(days: number = 7): Promise<DaySlots[]> {
        const { data } = await api.get(`/scheduling/slots?days=${days}`);
        return data;
    },

    /**
     * Create a new booking
     */
    async createBooking(bookingData: {
        leadId?: string;
        campaignId?: string;
        startTime: string;
        endTime?: string;
        title?: string;
        attendeeName?: string;
        attendeePhone?: string;
        attendeeEmail?: string;
        notes?: string;
    }): Promise<Appointment> {
        const { data } = await api.post('/scheduling/book', bookingData);
        return data;
    },

    /**
     * Get upcoming appointments
     */
    async getUpcoming(limit: number = 10): Promise<Appointment[]> {
        const { data } = await api.get(`/scheduling/upcoming?limit=${limit}`);
        return data;
    },

    /**
     * Get scheduling metrics for dashboard
     */
    async getMetrics(): Promise<AppointmentMetrics> {
        const { data } = await api.get('/scheduling/metrics');
        return data;
    },

    /**
     * Confirm an appointment
     */
    async confirm(appointmentId: string): Promise<Appointment> {
        const { data } = await api.patch(`/scheduling/${appointmentId}/confirm`);
        return data;
    },

    /**
     * Cancel an appointment
     */
    async cancel(appointmentId: string, reason?: string): Promise<Appointment> {
        const { data } = await api.patch(`/scheduling/${appointmentId}/cancel`, { reason });
        return data;
    },

    /**
     * Mark appointment as completed
     */
    async complete(appointmentId: string): Promise<Appointment> {
        const { data } = await api.patch(`/scheduling/${appointmentId}/complete`);
        return data;
    },

    /**
     * Mark appointment as no-show
     */
    async markNoShow(appointmentId: string): Promise<Appointment> {
        const { data } = await api.patch(`/scheduling/${appointmentId}/no-show`);
        return data;
    }
};

export default schedulingApi;
