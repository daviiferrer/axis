'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { DollarSign, MessageSquare, Calendar, Target, TrendingUp, Clock, Send, Zap } from "lucide-react";

interface TopKPIData {
    gasto_total: number;
    conversas_totais: number;
    agendamentos: number;
    custo_por_agendamento: number;
    taxa_conversao: number;
    envio_ativo?: number;
    trafego_pago?: number;
    receita_total?: number;
}

interface TopKPICardsProps {
    data: TopKPIData;
}

export function TopKPICards({ data }: TopKPICardsProps) {
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 2
        }).format(value);
    };

    const cards = [
        {
            title: "Gasto Total",
            value: formatCurrency(data.gasto_total),
            subtitle: "sendtalk + ads",
            icon: DollarSign,
            color: "text-green-600",
            bgColor: "bg-green-50"
        },
        {
            title: "Conversas Totais",
            value: data.conversas_totais.toString(),
            subtitle: "Outbound + Inbound",
            icon: MessageSquare,
            color: "text-blue-600",
            bgColor: "bg-blue-50"
        },
        {
            title: "Agendamentos",
            value: data.agendamentos.toString(),
            subtitle: `Conversão: ${data.taxa_conversao.toFixed(1)}%`,
            icon: Calendar,
            color: "text-purple-600",
            bgColor: "bg-purple-50"
        },
        {
            title: "Custo por Agendamento",
            value: formatCurrency(data.custo_por_agendamento),
            subtitle: "CPA médio",
            icon: Target,
            color: "text-orange-600",
            bgColor: "bg-orange-50"
        }
    ];

    return (
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            {cards.map((card, index) => {
                const Icon = card.icon;
                return (
                    <Card key={index} className="relative overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                {card.title}
                            </CardTitle>
                            <div className={cn("p-2 rounded-lg", card.bgColor)}>
                                <Icon className={cn("h-4 w-4", card.color)} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className={cn("text-2xl font-bold", card.color)}>
                                {card.value}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {card.subtitle}
                            </p>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}

// Side stats cards (Envio Ativo, Tráfego Pago)
interface SideStatsProps {
    envio_ativo: number;
    trafego_pago: number;
}

export function SideStats({ envio_ativo, trafego_pago }: SideStatsProps) {
    return (
        <div className="space-y-4">
            {/* Envio Ativo */}
            <Card>
                <CardContent className="pt-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Send className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                            <div className="text-xs text-muted-foreground uppercase tracking-wide">
                                Envio Ativo
                            </div>
                            <div className="text-2xl font-bold">{envio_ativo}</div>
                            <div className="text-xs text-muted-foreground">Sendtalk</div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Tráfego Pago */}
            <Card>
                <CardContent className="pt-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                            <Zap className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                            <div className="text-xs text-muted-foreground uppercase tracking-wide">
                                Tráfego Pago
                            </div>
                            <div className="text-2xl font-bold">{trafego_pago}</div>
                            <div className="text-xs text-muted-foreground">(Meta Ads)</div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
