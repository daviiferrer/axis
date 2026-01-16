'use client';

import React from 'react';
import useSWR from 'swr';
import { adminService } from '@/services/admin';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Link from 'next/link';
import { Activity, Users, MessageSquare, Server, Settings } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminDashboard() {
    const { user, loading } = useAuth();
    const router = useRouter();

    const { data: stats, error, isLoading } = useSWR(
        (user as any)?.is_super_admin ? 'admin-stats' : null,
        adminService.getStats,
        { refreshInterval: 5000 }
    );

    useEffect(() => {
        if (!loading && !(user as any)?.is_super_admin) {
            router.push('/app');
        }
    }, [user, loading, router]);

    if (loading || isLoading) {
        return <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>;
    }

    if (!(user as any)?.is_super_admin) {
        return null; // Or a nice "Unauthorized" component
    }

    if (error) {
        return <div className="p-4 border border-red-200 bg-red-50 text-red-600 rounded-lg">Erro ao carregar estatísticas. Verifique se você tem permissão de admin.</div>;
    }

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold tracking-tight">Visão Geral</h1>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Link href="/app/admin/users">
                    <Card className="hover:bg-accent/50 transition-colors cursor-pointer h-full">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Usuários</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
                            <p className="text-xs text-muted-foreground">
                                {stats?.activeUsers || 0} ativos agora
                            </p>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/app/admin/settings">
                    <Card className="hover:bg-accent/50 transition-colors cursor-pointer border-purple-200 bg-purple-50/30 h-full">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-purple-900">Configurações SaaS</CardTitle>
                            <Settings className="h-4 w-4 text-purple-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-purple-700">Sistema</div>
                            <p className="text-xs text-purple-600/80">
                                Manutenção, Logs e Acessos
                            </p>
                        </CardContent>
                    </Card>
                </Link>

                <Card className="h-full">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Sessões Ativas</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.activeSessions || 0}</div>
                        <p className="text-xs text-muted-foreground">{stats?.totalSessions || 0} total hoje</p>
                    </CardContent>
                </Card>

                <Card className="h-full">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Status do Sistema</CardTitle>
                        <Server className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">Healthy</div>
                        <p className="text-xs text-muted-foreground">Uptime: 99.9%</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Atividade Recente</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[200px] flex items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg">
                            Gráfico de Atividade (Placeholder)
                        </div>
                    </CardContent>
                </Card>
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Log do Sistema</CardTitle>
                        <CardDescription>Eventos recentes do servidor</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="flex items-center">
                                    <span className="relative flex h-2 w-2 mr-4">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
                                    </span>
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium leading-none">Novo usuário registrado</p>
                                        <p className="text-xs text-muted-foreground">Há 2 minutos</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div >
    );
}
