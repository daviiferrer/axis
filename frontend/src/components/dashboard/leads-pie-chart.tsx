'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { PieChart, MessageSquare, Megaphone } from "lucide-react";

interface LeadsSourceData {
    inbound: {
        count: number;
        percentage: number;
        label: string;
    };
    outbound: {
        count: number;
        percentage: number;
        label: string;
    };
    total: number;
}

interface LeadsPieChartProps {
    data: LeadsSourceData;
}

export function LeadsPieChart({ data }: LeadsPieChartProps) {
    // Calculate angles for simple CSS pie chart
    const inboundAngle = (data.inbound.percentage / 100) * 360;

    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <PieChart className="h-4 w-4" />
                    Proporção das Conversas
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex items-center gap-6">
                    {/* Pie Chart */}
                    <div className="relative">
                        <div
                            className="w-32 h-32 rounded-full"
                            style={{
                                background: `conic-gradient(
                                    #3b82f6 0deg ${inboundAngle}deg,
                                    #8b5cf6 ${inboundAngle}deg 360deg
                                )`
                            }}
                        />
                        {/* Center hole for donut effect */}
                        <div className="absolute inset-4 bg-background rounded-full flex items-center justify-center">
                            <div className="text-center">
                                <div className="text-lg font-bold">{data.total}</div>
                                <div className="text-[10px] text-muted-foreground">Total</div>
                            </div>
                        </div>
                    </div>

                    {/* Legend */}
                    <div className="flex-1 space-y-4">
                        {/* Outbound */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-sm bg-purple-500" />
                                <div className="flex items-center gap-1">
                                    <Megaphone className="h-3 w-3 text-purple-500" />
                                    <span className="text-sm">{data.outbound.label}</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="font-bold">{data.outbound.percentage}%</span>
                            </div>
                        </div>

                        {/* Inbound */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-sm bg-blue-500" />
                                <div className="flex items-center gap-1">
                                    <MessageSquare className="h-3 w-3 text-blue-500" />
                                    <span className="text-sm">{data.inbound.label}</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="font-bold">{data.inbound.percentage}%</span>
                            </div>
                        </div>

                        {/* Counts */}
                        <div className="pt-3 border-t">
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>Outbound: {data.outbound.count}</span>
                                <span>Inbound: {data.inbound.count}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
