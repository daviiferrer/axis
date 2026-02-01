'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Activity, AlertTriangle, CheckCircle, XCircle, Wifi } from "lucide-react";

interface HealthStatus {
    status: 'healthy' | 'degraded' | 'down';
    waha_sessions: {
        active: number;
        total: number;
    };
    db_latency_ms: number;
    last_check: string;
}

interface HealthStatusCardProps {
    health: HealthStatus;
}

export function HealthStatusCard({ health }: HealthStatusCardProps) {
    const statusConfig = {
        healthy: {
            icon: CheckCircle,
            color: 'text-green-500',
            bgColor: 'bg-green-500/10',
            borderColor: 'border-green-500/20',
            label: 'Sistema OK',
            description: 'Todos os serviços operacionais'
        },
        degraded: {
            icon: AlertTriangle,
            color: 'text-yellow-500',
            bgColor: 'bg-yellow-500/10',
            borderColor: 'border-yellow-500/20',
            label: 'Degradado',
            description: 'Alguns serviços com lentidão'
        },
        down: {
            icon: XCircle,
            color: 'text-red-500',
            bgColor: 'bg-red-500/10',
            borderColor: 'border-red-500/20',
            label: 'Indisponível',
            description: 'Serviços fora do ar'
        }
    };

    const config = statusConfig[health.status] || statusConfig.down;
    const StatusIcon = config.icon;

    return (
        <Card className={cn("relative overflow-hidden", config.borderColor, "border-2")}>
            <div className={cn("absolute inset-0 opacity-50", config.bgColor)} />
            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Status do Sistema</CardTitle>
                <StatusIcon className={cn("h-5 w-5", config.color)} />
            </CardHeader>
            <CardContent className="relative">
                <div className={cn("text-2xl font-bold", config.color)}>
                    {config.label}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                    {config.description}
                </p>

                {/* Session indicator */}
                <div className="mt-4 flex items-center gap-2 text-xs">
                    <Wifi className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">
                        WhatsApp: {health.waha_sessions.active}/{health.waha_sessions.total} sessões
                    </span>
                </div>

                {/* Latency indicator */}
                <div className="mt-1 flex items-center gap-2 text-xs">
                    <Activity className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">
                        Latência DB: {health.db_latency_ms}ms
                    </span>
                </div>
            </CardContent>
        </Card>
    );
}
