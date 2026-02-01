'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, MessageSquare, Calendar, Target, DollarSign } from "lucide-react";

interface SourceMetrics {
    source: string;
    icon: 'whatsapp' | 'ads' | 'organic';
    conversations: number;
    appointments: number;
    conversion_rate: number;
    cost: number;
    cpa: number;
}

interface ConversionBySourceProps {
    sources: SourceMetrics[];
    responseTime?: string;
    clickTime?: string;
    totalRevenue?: string;
}

const sourceIcons = {
    whatsapp: { icon: MessageSquare, color: 'text-green-600 bg-green-100' },
    ads: { icon: Target, color: 'text-purple-600 bg-purple-100' },
    organic: { icon: TrendingUp, color: 'text-blue-600 bg-blue-100' }
};

export function ConversionBySource({ sources, responseTime, clickTime, totalRevenue }: ConversionBySourceProps) {
    // Calculate totals
    const totalConversations = sources.reduce((sum, s) => sum + s.conversations, 0);
    const totalAppointments = sources.reduce((sum, s) => sum + s.appointments, 0);
    const totalCost = sources.reduce((sum, s) => sum + s.cost, 0);
    const avgConversion = totalConversations > 0
        ? ((totalAppointments / totalConversations) * 100).toFixed(1)
        : 0;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-sm font-medium">
                    Comparativo por Origem
                </CardTitle>
            </CardHeader>
            <CardContent>
                {/* Header Row */}
                <div className="grid grid-cols-6 gap-4 text-xs text-muted-foreground font-medium mb-3 px-2">
                    <div>Origem</div>
                    <div className="text-right">Conversas</div>
                    <div className="text-right">Agendamentos</div>
                    <div className="text-right">Conversão</div>
                    <div className="text-right">Custo</div>
                    <div className="text-right">CPA</div>
                </div>

                {/* Source Rows */}
                <div className="space-y-2">
                    {sources.map((source) => {
                        const config = sourceIcons[source.icon] || sourceIcons.organic;
                        const Icon = config.icon;

                        return (
                            <div
                                key={source.source}
                                className="grid grid-cols-6 gap-4 items-center p-2 rounded-lg hover:bg-muted transition-colors"
                            >
                                <div className="flex items-center gap-2">
                                    <div className={cn("p-1.5 rounded", config.color)}>
                                        <Icon className="h-4 w-4" />
                                    </div>
                                    <span className="text-sm font-medium">{source.source}</span>
                                </div>
                                <div className="text-right font-medium">{source.conversations}</div>
                                <div className="text-right font-medium">{source.appointments}</div>
                                <div className={cn(
                                    "text-right font-bold",
                                    source.conversion_rate >= 20 ? "text-green-600" :
                                        source.conversion_rate >= 10 ? "text-yellow-600" :
                                            "text-red-600"
                                )}>
                                    {source.conversion_rate}%
                                </div>
                                <div className="text-right text-muted-foreground">
                                    R$ {source.cost.toFixed(2)}
                                </div>
                                <div className="text-right font-medium">
                                    R$ {source.cpa.toFixed(2)}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Time Metrics */}
                <div className="mt-4 pt-4 border-t grid grid-cols-3 gap-4">
                    {responseTime && (
                        <div className="text-center">
                            <div className="text-2xl font-bold text-primary">{responseTime}</div>
                            <div className="text-xs text-muted-foreground">Tempo até Resposta</div>
                        </div>
                    )}
                    {clickTime && (
                        <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">{clickTime}</div>
                            <div className="text-xs text-muted-foreground">Tempo até Clique</div>
                        </div>
                    )}
                    {totalRevenue && (
                        <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">{totalRevenue}</div>
                            <div className="text-xs text-muted-foreground">Receita Gerada</div>
                        </div>
                    )}
                </div>

                {/* Totals */}
                <div className="mt-4 pt-4 border-t flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                        Total: {totalConversations} conversas → {totalAppointments} agendamentos
                    </span>
                    <span className="font-bold text-green-600">
                        {avgConversion}% conversão
                    </span>
                </div>
            </CardContent>
        </Card>
    );
}
