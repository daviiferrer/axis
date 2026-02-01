'use client';

import { useEffect, useState } from "react";
import { TokensChart } from "@/components/dashboard/tokens-chart";
import { LeadsHeatmap } from "@/components/dashboard/leads-heatmap";
import { HealthStatusCard } from "@/components/dashboard/health-status-card";
import { CostProgressBar } from "@/components/dashboard/cost-progress-bar";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    RefreshCw, Users, MessageSquare, CheckCircle, Clock,
    BarChart3, Activity, AlertTriangle, Zap, Wallet, TrendingUp
} from "lucide-react";
import api from "@/services/api";
import { cn } from "@/lib/utils";

// --- TYPES ---
interface DashboardOverview {
    health: {
        status: 'healthy' | 'degraded' | 'down';
        waha_sessions: { active: number; total: number };
        db_latency_ms: number;
        last_check: string;
    };
    costs: {
        cost_today_brl: string;
        cost_yesterday_brl: string;
        projected_month_brl: string;
        tokens_used: number;
        trend: string;
    };
    leads: {
        total: number;
        today: number;
        active: number;
        conversions: number;
        conversions_today: number;
        conversion_rate: number;
        trend: string;
    };
    ai_tokens: {
        used: number;
        limit: number;
        usage_percentage: string;
        by_model: Record<string, number>;
    };
    last_updated: string;
}

interface TemporalData {
    leads_by_hour: Array<{ hour: number; count: number; peak: boolean }>;
    peak_hour: number;
    peak_count: number;
}

interface ActivityItem {
    id: string;
    name: string;
    status: string;
    last_message_at: string;
    score: number;
    campaigns?: { name: string };
}

interface CampaignMetric {
    id: string;
    name: string;
    type: 'inbound' | 'outbound';
    status: string;
    leads_count: number;
    conversions: number;
    active_leads: number;
    conversion_rate: number;
}

interface CampaignData {
    campaigns: CampaignMetric[];
    totals: {
        inbound: { leads: number; conversions: number; campaigns: number };
        outbound: { leads: number; conversions: number; campaigns: number };
    };
}

interface LeadsBySource {
    inbound: number;
    outbound: number;
    total: number;
    percentages: {
        inbound: number;
        outbound: number;
    };
}

interface MetricsData {
    uptime_seconds: number;
    total_requests: number;
    total_errors: number;
    error_rate: string;
    routes: Record<string, {
        count: number;
        avg_ms: number;
        p95_ms: number;
        p99_ms: number;
    }>;
    errors_by_route: Record<string, number>;
}

// --- MAIN COMPONENT ---
export default function DashboardPage() {
    const [overview, setOverview] = useState<DashboardOverview | null>(null);
    const [temporal, setTemporal] = useState<TemporalData | null>(null);
    const [activity, setActivity] = useState<ActivityItem[]>([]);
    const [campaignData, setCampaignData] = useState<CampaignData | null>(null);
    const [leadsBySource, setLeadsBySource] = useState<LeadsBySource | null>(null);
    const [metrics, setMetrics] = useState<MetricsData | null>(null);

    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function loadDashboard() {
        try {
            const [overviewRes, temporalRes, activityRes, campaignsRes, leadsSourceRes, metricsRes] = await Promise.all([
                api.get('/dashboard/overview'),
                api.get('/dashboard/temporal?days=7').catch(() => ({ data: null })),
                api.get('/dashboard/activity?limit=10').catch(() => ({ data: [] })),
                api.get('/dashboard/campaigns').catch(() => ({ data: null })),
                api.get('/dashboard/leads-by-source').catch(() => ({ data: null })),
                api.get('/metrics').catch(() => ({ data: null }))
            ]);

            setOverview(overviewRes.data);
            setTemporal(temporalRes.data);
            setActivity(activityRes.data || []);
            setCampaignData(campaignsRes.data);
            setLeadsBySource(leadsSourceRes.data);
            setMetrics(metricsRes.data);
            setError(null);
        } catch (err: any) {
            console.error("Failed to load dashboard", err);
            setError("Erro de conexão. Verifique se o backend está rodando.");
        }
    }

    async function refresh() {
        setIsRefreshing(true);
        await loadDashboard();
        setIsRefreshing(false);
    }

    useEffect(() => {
        setIsLoading(true);
        loadDashboard().finally(() => setIsLoading(false));
        const interval = setInterval(loadDashboard, 60 * 1000); // 1 min refresh
        return () => clearInterval(interval);
    }, []);

    if (isLoading) return <DashboardSkeleton />;
    if (!overview) return <DashboardError error={error} refresh={refresh} isRefreshing={isRefreshing} />;

    const trendIsPositive = overview.leads.trend?.startsWith('+');

    return (
        <div className="flex-1 space-y-6 p-6 pt-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Dashboard ÁXIS</h2>
                    <p className="text-muted-foreground text-sm">
                        Monitoramento em tempo real
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground hidden md:inline-block">
                        Atualizado: {new Date(overview.last_updated).toLocaleTimeString()}
                    </span>
                    <Button variant="outline" size="sm" onClick={refresh} disabled={isRefreshing}>
                        <RefreshCw className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")} />
                        Atualizar
                    </Button>
                </div>
            </div>

            {/* Main Tabs */}
            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                    <TabsTrigger value="leads">Leads</TabsTrigger>
                    <TabsTrigger value="messages">Mensagens</TabsTrigger>
                    <TabsTrigger value="costs">Custos & IA</TabsTrigger>
                    <TabsTrigger value="ops">Operação</TabsTrigger>
                </TabsList>

                {/* --- OVERVIEW TAB --- */}
                <TabsContent value="overview" className="space-y-4">
                    {/* TIER 1: Critical Metrics */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <HealthStatusCard health={overview.health} />
                        <CostProgressBar costs={overview.costs} budget={1000} />

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Conversão</CardTitle>
                                <CheckCircle className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{overview.leads.conversion_rate}%</div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {overview.leads.conversions} de {overview.leads.total} leads
                                </p>
                                <p className={cn("text-xs mt-2", trendIsPositive ? 'text-green-500' : 'text-red-500')}>
                                    {overview.leads.trend} vs período anterior
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Leads Hoje</CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{overview.leads.today}</div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {overview.leads.active} ativos em negociação
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* TIER 2: Charts Overview */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                        <div className="col-span-4">
                            {temporal && <LeadsHeatmap data={temporal} />}
                        </div>
                        <div className="col-span-3">
                            <TokensChart data={overview.ai_tokens} />
                        </div>
                    </div>
                </TabsContent>

                {/* --- LEADS TAB --- */}
                <TabsContent value="leads" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {/* Leads Source Distribution */}
                        {leadsBySource && (
                            <Card className="col-span-1">
                                <CardHeader>
                                    <CardTitle>Origem dos Leads</CardTitle>
                                    <CardDescription>Inbound vs Outbound</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4 mt-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full bg-blue-500" />
                                                <span className="text-sm font-medium">Inbound (Ads/Direct)</span>
                                            </div>
                                            <span className="font-bold">{leadsBySource.percentages.inbound}%</span>
                                        </div>
                                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                                            <div className="h-full bg-blue-500" style={{ width: `${leadsBySource.percentages.inbound}%` }} />
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full bg-purple-500" />
                                                <span className="text-sm font-medium">Outbound (Ativo)</span>
                                            </div>
                                            <span className="font-bold">{leadsBySource.percentages.outbound}%</span>
                                        </div>
                                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                                            <div className="h-full bg-purple-500" style={{ width: `${leadsBySource.percentages.outbound}%` }} />
                                        </div>
                                        <div className="pt-4 text-center text-sm text-muted-foreground">
                                            Total de {leadsBySource.total} leads analisados
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Recent Activity List */}
                        <Card className="col-span-2">
                            <CardHeader>
                                <CardTitle>Atividade Recente</CardTitle>
                                <CardDescription>Últimas interações de leads</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {activity.map((item) => (
                                        <div key={item.id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                                            <div className="flex items-center gap-3">
                                                <div className={cn("w-2 h-2 rounded-full",
                                                    item.status === 'converted' ? 'bg-green-500' :
                                                        item.status === 'lost' ? 'bg-red-500' : 'bg-yellow-500'
                                                )} />
                                                <div>
                                                    <p className="text-sm font-medium">{item.name}</p>
                                                    <p className="text-xs text-muted-foreground">{item.campaigns?.name || 'Sem campanha'}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <Badge variant="outline" className="mb-1">{item.status}</Badge>
                                                <p className="text-xs text-muted-foreground">
                                                    {new Date(item.last_message_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Campaign Performance Table */}
                    {campaignData && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Performance por Campanha</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-1">
                                    {campaignData.campaigns.map((camp) => (
                                        <div key={camp.id} className="grid grid-cols-12 gap-4 items-center py-3 border-b last:border-0 hover:bg-muted/50 px-2 rounded-sm transition-colors">
                                            <div className="col-span-4 font-medium flex items-center gap-2">
                                                <Badge variant={camp.type === 'inbound' ? 'default' : 'secondary'} className="text-[10px] h-5">
                                                    {camp.type === 'inbound' ? 'IN' : 'OUT'}
                                                </Badge>
                                                {camp.name}
                                            </div>
                                            <div className="col-span-2 text-sm text-center">
                                                <span className="block font-bold">{camp.leads_count}</span>
                                                <span className="text-xs text-muted-foreground">Leads</span>
                                            </div>
                                            <div className="col-span-2 text-sm text-center">
                                                <span className="block font-bold text-green-600">{camp.conversions}</span>
                                                <span className="text-xs text-muted-foreground">Vendas</span>
                                            </div>
                                            <div className="col-span-2 text-sm text-center">
                                                <Badge variant="outline" className={cn(
                                                    camp.conversion_rate > 15 ? "bg-green-50 text-green-700 border-green-200" : ""
                                                )}>
                                                    {camp.conversion_rate}% Conv.
                                                </Badge>
                                            </div>
                                            <div className="col-span-2 text-right">
                                                <Button variant="ghost" size="sm" className="h-7 text-xs">Detalhes</Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                {/* --- MESSAGES TAB --- */}
                <TabsContent value="messages" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Requests / Min</CardTitle>
                                <Activity className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {metrics ? (metrics.total_requests / (metrics.uptime_seconds / 60 || 1)).toFixed(1) : '...'}
                                </div>
                                <p className="text-xs text-muted-foreground">Volume de tráfego</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Taxa de Erro</CardTitle>
                                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-red-500">
                                    {metrics?.error_rate || '0%'}
                                </div>
                                <p className="text-xs text-muted-foreground">Falhas HTTP (4xx/5xx)</p>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* --- COSTS TAB --- */}
                <TabsContent value="costs" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Detalhamento de Custos</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Custo Hoje</p>
                                        <p className="text-2xl font-bold">R$ {overview.costs.cost_today_brl}</p>
                                    </div>
                                    <Wallet className="h-8 w-8 text-primary/50" />
                                </div>
                                <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Projeção Mensal</p>
                                        <p className="text-2xl font-bold">R$ {overview.costs.projected_month_brl}</p>
                                    </div>
                                    <TrendingUp className="h-8 w-8 text-primary/50" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium mb-2">Uso por Modelo (Tokens)</h4>
                                    <div className="space-y-2">
                                        {Object.entries(overview.ai_tokens.by_model).map(([model, count]) => (
                                            <div key={model} className="flex justify-between text-sm">
                                                <span className="capitalize">{model}</span>
                                                <span className="font-mono">{count.toLocaleString()}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <TokensChart data={overview.ai_tokens} />
                    </div>
                </TabsContent>

                {/* --- OPS TAB --- */}
                <TabsContent value="ops" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Performance de Rotas</CardTitle>
                                <CardDescription>Latência P95 (ms)</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {!metrics ? <Skeleton className="h-[200px]" /> : (
                                    <div className="space-y-2">
                                        {Object.entries(metrics.routes)
                                            .sort(([, a], [, b]) => b.p95_ms - a.p95_ms)
                                            .slice(0, 8)
                                            .map(([route, stats]) => (
                                                <div key={route} className="flex items-center justify-between text-sm border-b py-2">
                                                    <div className="font-mono text-xs truncate max-w-[200px]" title={route}>
                                                        {route}
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <span className="text-xs text-muted-foreground">{stats.count} reqs</span>
                                                        <Badge variant={stats.p95_ms > 1000 ? "destructive" : "secondary"}>
                                                            {stats.p95_ms}ms
                                                        </Badge>
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>System Health</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span>Database Latency</span>
                                    <span className={cn(
                                        "font-bold",
                                        overview.health.db_latency_ms < 100 ? "text-green-500" : "text-red-500"
                                    )}>
                                        {overview.health.db_latency_ms} ms
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span>WAHA Sessions</span>
                                    <span className="font-bold">
                                        {overview.health.waha_sessions.active} / {overview.health.waha_sessions.total}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span>Uptime</span>
                                    <span className="font-mono text-xs">
                                        {metrics ? `${(metrics.uptime_seconds / 3600).toFixed(1)} hours` : '...'}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}

// --- HELPER COMPONENTS ---
function DashboardSkeleton() {
    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-10 w-24" />
            </div>
            <Skeleton className="h-10 w-96 mb-6" /> {/* Tabs */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-32 w-full" />)}
            </div>
            <Skeleton className="h-[300px] w-full mt-4" />
        </div>
    );
}

function DashboardError({ error, refresh, isRefreshing }: { error: string | null, refresh: () => void, isRefreshing: boolean }) {
    return (
        <div className="flex-1 flex flex-col items-center justify-center h-[50vh] gap-4">
            <Activity className="h-12 w-12 text-red-500 opacity-50" />
            <h3 className="text-lg font-semibold">Falha ao carregar dashboard</h3>
            <p className="text-muted-foreground text-sm">{error || "Erro desconhecido"}</p>
            <Button variant="outline" onClick={refresh} disabled={isRefreshing}>
                <RefreshCw className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")} />
                Tentar Novamente
            </Button>
        </div>
    );
}
