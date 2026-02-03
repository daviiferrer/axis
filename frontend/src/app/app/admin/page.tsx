'use client';

import React, { useState, useEffect } from 'react';
import useSWR, { mutate } from 'swr';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/services/api';
import { adminService } from '@/services/admin';
import { wahaService } from '@/services/waha';
import { supabase } from '@/lib/supabase/client';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner";
import { AlertCircle, CheckCircle2, RefreshCw, Power } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/feedback/alert";

// --- COMPONENTS ---

function SystemSettingsTab() {
    const { toast: uiToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [settings, setSettings] = useState({
        // Environment
        active_env: 'dev',
        frontend_url: '',
        backend_url: '',
        frontend_url_dev: '',
        backend_url_dev: '',

        // AI & Tools
        gemini_api_key: '',
        apify_token: '',

        // WAHA
        waha_url: '',
        waha_api_key: '',

        // Security
        cors_origin: '*',

        // Advanced
        redis_url: '',
        langfuse_host: '',

        // Feature Flags
        enable_bullmq: true,

        // Meta OAuth (System App)
        meta_app_id: '',
        meta_app_secret: ''
    });

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        setLoading(true);
        try {
            const res = await api.get('/settings');
            if (res.data) {
                setSettings(prev => ({
                    ...prev,
                    ...res.data,
                    active_env: res.data.active_env || 'dev'
                }));
            }
        } catch (error) {
            console.error("Failed to load settings", error);
            uiToast({ title: "Erro", description: "Falha ao carregar configurações.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setSettings({ ...settings, [e.target.name]: e.target.value });
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            await api.post('/settings', { settings });
            uiToast({ title: "Sucesso", description: "Configurações salvas!" });
        } catch (error) {
            console.error("Failed to save", error);
            uiToast({ title: "Erro", description: "Falha ao salvar.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* --- ENVIRONMENT SECTION --- */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        Ambiente do Sistema
                        <span className={`text-xs px-2 py-0.5 rounded-full ${settings.active_env === 'prod' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {settings.active_env === 'prod' ? 'PRODUÇÃO' : 'DESENVOLVIMENTO'}
                        </span>
                    </CardTitle>
                    <CardDescription>Defina as URLs para os ambientes e alterne entre eles.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="active_env">Modo Ativo</Label>
                        <select
                            id="active_env"
                            name="active_env"
                            value={settings.active_env}
                            onChange={handleChange}
                            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <option value="dev">Desenvolvimento (Local/Dev)</option>
                            <option value="prod">Produção (Live)</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-muted-foreground">URL Frontend (Produção)</Label>
                            <Input name="frontend_url" value={settings.frontend_url || ''} onChange={handleChange} placeholder="https://app.seu-dominio.com" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-muted-foreground">URL Backend (Produção)</Label>
                            <Input name="backend_url" value={settings.backend_url || ''} onChange={handleChange} placeholder="https://api.seu-dominio.com" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-muted-foreground">URL Frontend (Dev)</Label>
                            <Input name="frontend_url_dev" value={settings.frontend_url_dev || ''} onChange={handleChange} placeholder="http://localhost:3000" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-muted-foreground">URL Backend (Dev)</Label>
                            <Input name="backend_url_dev" value={settings.backend_url_dev || ''} onChange={handleChange} placeholder="http://localhost:5000" />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* --- INFRASTRUCTURE & TOOLS --- */}
            <Card>
                <CardHeader>
                    <CardTitle>Infraestrutura & Integrações</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Gemini API Key</Label>
                            <Input name="gemini_api_key" value={settings.gemini_api_key || ''} onChange={handleChange} type="password" />
                        </div>
                        <div className="space-y-2">
                            <Label>Apify Token</Label>
                            <Input name="apify_token" value={settings.apify_token || ''} onChange={handleChange} type="password" />
                        </div>
                        <div className="space-y-2">
                            <Label>WAHA URL</Label>
                            <Input name="waha_url" value={settings.waha_url || ''} onChange={handleChange} placeholder="http://localhost:3000" />
                        </div>
                        <div className="space-y-2">
                            <Label>WAHA API Key</Label>
                            <Input name="waha_api_key" value={settings.waha_api_key || ''} onChange={handleChange} type="password" />
                        </div>
                        <div className="space-y-2">
                            <Label>Redis URL</Label>
                            <Input name="redis_url" value={settings.redis_url || ''} onChange={handleChange} placeholder="redis://localhost:6379" />
                        </div>
                        <div className="space-y-2">
                            <Label>Langfuse Host</Label>
                            <Input name="langfuse_host" value={settings.langfuse_host || ''} onChange={handleChange} placeholder="https://cloud.langfuse.com" />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* --- META OAUTH (SYSTEM APP) --- */}
            <Card>
                <CardHeader>
                    <CardTitle>Meta App (Login/Signup)</CardTitle>
                    <CardDescription>Critico para permitir login via Facebook/Instagram.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Meta App ID</Label>
                            <Input name="meta_app_id" value={settings.meta_app_id || ''} onChange={handleChange} placeholder="1234567890" />
                        </div>
                        <div className="space-y-2">
                            <Label>Meta App Secret</Label>
                            <Input name="meta_app_secret" value={settings.meta_app_secret || ''} onChange={handleChange} type="password" placeholder="secret" />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="sticky bottom-4 flex justify-end">
                <Button onClick={handleSave} disabled={loading} size="lg" className="shadow-lg">
                    {loading ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
            </div>
        </div>
    );
}

function WebhooksTab() {
    // Placeholder -In future this would fetch from a /webhooks/system endpoint
    return (
        <Card>
            <CardHeader>
                <CardTitle>Webhooks do Sistema</CardTitle>
                <CardDescription>Gerencie e teste os endpoints de recebimento de eventos.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Em desenvolvimento</AlertTitle>
                        <AlertDescription>
                            A gestão visual de webhooks do sistema será implementada em breve.
                            Por enquanto, configure via variáveis de ambiente ou banco de dados.
                        </AlertDescription>
                    </Alert>

                    <div className="border rounded-md p-4 bg-muted/20">
                        <h4 className="font-medium mb-2">Endpoints Ativos (Hardcoded Check)</h4>
                        <ul className="space-y-2 text-sm">
                            <li className="flex items-center gap-2">
                                <Badge variant="outline" className="bg-green-50 text-green-700">POST</Badge>
                                <code className="bg-muted px-2 py-1 rounded">/api/webhooks/waha</code>
                                <span className="text-muted-foreground">- Eventos do WhatsApp</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <Badge variant="outline" className="bg-green-50 text-green-700">POST</Badge>
                                <code className="bg-muted px-2 py-1 rounded">/api/webhooks/stripe</code>
                                <span className="text-muted-foreground">- Eventos de Pagamento</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

function SessionsTab() {
    const { data: sessions, error, isLoading, mutate } = useSWR(
        'admin-sessions',
        async () => {
            const { data, error } = await supabase
                .from('session_stats') // Use the view we created
                .select('*')
                .order('session_name');
            if (error) throw error;
            return data;
        },
        { refreshInterval: 5000 }
    );

    const handleRestart = async (sessionName: string) => {
        try {
            toast.info(`Reiniciando sessão ${sessionName}...`);
            await wahaService.stopSession(sessionName);
            setTimeout(() => {
                wahaService.startSession(sessionName);
                mutate();
                toast.success(`Comando de reinício enviado para ${sessionName}`);
            }, 2000);
        } catch (e) {
            toast.error("Erro ao reiniciar sessão");
        }
    };

    if (isLoading) return <Skeleton className="h-40 w-full" />;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Sessões Globais WAHA</CardTitle>
                <CardDescription>Visão geral de todas as sessões conectadas ao motor WhatsApp.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Sessão</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Dono (Cliente)</TableHead>
                            <TableHead>Tokens IA (In/Out)</TableHead>
                            <TableHead>Custo Info</TableHead>
                            <TableHead>Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sessions?.map((s: any) => (
                            <TableRow key={s.session_name}>
                                <TableCell className="font-medium">
                                    {s.session_name}
                                    <div className="text-xs text-muted-foreground">{s.session_id}</div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={s.status === 'WORKING' ? 'default' : (s.status === 'STOPPED' ? 'destructive' : 'secondary')}>
                                        {s.status}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="font-medium">{s.owner_name || 'Desconhecido'}</span>
                                        <span className="text-xs text-muted-foreground">{s.owner_email || '-'}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="text-xs">
                                        <div className="flex items-center gap-1">
                                            <span className="text-green-600">IN: {s.total_tokens_input}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <span className="text-blue-600">OUT: {s.total_tokens_output}</span>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <span className="text-xs font-mono">R$ {Number(s.total_cost || 0).toFixed(4)}</span>
                                </TableCell>
                                <TableCell>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleRestart(s.session_name)}
                                        title="Reiniciar Sessão"
                                    >
                                        <RefreshCw className="h-4 w-4 mr-1" /> Restart
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

function EventsTab() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Eventos do Sistema</CardTitle>
                <CardDescription>Logs de auditoria e erros críticos.</CardDescription>
            </CardHeader>
            <CardContent>
                <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Em desenvolvimento</AlertTitle>
                    <AlertDescription>
                        O visualizador de logs do sistema será integrado com Langfuse/Elasticsearch em breve.
                    </AlertDescription>
                </Alert>
            </CardContent>
        </Card>
    )
}

function UserManagementTab() {
    const { user } = useAuth();
    const { data: users, error, isLoading, mutate } = useSWR(
        (user as any)?.role === 'admin' ? 'admin-users' : null,
        async () => {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });
            if (error) throw error;
            return data;
        }
    );

    const handleRoleChange = async (userId: string, newRole: string) => {
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ role: newRole })
                .eq('id', userId);

            if (error) throw error;

            toast.success("Cargo atualizado com sucesso!");
            mutate();
        } catch (e: any) {
            console.error("Update role error:", e);
            toast.error(`Erro ao atualizar cargo: ${e.message}`);
        }
    };

    if (isLoading) return <div className="space-y-4"><Skeleton className="h-10 w-full" /><Skeleton className="h-20 w-full" /></div>;
    if (error) return <div>Erro ao carregar usuários.</div>;

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Gerenciamento de Usuários</CardTitle>
                    <CardDescription>
                        Controle de acesso ao sistema.
                        <br />
                        <b>Admin:</b> Acesso total ao painel de administração (Superusuário).
                        <br />
                        <b>Owner:</b> Cliente/Dono de Empresa (Não acessa este painel admin).
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="border rounded-lg bg-white shadow-sm overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[80px]">Avatar</TableHead>
                                    <TableHead>Nome</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Cargo (System Role)</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Data de Cadastro</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users?.map((u: any) => (
                                    <TableRow key={u.id}>
                                        <TableCell>
                                            <Avatar>
                                                <AvatarImage src={u.user_metadata?.avatar_url} />
                                                <AvatarFallback>{u.email?.substring(0, 2).toUpperCase()}</AvatarFallback>
                                            </Avatar>
                                        </TableCell>
                                        <TableCell className="font-medium">{u.user_metadata?.full_name || 'N/A'}</TableCell>
                                        <TableCell>{u.email}</TableCell>
                                        <TableCell>
                                            <Select
                                                defaultValue={u.role}
                                                onValueChange={(val) => handleRoleChange(u.id, val)}
                                                disabled={u.id === user?.id} // Cannot change own role
                                            >
                                                <SelectTrigger className={`w-[180px] ${u.role === 'admin' ? 'border-purple-200 bg-purple-50 text-purple-900' : ''}`}>
                                                    <SelectValue placeholder="Role" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="admin">Admin (Sistema)</SelectItem>
                                                    <SelectItem value="owner">Owner (Cliente)</SelectItem>
                                                    <SelectItem value="member">Membro (Func.)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 mr-2">Ativo</Badge>
                                        </TableCell>
                                        <TableCell>{new Date(u.created_at).toLocaleDateString()}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default function AdminPage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && (user as any)?.role !== 'admin') {
            router.push('/app');
        }
    }, [user, loading, router]);

    if (loading) return <div className="flex items-center justify-center h-screen">Carregando painel admin...</div>;
    if ((user as any)?.role !== 'admin') return null;

    return (
        <div className="container mx-auto py-8 pb-20 max-w-7xl">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Painel do Sistema</h1>
                    <p className="text-muted-foreground mt-1">Gerenciamento global do ambiente e infraestrutura.</p>
                </div>
            </div>

            <Tabs defaultValue="settings" className="w-full space-y-6">
                <TabsList className="bg-muted/50 p-1 rounded-lg">
                    <TabsTrigger value="settings" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">Configurações</TabsTrigger>
                    <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
                    <TabsTrigger value="sessions">Sessões (WAHA)</TabsTrigger>
                    <TabsTrigger value="events">Eventos</TabsTrigger>
                    <TabsTrigger value="users">Usuários</TabsTrigger>
                </TabsList>

                <TabsContent value="settings" className="focus-visible:outline-none data-[state=inactive]:hidden">
                    <SystemSettingsTab />
                </TabsContent>

                <TabsContent value="webhooks" className="focus-visible:outline-none data-[state=inactive]:hidden">
                    <WebhooksTab />
                </TabsContent>

                <TabsContent value="sessions" className="focus-visible:outline-none data-[state=inactive]:hidden">
                    <SessionsTab />
                </TabsContent>

                <TabsContent value="events" className="focus-visible:outline-none data-[state=inactive]:hidden">
                    <EventsTab />
                </TabsContent>

                <TabsContent value="users" className="focus-visible:outline-none data-[state=inactive]:hidden">
                    <UserManagementTab />
                </TabsContent>
            </Tabs>
        </div>
    );
}
