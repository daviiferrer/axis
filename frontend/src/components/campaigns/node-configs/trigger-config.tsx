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

    // Load pages if FB is active (and we might have a token stored? No, backend stores it)
    // Actually, we define that if FB is selected, we show the config.
    // If we have a connected page in formData, we show it.

    const handleConnectFacebook = async () => {
        try {
            setIsConnecting(true);
            const loginUrl = await facebookAdsService.getLoginUrl();

            // Open popup
            const width = 600;
            const height = 700;
            const left = window.screen.width / 2 - width / 2;
            const top = window.screen.height / 2 - height / 2;
            const popup = window.open(loginUrl, 'Facebook Login', `width=${width},height=${height},top=${top},left=${left}`);

            // Listen for message
            const messageHandler = async (event: MessageEvent) => {
                if (event.data?.type === 'FB_AUTH_SUCCESS') {
                    window.removeEventListener('message', messageHandler);
                    popup?.close();
                    setIsConnecting(false);
                    toast.success('Facebook conectado!');

                    // Fetch Pages
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
            // Subscribe App to Page
            await facebookAdsService.subscribePage(page.id, page.access_token);

            // Update Form Data with Page Info
            onChange('facebookPageId', page.id);
            onChange('facebookPageName', page.name); // Optional for UI display

            toast.success(`Página ${page.name} conectada!`);
        } catch (error) {
            toast.error('Erro ao conectar página');
        }
    };

    return (
        <div className="space-y-6">
            <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100/50 space-y-4">
                <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                        <Label className="text-sm font-medium text-gray-900">Modo Triagem Global</Label>
                        <p className="text-[10px] text-gray-500">Captura todas as mensagens sem filtros</p>
                    </div>
                    <Switch
                        checked={formData.isTriage || false}
                        onCheckedChange={(c) => onChange('isTriage', c)}
                        className="data-[state=checked]:bg-blue-600"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label className="text-xs text-gray-500 pl-1">Sessão WhatsApp</Label>
                <Select value={formData.sessionName || ''} onValueChange={(v) => onChange('sessionName', v)}>
                    <SelectTrigger className="h-11 rounded-xl bg-white/50 border-gray-200"><SelectValue placeholder="Selecione a sessão..." /></SelectTrigger>
                    <SelectContent className="rounded-xl border-gray-100 shadow-lg">
                        {sessions.map(s => <SelectItem key={s.name} value={s.name}>{s.name} <span className="text-gray-400 ml-2 text-xs">({s.status})</span></SelectItem>)}
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-3">
                <Label className="text-xs text-gray-500 pl-1">Fontes Permitidas</Label>
                <p className="text-[10px] text-gray-400 pl-1">Deixe vazio para aceitar todas as fontes</p>
                <ToggleGroup
                    type="multiple"
                    variant="outline"
                    value={formData.allowedSources || []}
                    onValueChange={(val) => onChange('allowedSources', val)}
                    className="justify-start flex-wrap gap-2"
                >
                    {[
                        { id: 'inbound', label: '📥 Inbound', color: 'data-[state=on]:bg-green-100 data-[state=on]:text-green-700 data-[state=on]:border-green-200' },
                        { id: 'apify', label: '🕷️ Apify', color: 'data-[state=on]:bg-orange-100 data-[state=on]:text-orange-700 data-[state=on]:border-orange-200' },
                        { id: 'manual', label: '✋ Manual', color: 'data-[state=on]:bg-gray-100 data-[state=on]:text-gray-700 data-[state=on]:border-gray-200' },
                        { id: 'facebook_ads', label: '📘 Facebook Ads', color: 'data-[state=on]:bg-blue-100 data-[state=on]:text-blue-700 data-[state=on]:border-blue-200' },
                        { id: 'webform', label: '🌐 Webform', color: 'data-[state=on]:bg-purple-100 data-[state=on]:text-purple-700 data-[state=on]:border-purple-200' },
                    ].map(source => (
                        <ToggleGroupItem
                            key={source.id}
                            value={source.id}
                            aria-label={`Toggle ${source.id}`}
                            className={`h-8 px-3 text-xs border rounded-lg transition-all duration-200 ${source.color}`}
                        >
                            {source.label}
                        </ToggleGroupItem>
                    ))}
                </ToggleGroup>
            </div>

            {/* FACEBOOK ADS CONFIGURATION PANEl */}
            {isSourceActive('facebook_ads') && (
                <div className="mt-4 p-4 rounded-xl bg-blue-50/30 border border-blue-100 space-y-4 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Facebook className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                            <h4 className="text-sm font-medium text-blue-900">Integração Facebook Ads</h4>
                            <p className="text-[10px] text-blue-600/80">Receba leads dos seus formulários instantaneamente</p>
                        </div>
                    </div>

                    {!formData.facebookPageId ? (
                        <>
                            {pages.length === 0 ? (
                                <Button
                                    onClick={handleConnectFacebook}
                                    disabled={isConnecting}
                                    className="w-full bg-[#1877F2] hover:bg-[#166fe5] text-white"
                                >
                                    {isConnecting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Facebook className="w-4 h-4 mr-2" />}
                                    Conectar Conta Facebook
                                </Button>
                            ) : (
                                <div className="space-y-2">
                                    <Label className="text-xs text-gray-500">Selecione a Página</Label>
                                    <Select onValueChange={handleSelectPage}>
                                        <SelectTrigger className="w-full bg-white"><SelectValue placeholder="Escolha uma página..." /></SelectTrigger>
                                        <SelectContent>
                                            {pages.map(page => (
                                                <SelectItem key={page.id} value={page.id} className="flex items-center gap-2">
                                                    {page.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="bg-white p-3 rounded-lg border border-blue-100 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                <div>
                                    <p className="text-xs font-medium text-gray-900">Página Conectada</p>
                                    <p className="text-[10px] text-gray-500">{formData.facebookPageName || `ID: ${formData.facebookPageId}`}</p>
                                </div>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => { onChange('facebookPageId', null); setPages([]); }} className="text-red-500 h-6 text-[10px] hover:text-red-600 hover:bg-red-50">
                                Desconectar
                            </Button>
                        </div>
                    )}
                </div>
            )}

            {/* APIFY PLACEHOLDER (To be implemented later if requested) */}
            {isSourceActive('apify') && (
                <div className="mt-4 p-4 rounded-xl bg-orange-50/30 border border-orange-100 flex items-center gap-3 animate-in fade-in">
                    <AlertTriangle className="w-4 h-4 text-orange-500" />
                    <p className="text-xs text-orange-800">Configure a extração do Apify na aba "Prospects" ou aqui (em breve).</p>
                </div>
            )}
        </div>
    );
}
