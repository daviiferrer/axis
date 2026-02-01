'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface TemporalData {
    leads_by_hour: Array<{
        hour: number;
        count: number;
        peak: boolean;
    }>;
    peak_hour: number;
    peak_count: number;
}

interface LeadsHeatmapProps {
    data: TemporalData;
}

export function LeadsHeatmap({ data }: LeadsHeatmapProps) {
    const maxCount = Math.max(...data.leads_by_hour.map(h => h.count), 1);

    const getIntensity = (count: number) => {
        const ratio = count / maxCount;
        if (ratio === 0) return 'bg-muted';
        if (ratio < 0.25) return 'bg-blue-200 dark:bg-blue-900';
        if (ratio < 0.5) return 'bg-blue-400 dark:bg-blue-700';
        if (ratio < 0.75) return 'bg-blue-500 dark:bg-blue-600';
        return 'bg-blue-600 dark:bg-blue-500';
    };

    const formatHour = (hour: number) => {
        return `${hour.toString().padStart(2, '0')}h`;
    };

    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                    Atividade por Horário
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                    Leads recebidos nos últimos 7 dias
                </p>
            </CardHeader>
            <CardContent>
                {/* Heatmap grid */}
                <div className="grid grid-cols-12 gap-1">
                    {data.leads_by_hour.map(({ hour, count, peak }) => (
                        <div
                            key={hour}
                            className={cn(
                                "relative aspect-square rounded-sm transition-all hover:scale-110 cursor-pointer",
                                getIntensity(count),
                                peak && "ring-2 ring-yellow-500 ring-offset-1"
                            )}
                            title={`${formatHour(hour)}: ${count} leads`}
                        >
                            {peak && (
                                <span className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-500 rounded-full" />
                            )}
                        </div>
                    ))}
                </div>

                {/* Hour labels */}
                <div className="grid grid-cols-12 gap-1 mt-1">
                    {[0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22].map(hour => (
                        <div key={hour} className="text-[10px] text-muted-foreground text-center">
                            {hour}h
                        </div>
                    ))}
                </div>

                {/* Legend */}
                <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Menos</span>
                        <div className="flex gap-0.5">
                            <div className="w-3 h-3 rounded-sm bg-muted" />
                            <div className="w-3 h-3 rounded-sm bg-blue-200 dark:bg-blue-900" />
                            <div className="w-3 h-3 rounded-sm bg-blue-400 dark:bg-blue-700" />
                            <div className="w-3 h-3 rounded-sm bg-blue-500 dark:bg-blue-600" />
                            <div className="w-3 h-3 rounded-sm bg-blue-600 dark:bg-blue-500" />
                        </div>
                        <span className="text-xs text-muted-foreground">Mais</span>
                    </div>

                    {/* Peak indicator */}
                    <div className="flex items-center gap-1 text-xs">
                        <span className="w-2 h-2 bg-yellow-500 rounded-full" />
                        <span className="text-muted-foreground">
                            Pico: {formatHour(data.peak_hour)} ({data.peak_count} leads)
                        </span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
