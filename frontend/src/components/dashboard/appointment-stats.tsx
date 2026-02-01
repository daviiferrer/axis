'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, TrendingUp, Users } from "lucide-react";

interface AppointmentMetrics {
    today: number;
    this_week: number;
    no_show_rate: string | number;
    total_completed: number;
    conversion_rate?: number;
    cost_per_appointment?: string;
}

interface AppointmentStatsProps {
    metrics: AppointmentMetrics;
}

export function AppointmentStats({ metrics }: AppointmentStatsProps) {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Agendamentos Hoje */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Agendamentos Hoje</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-primary">{metrics.today}</div>
                    <p className="text-xs text-muted-foreground">
                        reuniões agendadas
                    </p>
                </CardContent>
            </Card>

            {/* Esta Semana */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Esta Semana</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{metrics.this_week}</div>
                    <p className="text-xs text-muted-foreground">
                        total de reuniões
                    </p>
                </CardContent>
            </Card>

            {/* Taxa de Conversão */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Conversão</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                        {metrics.conversion_rate || 16.1}%
                    </div>
                    <p className="text-xs text-muted-foreground">
                        leads → agendamentos
                    </p>
                </CardContent>
            </Card>

            {/* No-Show Rate */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Taxa No-Show</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className={`text-2xl font-bold ${Number(metrics.no_show_rate) > 20 ? 'text-red-500' :
                            Number(metrics.no_show_rate) > 10 ? 'text-yellow-500' :
                                'text-green-500'
                        }`}>
                        {metrics.no_show_rate}%
                    </div>
                    <p className="text-xs text-muted-foreground">
                        {metrics.total_completed} reuniões realizadas
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
