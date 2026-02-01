'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, User, MoreHorizontal, CheckCircle, XCircle, Phone } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Appointment {
    id: string;
    title: string;
    start_time: string;
    end_time: string;
    status: 'scheduled' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
    attendee_name?: string;
    attendee_phone?: string;
    leads?: {
        name: string;
        phone: string;
    };
}

interface UpcomingAppointmentsProps {
    appointments: Appointment[];
    onConfirm?: (id: string) => void;
    onCancel?: (id: string) => void;
}

const statusConfig = {
    scheduled: { label: 'Agendado', color: 'bg-blue-100 text-blue-800' },
    confirmed: { label: 'Confirmado', color: 'bg-green-100 text-green-800' },
    cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-800' },
    completed: { label: 'Realizado', color: 'bg-gray-100 text-gray-800' },
    no_show: { label: 'No-show', color: 'bg-orange-100 text-orange-800' }
};

export function UpcomingAppointments({ appointments, onConfirm, onCancel }: UpcomingAppointmentsProps) {
    const formatTime = (date: string) => {
        return new Date(date).toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatDate = (date: string) => {
        const d = new Date(date);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        if (d.toDateString() === today.toDateString()) {
            return 'Hoje';
        } else if (d.toDateString() === tomorrow.toDateString()) {
            return 'Amanhã';
        }
        return d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' });
    };

    const getTimeUntil = (date: string) => {
        return formatDistanceToNow(new Date(date), { addSuffix: true, locale: ptBR });
    };

    if (!appointments || appointments.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Próximos Agendamentos
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground text-center py-8">
                        Nenhum agendamento próximo
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Próximos Agendamentos
                </CardTitle>
                <Badge variant="secondary">{appointments.length}</Badge>
            </CardHeader>
            <CardContent className="space-y-4">
                {appointments.map((apt) => {
                    const status = statusConfig[apt.status] || statusConfig.scheduled;
                    const attendeeName = apt.attendee_name || apt.leads?.name || 'Sem nome';
                    const attendeePhone = apt.attendee_phone || apt.leads?.phone;

                    return (
                        <div
                            key={apt.id}
                            className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                {/* Time Block */}
                                <div className="text-center min-w-[60px]">
                                    <div className="text-xs text-muted-foreground">
                                        {formatDate(apt.start_time)}
                                    </div>
                                    <div className="text-lg font-bold">
                                        {formatTime(apt.start_time)}
                                    </div>
                                </div>

                                {/* Divider */}
                                <div className="h-10 w-px bg-border" />

                                {/* Details */}
                                <div>
                                    <div className="font-medium flex items-center gap-2">
                                        <User className="h-3 w-3" />
                                        {attendeeName}
                                    </div>
                                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {getTimeUntil(apt.start_time)}
                                        {attendeePhone && (
                                            <>
                                                <span className="mx-1">•</span>
                                                <Phone className="h-3 w-3" />
                                                {attendeePhone}
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2">
                                <Badge className={status.color}>
                                    {status.label}
                                </Badge>

                                {apt.status === 'scheduled' && (
                                    <div className="flex gap-1">
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                                            onClick={() => onConfirm?.(apt.id)}
                                        >
                                            <CheckCircle className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                            onClick={() => onCancel?.(apt.id)}
                                        >
                                            <XCircle className="h-4 w-4" />
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </CardContent>
        </Card>
    );
}
