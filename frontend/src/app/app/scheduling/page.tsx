'use client';

import { useEffect, useState } from 'react';
import { AppointmentStats } from '@/components/dashboard/appointment-stats';
import { UpcomingAppointments } from '@/components/dashboard/upcoming-appointments';
import { ConversionBySource } from '@/components/dashboard/conversion-by-source';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Plus, RefreshCw } from 'lucide-react';
import { schedulingApi, type Appointment, type AppointmentMetrics } from '@/services/schedulingApi';
import { toast } from 'sonner';

export default function SchedulingPage() {
    const [metrics, setMetrics] = useState<AppointmentMetrics | null>(null);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [metricsData, appointmentsData] = await Promise.all([
                schedulingApi.getMetrics(),
                schedulingApi.getUpcoming(10)
            ]);
            setMetrics(metricsData);
            setAppointments(appointmentsData);
        } catch (error) {
            console.error('Failed to fetch scheduling data:', error);
            toast.error('Erro ao carregar dados de agendamentos');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleConfirm = async (id: string) => {
        try {
            await schedulingApi.confirm(id);
            toast.success('Agendamento confirmado!');
            fetchData();
        } catch (error) {
            toast.error('Erro ao confirmar agendamento');
        }
    };

    const handleCancel = async (id: string) => {
        try {
            await schedulingApi.cancel(id, 'Cancelado pelo usuário');
            toast.success('Agendamento cancelado');
            fetchData();
        } catch (error) {
            toast.error('Erro ao cancelar agendamento');
        }
    };

    // Mock data for conversion by source (until we have real data)
    const sourceData = [
        { source: 'WhatsApp', icon: 'whatsapp' as const, conversations: 312, appointments: 37, conversion_rate: 11.9, cost: 42.25, cpa: 1.14 },
        { source: 'Meta Ads', icon: 'ads' as const, conversations: 55, appointments: 22, conversion_rate: 40.0, cost: 120.00, cpa: 5.45 },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Calendar className="h-6 w-6" />
                        Agendamentos
                    </h1>
                    <p className="text-muted-foreground">
                        Gerencie suas reuniões e métricas de conversão
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
                        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Atualizar
                    </Button>
                    <Button size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Novo Agendamento
                    </Button>
                </div>
            </div>

            {/* Stats Grid */}
            {metrics && (
                <AppointmentStats metrics={metrics} />
            )}

            {/* Main Content */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Upcoming Appointments */}
                <UpcomingAppointments
                    appointments={appointments}
                    onConfirm={handleConfirm}
                    onCancel={handleCancel}
                />

                {/* Conversion by Source */}
                <ConversionBySource
                    sources={sourceData}
                    responseTime="2,5h"
                    clickTime="2,3h"
                    totalRevenue="R$ 10.620"
                />
            </div>
        </div>
    );
}
