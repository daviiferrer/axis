'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Coins, TrendingUp, TrendingDown, ArrowRight } from "lucide-react";

interface CostsData {
    cost_today_brl: string;
    cost_yesterday_brl: string;
    projected_month_brl: string;
    tokens_used: number;
    trend: string;
}

interface CostProgressBarProps {
    costs: CostsData;
    budget?: number; // Monthly budget in BRL
}

export function CostProgressBar({ costs, budget = 1000 }: CostProgressBarProps) {
    const projectedMonth = parseFloat(costs.projected_month_brl) || 0;
    const budgetPercentage = Math.min((projectedMonth / budget) * 100, 100);

    const isPositiveTrend = costs.trend.startsWith('+');
    const trendValue = costs.trend.replace(/[+-]/g, '');

    // Color coding based on budget usage
    const getProgressColor = () => {
        if (budgetPercentage >= 80) return 'bg-red-500';
        if (budgetPercentage >= 60) return 'bg-yellow-500';
        return 'bg-green-500';
    };

    const getStatusLabel = () => {
        if (budgetPercentage >= 80) return 'Atenção';
        if (budgetPercentage >= 60) return 'Monitorar';
        return 'Saudável';
    };

    return (
        <Card className="col-span-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Consumo de IA</CardTitle>
                <Coins className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="flex items-baseline justify-between">
                    <div>
                        <span className="text-3xl font-bold">
                            R$ {parseFloat(costs.cost_today_brl).toFixed(2)}
                        </span>
                        <span className="text-sm text-muted-foreground ml-2">hoje</span>
                    </div>
                    <div className={cn(
                        "flex items-center gap-1 text-sm",
                        isPositiveTrend ? "text-red-500" : "text-green-500"
                    )}>
                        {isPositiveTrend ? (
                            <TrendingUp className="h-4 w-4" />
                        ) : (
                            <TrendingDown className="h-4 w-4" />
                        )}
                        {costs.trend} vs ontem
                    </div>
                </div>

                {/* Progress bar */}
                <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Projeção mensal</span>
                        <span className={cn(
                            "font-medium",
                            budgetPercentage >= 80 ? "text-red-500" :
                                budgetPercentage >= 60 ? "text-yellow-500" :
                                    "text-green-500"
                        )}>
                            {getStatusLabel()}
                        </span>
                    </div>
                    <div className="relative">
                        <Progress
                            value={budgetPercentage}
                            className="h-3"
                        />
                        <div
                            className={cn(
                                "absolute top-0 left-0 h-3 rounded-full transition-all",
                                getProgressColor()
                            )}
                            style={{ width: `${budgetPercentage}%` }}
                        />
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>R$ {costs.projected_month_brl}</span>
                        <span>Budget: R$ {budget.toFixed(2)}</span>
                    </div>
                </div>

                {/* Token usage */}
                <div className="mt-4 pt-4 border-t flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Tokens utilizados este mês</span>
                    <span className="font-medium">
                        {(costs.tokens_used / 1000000).toFixed(2)}M
                    </span>
                </div>
            </CardContent>
        </Card>
    );
}
