'use client';

import { useEffect, useState } from "react";
import { StatsGrid } from "@/components/dashboard/stats-grid";
import { WhatsAppWidget } from "@/components/dashboard/whatsapp-widget";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import api from "@/services/api";

export default function DashboardPage() {
    const [stats, setStats] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    async function loadStats() {
        setIsLoading(true);
        setError(null);
        try {
            const response = await api.get('/analytics/dashboard');
            setStats(response.data.stats);
        } catch (error) {
            console.error("Failed to load dashboard stats", error);
            setError("Não foi possível conectar ao servidor. Verifique se o backend está rodando.");
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        loadStats();
    }, []);

    if (isLoading) {
        return (
            <div className="flex-1 space-y-4 p-8 pt-6">
                <div className="flex items-center justify-between space-y-2">
                    <Skeleton className="h-8 w-40" />
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-32 w-full" />
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex-1 space-y-4 p-8 pt-6 flex flex-col items-center justify-center h-[50vh]">
                <div className="text-center space-y-4">
                    <h2 className="text-xl font-semibold text-red-600">Erro de Conexão</h2>
                    <p className="text-gray-500">{error}</p>
                    <button
                        onClick={loadStats}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                        Tentar Novamente
                    </button>
                    <p className="text-xs text-gray-400">
                        Dica: O backend deve estar rodando em http://localhost:8000
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
            </div>

            {stats && (
                <div className="space-y-4">
                    <StatsGrid stats={stats} />
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                        <div className="col-span-4">
                            {/* Main Chart Area (Future) */}
                            <Card className="h-[300px] flex items-center justify-center text-muted-foreground border-dashed">
                                Gráfico de Leads (Em Breve)
                            </Card>
                        </div>
                        <div className="col-span-3">
                            <WhatsAppWidget />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
