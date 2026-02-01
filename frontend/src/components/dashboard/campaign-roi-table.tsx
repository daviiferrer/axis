'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Megaphone, TrendingUp, TrendingDown, Target } from "lucide-react";

interface CampaignMetrics {
    id: string;
    name: string;
    type: 'inbound' | 'outbound';
    conversations: number;
    appointments: number;
    conversions: number;
    conversion_rate: number;
    cost_brl: number;
    cpa_brl: number;
    revenue_brl?: number;
    roi?: number;
}

interface CampaignROITableProps {
    campaigns: CampaignMetrics[];
}

export function CampaignROITable({ campaigns }: CampaignROITableProps) {
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 2
        }).format(value);
    };

    // Calculate totals
    const totals = campaigns.reduce((acc, c) => ({
        conversations: acc.conversations + c.conversations,
        appointments: acc.appointments + c.appointments,
        conversions: acc.conversions + c.conversions,
        cost_brl: acc.cost_brl + c.cost_brl,
        revenue_brl: acc.revenue_brl + (c.revenue_brl || 0)
    }), { conversations: 0, appointments: 0, conversions: 0, cost_brl: 0, revenue_brl: 0 });

    const totalConversionRate = totals.conversations > 0
        ? ((totals.conversions / totals.conversations) * 100).toFixed(1)
        : '0';
    const avgCPA = totals.conversions > 0
        ? totals.cost_brl / totals.conversions
        : 0;
    const totalROI = totals.cost_brl > 0
        ? ((totals.revenue_brl - totals.cost_brl) / totals.cost_brl * 100).toFixed(0)
        : 0;

    if (!campaigns || campaigns.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Megaphone className="h-4 w-4" />
                        Campanhas de Anúncio
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground text-center py-4">
                        Nenhuma campanha com dados
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Megaphone className="h-4 w-4" />
                    Campanhas de Anúncio
                </CardTitle>
                <div className="flex items-center gap-2 text-xs">
                    <span className="text-muted-foreground">ROI Total:</span>
                    <span className={cn(
                        "font-bold",
                        Number(totalROI) > 0 ? "text-green-600" : "text-red-600"
                    )}>
                        {totalROI}%
                    </span>
                </div>
            </CardHeader>
            <CardContent>
                {/* Table Header */}
                <div className="grid grid-cols-6 gap-2 text-xs font-medium text-muted-foreground py-2 border-b">
                    <div>Campanha</div>
                    <div className="text-right">Conversas</div>
                    <div className="text-right">Conv.</div>
                    <div className="text-right">Taxa</div>
                    <div className="text-right">Custo</div>
                    <div className="text-right">CPA</div>
                </div>

                {/* Campaign Rows */}
                <div className="space-y-1">
                    {campaigns.map((campaign) => (
                        <div
                            key={campaign.id}
                            className="grid grid-cols-6 gap-2 items-center py-2 text-sm hover:bg-muted/50 rounded"
                        >
                            <div className="flex items-center gap-2">
                                <Badge
                                    variant="outline"
                                    className={cn(
                                        "text-[10px] px-1",
                                        campaign.type === 'inbound'
                                            ? "bg-green-50 text-green-700 border-green-200"
                                            : "bg-blue-50 text-blue-700 border-blue-200"
                                    )}
                                >
                                    {campaign.type === 'inbound' ? 'IN' : 'OUT'}
                                </Badge>
                                <span className="truncate text-xs">{campaign.name}</span>
                            </div>
                            <div className="text-right font-medium">{campaign.conversations}</div>
                            <div className="text-right font-medium">{campaign.conversions}</div>
                            <div className={cn(
                                "text-right font-bold",
                                campaign.conversion_rate >= 20 ? "text-green-600" :
                                    campaign.conversion_rate >= 10 ? "text-yellow-600" :
                                        "text-red-600"
                            )}>
                                {campaign.conversion_rate.toFixed(1)}%
                            </div>
                            <div className="text-right text-muted-foreground text-xs">
                                {formatCurrency(campaign.cost_brl)}
                            </div>
                            <div className="text-right font-medium text-xs">
                                {formatCurrency(campaign.cpa_brl)}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Totals Row */}
                <div className="grid grid-cols-6 gap-2 items-center py-2 mt-2 border-t text-sm font-bold">
                    <div>Total</div>
                    <div className="text-right">{totals.conversations}</div>
                    <div className="text-right">{totals.conversions}</div>
                    <div className="text-right text-green-600">{totalConversionRate}%</div>
                    <div className="text-right text-xs">{formatCurrency(totals.cost_brl)}</div>
                    <div className="text-right text-xs">{formatCurrency(avgCPA)}</div>
                </div>
            </CardContent>
        </Card>
    );
}
