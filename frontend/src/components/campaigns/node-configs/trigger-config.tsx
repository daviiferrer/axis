'use client'

import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/forms/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Button } from '@/components/ui/button';
import { Facebook, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { facebookAdsService, FacebookPage } from '@/services/facebookAdsService';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface TriggerConfigProps {
    formData: any;
    onChange: (key: string, value: any) => void;
    sessions: any[];
}

export function TriggerConfig({ formData, onChange, sessions }: TriggerConfigProps) {
    const [isConnecting, setIsConnecting] = useState(false);
    const [pages, setPages] = useState<FacebookPage[]>([]);
    const [isLoadingPages, setIsLoadingPages] = useState(false);
    const selectedSources: string[] = formData.allowedSources || [];

    // Helper to check if source is active
    const isSourceActive = (id: string) => selectedSources.includes(id);

    const handleConnectFacebook = async () => {
        try {
            setIsConnecting(true);
            const loginUrl = await facebookAdsService.getLoginUrl();

            const width = 600;
            const height = 700;
            const left = window.screen.width / 2 - width / 2;
            const top = window.screen.height / 2 - height / 2;
            const popup = window.open(loginUrl, 'Facebook Login', `width=${width},height=${height},top=${top},left=${left}`);

            const messageHandler = async (event: MessageEvent) => {
                if (event.data?.type === 'FB_AUTH_SUCCESS') {
                    window.removeEventListener('message', messageHandler);
                    popup?.close();
                    setIsConnecting(false);
                    toast.success('Facebook conectado!');
                    fetchPages(event.data.accessToken);
                }
            };
            window.addEventListener('message', messageHandler);

        } catch (error) {
            console.error(error);
            setIsConnecting(false);
            toast.error('Erro ao iniciar login do Facebook');
        }
    };

    const fetchPages = async (accessToken: string) => {
        setIsLoadingPages(true);
        try {
            const pagesList = await facebookAdsService.getPages(accessToken);
            setPages(pagesList);
        } catch (error) {
            toast.error('Erro ao listar páginas');
        } finally {
            setIsLoadingPages(false);
        }
    };

    const handleSelectPage = async (pageId: string) => {
        const page = pages.find(p => p.id === pageId);
        if (!page) return;

        try {
            await facebookAdsService.subscribePage(page.id, page.access_token);
            onChange('facebookPageId', page.id);
            onChange('facebookPageName', page.name);
            toast.success(`Página ${page.name} conectada!`);
        } catch (error) {
            toast.error('Erro ao conectar página');
        }
    };

    const handleSourceChange = (value: string[]) => {
        onChange('allowedSources', value);
    };

    return (
        <div className="w-full">
            <Tabs defaultValue="geral" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4 bg-gray-100/50 p-1 rounded-xl">
                    <TabsTrigger value="geral" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        Geral & Fontes
                    </TabsTrigger>
                    <TabsTrigger
                        value="channels"
                        disabled={!isSourceActive('facebook_ads') && !isSourceActive('apify')}
                        className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm relative"
                    >
                        Config. Canais
                        {(formData.facebookPageId) && (
                            <span className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full" />
                        )}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="geral" className="space-y-6 focus-visible:ring-0">
                    <div className="space-y-4">
                        {/* Session Selector */}
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Sessão WhatsApp</Label>
                            <Select value={formData.sessionName || ''} onValueChange={(v) => onChange('sessionName', v)}>
                                <SelectTrigger className="h-10 rounded-lg bg-white border-gray-200 focus:ring-1 focus:ring-blue-500 transition-all">
                                    <SelectValue placeholder="Selecione a sessão..." />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-gray-100 shadow-xl">
                                    {sessions.map(s => (
                                        <SelectItem key={s.name} value={s.name} className="focus:bg-blue-50">
                                            <span className="font-medium text-gray-700">{s.name}</span>
                                            <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded-full ${s.status === 'CONNECTED' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                                {s.status}
                                            </span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Allowed Sources Matrix */}
                        <div className="space-y-3 pt-2 border-t border-dashed border-gray-100">
                            <div className="flex justify-between items-center">
                                <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Fontes Permitidas</Label>
                                <span className="text-[10px] text-gray-400">Quais canais iniciam este fluxo?</span>
                            </div>

                            <ToggleGroup
                                type="multiple"
                                variant="outline"
                                value={selectedSources}
                                onValueChange={handleSourceChange}
                                className="grid grid-cols-2 gap-2"
                            >
                                {[
                                    { id: 'inbound', label: 'Inbound (Msg)', icon: '📥', desc: 'Cliente manda msg', color: 'data-[state=on]:bg-green-50 data-[state=on]:border-green-200 data-[state=on]:text-green-700' },
                                    { id: 'facebook_ads', label: 'Facebook Ads', icon: '📘', desc: 'Leads de anúncios', color: 'data-[state=on]:bg-blue-50 data-[state=on]:border-blue-200 data-[state=on]:text-blue-700' },
                                    { id: 'manual', label: 'Manual / API', icon: '🔌', desc: 'Cadastro manual', color: 'data-[state=on]:bg-gray-50 data-[state=on]:border-gray-200 data-[state=on]:text-gray-700' },
                                    { id: 'apify', label: 'Apify / Scraper', icon: '🕷️', desc: 'Leads extraídos', color: 'data-[state=on]:bg-orange-50 data-[state=on]:border-orange-200 data-[state=on]:text-orange-700' },
                                ].map(source => (
                                    <ToggleGroupItem
                                        key={source.id}
                                        value={source.id}
                                        className={`h-auto py-3 px-3 flex flex-col items-start gap-1 border border-gray-100 rounded-xl hover:bg-gray-50 transition-all ${source.color}`}
                                    >
                                        <div className="flex items-center gap-2 font-medium text-xs">
                                            <span>{source.icon}</span>
                                            {source.label}
                                        </div>
                                        <span className="text-[10px] text-gray-400 font-normal text-left leading-tight">
                                            {source.desc}
                                        </span>
                                    </ToggleGroupItem>
                                ))}
                            </ToggleGroup>
                        </div>

                        {/* Triage Mode - Advanced */}
                        <div className="pt-4 border-t border-gray-100">
                            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-100">
                                <div>
                                    <Label className="text-xs font-medium text-gray-900">Modo Triagem Global</Label>
                                    <p className="text-[10px] text-gray-500">Captura todas as mensagens sem filtros de origem</p>
                                </div>
                                <Switch
                                    checked={formData.isTriage || false}
                                    onCheckedChange={(c) => onChange('isTriage', c)}
                                    className="data-[state=checked]:bg-blue-600 scale-90"
                                />
                            </div>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="channels" className="space-y-4 focus-visible:ring-0">
                    {/* FACEBOOK CONFIG */}
                    {isSourceActive('facebook_ads') && (
                        <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100 space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="flex items-center gap-3 pb-3 border-b border-blue-100/50">
                                <div className="p-2 bg-white rounded-lg shadow-sm">
                                    <Facebook className="w-5 h-5 text-[#1877F2]" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-semibold text-gray-900">Configuração Facebook</h4>
                                    <p className="text-[10px] text-blue-600">Conecte sua página para receber leads</p>
                                </div>
                            </div>

                            {!formData.facebookPageId ? (
                                <div className="space-y-4 pt-2">
                                    {pages.length === 0 ? (
                                        <Button
                                            onClick={handleConnectFacebook}
                                            disabled={isConnecting}
                                            className="w-full bg-[#1877F2] hover:bg-[#166fe5] text-white shadow-sm transition-all hover:shadow-md h-10 rounded-lg font-medium text-xs"
                                        >
                                            {isConnecting ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" /> : <Facebook className="w-3.5 h-3.5 mr-2" />}
                                            Conectar Conta Business
                                        </Button>
                                    ) : (
                                        <div className="space-y-2 animate-in zoom-in-95">
                                            <Label className="text-xs text-gray-500 font-medium">Selecione a Página Vinculada</Label>
                                            <Select onValueChange={handleSelectPage}>
                                                <SelectTrigger className="w-full bg-white h-10 border-blue-200 focus:ring-blue-500"><SelectValue placeholder="Escolha uma página..." /></SelectTrigger>
                                                <SelectContent>
                                                    {pages.map(page => (
                                                        <SelectItem key={page.id} value={page.id} className="cursor-pointer">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-6 h-6 rounded bg-gray-100 flex items-center justify-center overflow-hidden">
                                                                    {page.picture?.data?.url ? <img src={page.picture.data.url} alt="" className="w-full h-full object-cover" /> : <Facebook className="w-3 h-3 text-blue-500" />}
                                                                </div>
                                                                <span className="text-sm font-medium">{page.name}</span>
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="bg-white p-3 rounded-lg border border-blue-100 flex items-center justify-between shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                                        <div>
                                            <p className="text-xs font-semibold text-gray-900">Conectado com Sucesso</p>
                                            <p className="text-[10px] text-gray-500 font-mono mt-0.5">{formData.facebookPageName || `Page ID: ${formData.facebookPageId}`}</p>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => { onChange('facebookPageId', null); setPages([]); }}
                                        className="text-red-500 h-7 px-2 text-[10px] hover:text-red-700 hover:bg-red-50 font-medium"
                                    >
                                        Desconectar
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* APIFY CONFIG */}
                    {isSourceActive('apify') && (
                        <div className="p-4 rounded-xl bg-orange-50/50 border border-orange-100 space-y-3 animate-in fade-in slide-in-from-right-4 duration-300 delay-100">
                            <div className="flex items-center gap-3 pb-2">
                                <div className="p-2 bg-white rounded-lg shadow-sm">
                                    <AlertTriangle className="w-5 h-5 text-orange-500" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-semibold text-gray-900">Configuração Apify</h4>
                                    <p className="text-[10px] text-orange-600">Extração de dados via scraper</p>
                                </div>
                            </div>
                            <div className="text-xs text-orange-800 bg-orange-100/50 p-3 rounded-lg border border-orange-100">
                                Configure a extração do Apify na aba "Prospects" ou aguarde a atualização do módulo de integração direta.
                            </div>
                        </div>
                    )}

                    {(!isSourceActive('facebook_ads') && !isSourceActive('apify')) && (
                        <div className="text-center py-8 text-gray-400 text-xs italic">
                            Nenhum canal selecionado requer configuração extra.
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
