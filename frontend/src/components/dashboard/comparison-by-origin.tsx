'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { GitCompare, Send, Zap, Clock, DollarSign, TrendingUp } from "lucide-react";

interface SourceComparison {
    name: string;
    type: 'outbound' | 'inbound';
    icon: 'send' | 'zap';
    conversations: number;
    appointments: number;
    conversion_rate: number;
    cost: number;
    cpa: number;
}

interface ComparisonByOriginProps {
    sources: SourceComparison[];
    responseTime?: string;
    clickTime?: string;
    totalRevenue?: string;
    appointmentCount?: number;
    avgTicket?: number;
}

export function ComparisonByOrigin({
    sources,
    responseTime = "2,5h",
    clickTime = "2,3h",
    totalRevenue,
    appointmentCount,
    avgTicket
}: ComparisonByOriginProps) {
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 2
        }).format(value);
    };

    const totals = sources.reduce((acc, s) => ({
        conversations: acc.conversations + s.conversations,
        appointments: acc.appointments + s.appointments,
        cost: acc.cost + s.cost
    }), { conversations: 0, appointments: 0, cost: 0 });

    const outboundBar = sources.find(s => s.type === 'outbound');
    const inboundBar = sources.find(s => s.type === 'inbound');
    const outboundPct = totals.conversations > 0 && outboundBar
        ? (outboundBar.conversations / totals.conversations * 100)
        : 50;

    return (
        <Card className="col-span-2">
            <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <GitCompare className="h-4 w-4" />
                    Comparativo por Origem
                </CardTitle>
            </CardHeader>
            <CardContent>
                {/* Side tabs + Table */}
                <div className="flex gap-4">
                    {/* Left: Source Tabs */}
                    <div className="w-40 space-y-2">
                        {sources.map((source, idx) => {
                            const Icon = source.icon === 'send' ? Send : Zap;
                            const isOutbound = source.type === 'outbound';
                            return (
                                <div
                                    key={idx}
                                    className={cn(
                                        "flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors",
                                        isOutbound
                                            ? "bg-blue-50 border-blue-200"
                                            : "bg-purple-50 border-purple-200"
                                    )}
                                >
                                    <div className={cn(
                                        "p-1.5 rounded",
                                        isOutbound ? "bg-blue-100" : "bg-purple-100"
                                    )}>
                                        <Icon className={cn(
                                            "h-4 w-4",
                                            isOutbound ? "text-blue-600" : "text-purple-600"
                                        )} />
                                    </div>
                                    <div>
                                        <div className="text-xs font-medium">{source.name}</div>
                                        <div className="text-[10px] text-muted-foreground">
                                            {isOutbound ? "(Sendtalk + ads)" : "(Meta Ads)"}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Right: Data Table */}
                    <div className="flex-1">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-xs text-muted-foreground border-b">
                                    <th className="text-left py-2"></th>
                                    <th className="text-right py-2">Conversas</th>
                                    <th className="text-right py-2">Agend.</th>
                                    <th className="text-right py-2">Conversão</th>
                                    <th className="text-right py-2">Custo</th>
                                    <th className="text-right py-2">CPA</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sources.map((source, idx) => {
                                    const Icon = source.icon === 'send' ? Send : Zap;
                                    const isOutbound = source.type === 'outbound';
                                    return (
                                        <tr key={idx} className="border-b">
                                            <td className="py-3">
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline" className={cn(
                                                        "text-[10px] px-1.5",
                                                        isOutbound
                                                            ? "bg-blue-50 text-blue-700"
                                                            : "bg-purple-50 text-purple-700"
                                                    )}>
                                                        <Icon className="h-3 w-3 mr-1" />
                                                        {isOutbound ? 'OUT' : 'ADS'}
                                                    </Badge>
                                                </div>
                                            </td>
                                            <td className="text-right font-medium">{source.conversations}</td>
                                            <td className="text-right font-medium">{source.appointments}</td>
                                            <td className={cn(
                                                "text-right font-bold",
                                                source.conversion_rate >= 20 ? "text-green-600" :
                                                    source.conversion_rate >= 10 ? "text-yellow-600" :
                                                        "text-red-600"
                                            )}>
                                                {source.conversion_rate.toFixed(1)}%
                                            </td>
                                            <td className="text-right">{formatCurrency(source.cost)}</td>
                                            <td className="text-right font-medium">{formatCurrency(source.cpa)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>

                        {/* Time Stats Bar */}
                        <div className="mt-4 grid grid-cols-3 gap-4">
                            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                                <Clock className="h-5 w-5 text-muted-foreground" />
                                <div>
                                    <div className="text-lg font-bold">{responseTime}</div>
                                    <div className="text-[10px] text-muted-foreground">Tempo até Resposta</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                                <TrendingUp className="h-5 w-5 text-green-500" />
                                <div>
                                    <div className="text-lg font-bold">{clickTime}</div>
                                    <div className="text-[10px] text-muted-foreground">Tempo até Clique</div>
                                </div>
                            </div>
                            {totalRevenue && (
                                <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                                    <DollarSign className="h-5 w-5 text-green-600" />
                                    <div>
                                        <div className="text-lg font-bold text-green-600">{totalRevenue}</div>
                                        <div className="text-[10px] text-muted-foreground">
                                            {appointmentCount} agend x R$ {avgTicket} ticket médio
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Progress Bar */}
                        <div className="mt-4">
                            <div className="flex h-2 rounded-full overflow-hidden">
                                <div
                                    className="bg-blue-500 transition-all"
                                    style={{ width: `${outboundPct}%` }}
                                />
                                <div
                                    className="bg-purple-500 transition-all"
                                    style={{ width: `${100 - outboundPct}%` }}
                                />
                            </div>
                            <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                                <span>SENDTALK (Outbound)</span>
                                <span>ADS (Inbound)</span>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
