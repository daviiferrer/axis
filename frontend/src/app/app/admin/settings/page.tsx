'use client'

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Shield, Save, Server, Lock, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

export default function AdminSettingsPage() {
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(false);

    // Mock Settings State (In a real app, fetch from API)
    const [settings, setSettings] = useState({
        systemName: 'ÁXIS',
        maintenanceMode: false,
        allowRegistrations: true,
        debugLogging: true,
        maxSessionsPerUser: 5,
        globalAnnouncement: ''
    });

    const handleSave = async () => {
        setIsLoading(true);
        // Simulate API Call
        await new Promise(resolve => setTimeout(resolve, 1000));
        setIsLoading(false);
        toast.success('Configurações salvas com sucesso!');
    };

    if ((user as any)?.role !== 'super_admin' && (user as any)?.role !== 'owner') {
        return (
            <div className="p-8 flex justify-center items-center text-red-500 bg-red-50 rounded-lg border border-red-200 m-8">
                Acesso negado. Apenas super administradores podem acessar esta página.
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto p-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">Configurações do Sistema</h1>
                    <p className="text-muted-foreground mt-1">Gerencie parâmetros globais da plataforma.</p>
                </div>
                <Button onClick={handleSave} disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
                    <Save className="w-4 h-4 mr-2" />
                    {isLoading ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* General Settings */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Server className="w-5 h-5 text-blue-500" />
                            <CardTitle>Geral</CardTitle>
                        </div>
                        <CardDescription>Parâmetros básicos de identificação e limites.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Nome do Sistema</label>
                            <Input
                                value={settings.systemName}
                                onChange={(e) => setSettings({ ...settings, systemName: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Sessões Máx. por Usuário</label>
                            <Input
                                type="number"
                                value={settings.maxSessionsPerUser}
                                onChange={(e) => setSettings({ ...settings, maxSessionsPerUser: parseInt(e.target.value) })}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Access Control */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Lock className="w-5 h-5 text-purple-500" />
                            <CardTitle>Controle de Acesso</CardTitle>
                        </div>
                        <CardDescription>Gerencie quem pode entrar e usar a plataforma.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <label className="text-sm font-medium">Permitir Novos Cadastros</label>
                                <p className="text-xs text-muted-foreground">Se desligado, apenas admins podem criar usuários.</p>
                            </div>
                            <Switch
                                checked={settings.allowRegistrations}
                                onCheckedChange={(c) => setSettings({ ...settings, allowRegistrations: c })}
                            />
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <label className="text-sm font-medium text-red-600">Modo Manutenção</label>
                                <p className="text-xs text-muted-foreground">Bloqueia acesso para todos exceto admins.</p>
                            </div>
                            <Switch
                                checked={settings.maintenanceMode}
                                onCheckedChange={(c) => setSettings({ ...settings, maintenanceMode: c })}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* System Notifications */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Bell className="w-5 h-5 text-amber-500" />
                            <CardTitle>Anúncio Global</CardTitle>
                        </div>
                        <CardDescription>Mensagem exibida para todos os usuários no topo do dashboard.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <Input
                                placeholder="Ex: Manutenção programada para sábado às 22h..."
                                value={settings.globalAnnouncement}
                                onChange={(e) => setSettings({ ...settings, globalAnnouncement: e.target.value })}
                            />
                        </div>
                    </CardContent>
                </Card>

            </div>
        </div>
    );
}
