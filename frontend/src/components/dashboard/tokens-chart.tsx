'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Cpu } from "lucide-react";

interface AiTokensData {
    used: number;
    limit: number;
    usage_percentage: string;
    by_model: Record<string, number>;
}

interface TokensChartProps {
    data: AiTokensData;
}

// Colors for different models
const MODEL_COLORS: Record<string, string> = {
    'gemini-2.0-flash': 'bg-blue-500',
    'gemini-1.5-flash': 'bg-cyan-500',
    'gemini-1.5-pro': 'bg-indigo-500',
    'text-embedding-004': 'bg-purple-500',
    'claude-3-5-sonnet': 'bg-orange-500',
    'gpt-4': 'bg-green-500',
    'unknown': 'bg-gray-500'
};

export function TokensChart({ data }: TokensChartProps) {
    const models = Object.entries(data.by_model);
    const totalTokens = data.used;

    // Sort by usage (descending)
    models.sort((a, b) => b[1] - a[1]);

    const getModelColor = (model: string) => {
        const normalizedModel = model.toLowerCase();
        for (const key of Object.keys(MODEL_COLORS)) {
            if (normalizedModel.includes(key.toLowerCase())) {
                return MODEL_COLORS[key];
            }
        }
        return MODEL_COLORS.unknown;
    };

    const formatTokens = (tokens: number) => {
        if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(1)}M`;
        if (tokens >= 1000) return `${(tokens / 1000).toFixed(0)}K`;
        return tokens.toString();
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Consumo por Modelo</CardTitle>
                <Cpu className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                {/* Donut-like horizontal bar */}
                <div className="flex h-4 rounded-full overflow-hidden bg-muted">
                    {models.map(([model, tokens]) => {
                        const percentage = (tokens / totalTokens) * 100;
                        if (percentage < 1) return null;

                        return (
                            <div
                                key={model}
                                className={cn(
                                    "transition-all",
                                    getModelColor(model)
                                )}
                                style={{ width: `${percentage}%` }}
                                title={`${model}: ${formatTokens(tokens)}`}
                            />
                        );
                    })}
                </div>

                {/* Legend */}
                <div className="mt-4 space-y-2">
                    {models.map(([model, tokens]) => {
                        const percentage = (tokens / totalTokens) * 100;

                        return (
                            <div key={model} className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2">
                                    <div className={cn(
                                        "w-3 h-3 rounded-sm",
                                        getModelColor(model)
                                    )} />
                                    <span className="text-muted-foreground truncate max-w-[120px]">
                                        {model}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="font-medium">{formatTokens(tokens)}</span>
                                    <span className="text-muted-foreground w-12 text-right">
                                        {percentage.toFixed(0)}%
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Total */}
                <div className="mt-4 pt-4 border-t flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                        Total este mês
                    </span>
                    <span className="text-sm font-bold">
                        {formatTokens(totalTokens)} tokens
                    </span>
                </div>

                {/* Usage vs Limit */}
                <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                        Limite do plano
                    </span>
                    <span className={cn(
                        "font-medium",
                        parseFloat(data.usage_percentage) >= 80 ? "text-red-500" :
                            parseFloat(data.usage_percentage) >= 60 ? "text-yellow-500" :
                                "text-green-500"
                    )}>
                        {data.usage_percentage}% utilizado
                    </span>
                </div>
            </CardContent>
        </Card>
    );
}
