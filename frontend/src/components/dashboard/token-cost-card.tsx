'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { DollarSign, TrendingUp, TrendingDown, Coins, Zap, Calendar } from "lucide-react";

interface TokenCostData {
    cost_today_brl: string;
    cost_yesterday_brl: string;
    cost_week_brl?: string;
    cost_month_brl: string;
    projected_month_brl: string;
    tokens_used: number;
    tokens_limit?: number;
    trend: string;
    by_model?: Record<string, { tokens: number; cost_brl: number }>;
}

interface TokenCostCardProps {
    data: TokenCostData;
}

export function TokenCostCard({ data }: TokenCostCardProps) {
    const todayCost = parseFloat(data.cost_today_brl) || 0;
    const yesterdayCost = parseFloat(data.cost_yesterday_brl) || 0;
    const monthCost = parseFloat(data.cost_month_brl) || 0;
    const projectedCost = parseFloat(data.projected_month_brl) || 0;

    const trendValue = parseFloat(data.trend.replace('%', '').replace('+', '')) || 0;
    const isPositiveTrend = data.trend.startsWith('+');

    // Calculate cost per 1K tokens (rough estimate)
    const costPerKToken = data.tokens_used > 0
        ? (monthCost / (data.tokens_used / 1000)).toFixed(4)
        : '0.00';

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    const formatTokens = (tokens: number) => {
        if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(2)}M`;
        if (tokens >= 1000) return `${(tokens / 1000).toFixed(1)}K`;
        return tokens.toString();
    };

    return (
        <Card className="col-span-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Coins className="h-4 w-4 text-yellow-500" />
                    Consumo de IA
                </CardTitle>
                <span className={cn(
                    "text-xs font-medium flex items-center gap-1",
                    isPositiveTrend ? "text-red-500" : "text-green-500"
                )}>
                    {isPositiveTrend ? (
                        <TrendingUp className="h-3 w-3" />
                    ) : (
                        <TrendingDown className="h-3 w-3" />
                    )}
                    {data.trend} vs ontem
                </span>
            </CardHeader>
            <CardContent>
                {/* Main Cost Display */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <div className="text-xs text-muted-foreground mb-1">Hoje</div>
                        <div className="text-xl font-bold text-primary">
                            {formatCurrency(todayCost)}
                        </div>
                    </div>
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <div className="text-xs text-muted-foreground mb-1">Este Mês</div>
                        <div className="text-xl font-bold">
                            {formatCurrency(monthCost)}
                        </div>
                    </div>
                    <div className="text-center p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                        <div className="text-xs text-muted-foreground mb-1">Projeção Mês</div>
                        <div className="text-xl font-bold text-blue-600">
                            {formatCurrency(projectedCost)}
                        </div>
                    </div>
                </div>

                {/* Token Stats */}
                <div className="flex items-center justify-between border-t pt-4">
                    <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm text-muted-foreground">Tokens usados:</span>
                        <span className="font-bold">{formatTokens(data.tokens_used)}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                        CPK: {formatCurrency(parseFloat(costPerKToken))} /1K tok
                    </div>
                </div>

                {/* Model Breakdown if available */}
                {data.by_model && Object.keys(data.by_model).length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                        <div className="text-xs font-medium mb-2">Por Modelo:</div>
                        <div className="space-y-1">
                            {Object.entries(data.by_model)
                                .sort((a, b) => b[1].cost_brl - a[1].cost_brl)
                                .slice(0, 3)
                                .map(([model, stats]) => (
                                    <div key={model} className="flex justify-between text-xs">
                                        <span className="text-muted-foreground truncate max-w-[150px]">
                                            {model}
                                        </span>
                                        <span className="font-medium">
                                            {formatCurrency(stats.cost_brl)}
                                        </span>
                                    </div>
                                ))
                            }
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
