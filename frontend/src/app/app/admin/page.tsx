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
import { toast } from "sonner"; // Assuming sonner is available based on previous context, otherwise rely on use-toast

// --- COMPONENTS ---

// SystemSettingsTab Component (Collapsed for brevity - logic unchanged but included in full file rewrite if needed. 
// Proposing partial overwrite to keep SystemSettingsTab intact is risky with replace_file_content if lines shift too much.
// I will just redefine UserManagementTab and Main Component logic)

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

        // Stripe
        stripe_webhook_secret: '',
        stripe_api_key: '',

        // Marketing
        meta_pixel_id: '',
        meta_capi_token: ''
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

            {/* --- AI SECTION --- */}
            <Card>
                <CardHeader>
                    <CardTitle>Inteligência Artificial & Tools</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Gemini API Key</Label>
                        <Input name="gemini_api_key" value={settings.gemini_api_key || ''} onChange={handleChange} type="password" />
                    </div>
                    <div className="space-y-2">
                        <Label>Apify Token</Label>
                        <Input name="apify_token" value={settings.apify_token || ''} onChange={handleChange} type="password" />
                    </div>
                </CardContent>
            </Card>

            {/* --- WAHA SECTION --- */}
            <Card>
                <CardHeader>
                    <CardTitle>WhatsApp (WAHA)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>WAHA API URL</Label>
                        <Input name="waha_url" value={settings.waha_url || ''} onChange={handleChange} placeholder="http://localhost:3000" />
                    </div>
                </CardContent>
            </Card>

            {/* --- MARKETING SECTION --- */}
            <Card>
                <CardHeader>
                    <CardTitle>Marketing & Analytics (Meta)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Meta Pixel ID</Label>
                            <Input name="meta_pixel_id" value={settings.meta_pixel_id || ''} onChange={handleChange} />
                        </div>
                        <div className="space-y-2">
                            <Label>Meta CAPI Token</Label>
                            <Input name="meta_capi_token" value={settings.meta_capi_token || ''} onChange={handleChange} type="password" />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* --- BILLING SECTION --- */}
            <Card>
                <CardHeader>
                    <CardTitle>Faturamento (Stripe)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Stripe API Key</Label>
                        <Input name="stripe_api_key" value={settings.stripe_api_key || ''} onChange={handleChange} type="password" />
                    </div>
                    <div className="space-y-2">
                        <Label>Stripe Webhook Secret</Label>
                        <Input name="stripe_webhook_secret" value={settings.stripe_webhook_secret || ''} onChange={handleChange} type="password" />
                    </div>
                </CardContent>
            </Card>

            <div className="sticky bottom-4 flex justify-end">
                <Button onClick={handleSave} disabled={loading} size="lg" className="shadow-lg">
                    {loading ? 'Salvando...' : 'Salvar Todas as Configurações'}
                </Button>
            </div>
        </div>
    );
}

function UserManagementTab() {
    const { user } = useAuth();
    const { data: users, error, isLoading } = useSWR(
        (user as any)?.role === 'admin' ? 'admin-users' : null,
        adminService.getUsers
    );

    const handleRoleChange = async (userId: string, newRole: string) => {
        try {
            await adminService.updateUserRole(userId, newRole);
            toast.success("Cargo atualizado com sucesso!");
            mutate('admin-users');
        } catch (e) {
            toast.error("Erro ao atualizar cargo do usuário.");
        }
    };

    if (isLoading) return <div className="space-y-4"><Skeleton className="h-10 w-full" /><Skeleton className="h-20 w-full" /></div>;
    if (error) return <div>Erro ao carregar usuários.</div>;

    return (
        <div className="space-y-6">
            <div className="border rounded-lg bg-white shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[80px]">Avatar</TableHead>
                            <TableHead>Nome</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Cargo (Role)</TableHead>
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
                                        disabled={u.id === user?.id}
                                    >
                                        <SelectTrigger className="w-[140px]">
                                            <SelectValue placeholder="Role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="admin">Administrador do Sistema</SelectItem>
                                            <SelectItem value="owner">Usuário Padrão (Owner)</SelectItem>
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

    if (loading) return <div>Carregando...</div>;
    if ((user as any)?.role !== 'admin') return null;

    return (
        <div className="container mx-auto py-6 pb-20">
            <h1 className="text-3xl font-bold mb-6">Administração do Sistema</h1>

            <Tabs defaultValue="settings" className="w-full">
                <TabsList className="mb-6">
                    <TabsTrigger value="settings">Configurações de Sistema</TabsTrigger>
                    <TabsTrigger value="users">Gerenciamento de Usuários</TabsTrigger>
                </TabsList>

                <TabsContent value="settings">
                    <SystemSettingsTab />
                </TabsContent>

                <TabsContent value="users">
                    <UserManagementTab />
                </TabsContent>
            </Tabs>
        </div>
    );
}
