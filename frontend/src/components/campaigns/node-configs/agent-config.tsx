'use client'

import React, { useState, useEffect } from 'react';
import { Bot, Brain, Flag, Zap, Activity, Briefcase, Target, MessageSquare, Clock, Shield, Calendar, Rocket, LifeBuoy, Settings, X, Plus, Check, AlertCircle, Mic, Trash2, Play, Upload, RefreshCw, MicOff, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/forms/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { agentService, Agent, DNAConfig, VoiceClone, VoiceConfig } from '@/services/agentService';
import { profileService } from '@/services/profileService';
import { VoiceConfigTab } from './voice-config-tab';
import Link from 'next/link';

// ===== DNA DEFAULTS (Enum-based — matches AgentDNA.js backend enums directly) =====

const DEFAULT_DNA: DNAConfig = {
    psychometrics: { openness: 'HIGH', conscientiousness: 'HIGH', extraversion: 'MEDIUM', agreeableness: 'HIGH', neuroticism: 'LOW' },
    pad_baseline: { pleasure: 'POSITIVE', arousal: 'MEDIUM', dominance: 'EGALITARIAN' },
    linguistics: {
        reduction_profile: 'BALANCED', caps_mode: 'STANDARD', correction_style: 'ASTERISK_PRE',
        typo_injection: 'NONE', max_chars: 300,
        formality: 'BALANCED', emoji_frequency: 'LOW', caps_usage: 'STANDARD', intentional_typos: false,
    },
    chronemics: { latency_profile: 'MODERATE', burstiness: 'MEDIUM', base_latency_ms: 1500 },
    guardrails: { forbidden_topics: [], handoff_enabled: true, max_turns_before_handoff: 20 },
    business_context: { industry: 'GENERIC', company_name: '', custom_context: '' },
    qualification: { framework: 'BANT', slots: ['budget', 'authority', 'need', 'timeline'] },
};

interface AgentConfigProps {
    formData: any;
    onChange: (key: string, value: any) => void;
    agents: Agent[];
    onAgentsChange: () => void;
}

export function AgentConfig({ formData, onChange, agents, onAgentsChange }: AgentConfigProps) {
    const [showDnaEditor, setShowDnaEditor] = useState(false);
    const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
    const [dna, setDna] = useState<DNAConfig>(DEFAULT_DNA);
    const [agentName, setAgentName] = useState('');
    const [agentDesc, setAgentDesc] = useState('');
    const [model, setModel] = useState('gemini-2.5-flash');
    const [role, setRole] = useState('SDR');
    const [saving, setSaving] = useState(false);
    const [apiKey, setApiKey] = useState('');
    const [hasKey, setHasKey] = useState(false);
    const [keyLoading, setKeyLoading] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [saveMessage, setSaveMessage] = useState('');

    // Load API key status
    useEffect(() => {
        profileService.hasApiKey('gemini').then(r => setHasKey(r.hasKey)).catch(() => { });
    }, []);

    // When agent is selected from dropdown, load its full DNA
    const handleSelectAgent = async (agentId: string) => {
        onChange('agentId', agentId);
        try {
            const agent = await agentService.get(agentId);
            setSelectedAgent(agent);
            setAgentName(agent.name);
            setAgentDesc(agent.description || '');
            setModel(agent.model || 'gemini-2.5-flash');
            setRole(agent.dna_config?.identity?.role || 'SDR');
            // Load DNA directly (already enum-based, no conversion needed)
            if (agent.dna_config) setDna({ ...DEFAULT_DNA, ...agent.dna_config });

            // PROPAGATE to node data so canvas shows richer info
            onChange('agentName', agent.name);
            onChange('model', agent.model || 'gemini-2.5-flash');
            onChange('role', agent.dna_config?.identity?.role || 'SDR');
            onChange('company_context', agent.dna_config?.business_context || null);
        } catch (e) { console.error(e); }
    };

    const handleCreateNew = () => {
        setSelectedAgent(null);
        setAgentName('');
        setAgentDesc('');
        setModel('gemini-2.5-flash');
        setRole('SDR');
        setDna(DEFAULT_DNA);
        setShowDnaEditor(true);
    };

    const handleEditSelected = () => {
        if (formData.agentId && !selectedAgent) {
            handleSelectAgent(formData.agentId).then(() => setShowDnaEditor(true));
        } else {
            setShowDnaEditor(true);
        }
    };

    const updateDna = (section: string, keyOrUpdates: string | Record<string, any>, value?: any) => {
        setDna(prev => {
            const currentSection = (prev as any)[section] || {};
            let newSectionData;

            if (typeof keyOrUpdates === 'string') {
                newSectionData = { ...currentSection, [keyOrUpdates]: value };
            } else {
                newSectionData = { ...currentSection, ...keyOrUpdates };
            }

            return {
                ...prev,
                [section]: newSectionData
            };
        });
    };

    const handleSave = async () => {
        if (!agentName.trim()) return;
        setSaving(true);
        setSaveStatus('idle');
        try {
            // DNA is already enum-based, no conversion needed
            const enumDna = { ...dna };
            // Place role inside dna_config.identity (NOT top-level — DB has no 'role' column)
            enumDna.identity = { role: role as any };

            const payload = {
                name: agentName.trim(),
                description: agentDesc.trim(),
                model,
                provider: 'gemini',
                dna_config: enumDna,
            };

            let result: Agent;
            if (selectedAgent?.id) {
                result = await agentService.update(selectedAgent.id, payload);
            } else {
                result = await agentService.create(payload as any);
            }
            onChange('agentId', result.id);
            onChange('agentName', result.name);
            onChange('model', result.model || 'gemini-2.5-flash');
            onChange('role', result.dna_config?.identity?.role || role);
            onChange('company_context', result.dna_config?.business_context || null);
            setSelectedAgent(result);
            onAgentsChange();
            setSaveStatus('success');
            setSaveMessage(selectedAgent ? 'Agente atualizado!' : 'Agente criado com sucesso!');
            setTimeout(() => {
                setShowDnaEditor(false);
                setSaveStatus('idle');
            }, 1200);
        } catch (e: any) {
            console.error('Agent save failed:', e);
            setSaveStatus('error');
            if (e?.response?.data?.error === 'MISSING_API_KEY') {
                setSaveMessage('Configure sua API Key Gemini primeiro (aba Negócio)');
            } else {
                setSaveMessage(e?.response?.data?.message || 'Erro ao salvar agente. Tente novamente.');
            }
            setTimeout(() => setSaveStatus('idle'), 4000);
        }
        setSaving(false);
    };

    const handleSaveKey = async () => {
        if (!apiKey) return;
        setKeyLoading(true);
        try {
            await profileService.updateApiKey('gemini', apiKey);
            setHasKey(true);
            setApiKey('');
        } catch (e) { console.error(e); }
        setKeyLoading(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Excluir este agente permanentemente?')) return;
        try {
            await agentService.delete(id);
            if (formData.agentId === id) onChange('agentId', '');
            onAgentsChange();
        } catch (e) { console.error(e); }
    };

    // ===== DNA EDITOR VIEW =====
    if (showDnaEditor) {
        return (
            <div className="space-y-6">
                {/* Save Status Toast */}
                {saveStatus !== 'idle' && (
                    <div className={cn(
                        'flex items-center gap-2 p-3 rounded-lg text-xs font-medium animate-in fade-in slide-in-from-top-2 duration-300',
                        saveStatus === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                    )}>
                        {saveStatus === 'success' ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                        {saveMessage}
                    </div>
                )}

                <div className="flex items-center justify-between">
                    <button onClick={() => setShowDnaEditor(false)} className="text-xs text-gray-500 hover:text-gray-900 flex items-center gap-1">
                        ← Voltar
                    </button>
                    <Button onClick={handleSave} disabled={saving || !agentName.trim()} size="sm"
                        className={cn(
                            'text-white transition-all',
                            saveStatus === 'success' ? 'bg-green-600 hover:bg-green-700' : 'bg-purple-600 hover:bg-purple-700'
                        )}>
                        {saving ? <Activity className="h-3 w-3 animate-spin mr-1" /> : saveStatus === 'success' ? <Check className="h-3 w-3 mr-1" /> : null}
                        {saving ? 'Salvando...' : saveStatus === 'success' ? 'Salvo!' : selectedAgent ? 'Atualizar' : 'Criar Agente'}
                    </Button>
                </div>

                {/* Basic Fields */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2 space-y-1">
                        <Label className="text-xs text-gray-500">Nome do Agente</Label>
                        <Input value={agentName} onChange={e => setAgentName(e.target.value)}
                            placeholder="Ex: SDR Vendas" className="h-10" />
                    </div>
                    <div className="col-span-2 space-y-1">
                        <Label className="text-xs text-gray-500">Descrição</Label>
                        <Input value={agentDesc} onChange={e => setAgentDesc(e.target.value)}
                            placeholder="O que este agente faz?" className="h-10" />
                    </div>
                </div>

                {/* Model Selection */}
                <div className="space-y-2">
                    <Label className="text-xs text-gray-500">Modelo IA</Label>
                    <div className="grid grid-cols-3 gap-2">
                        {[
                            { id: 'gemini-2.5-flash', name: '2.5 Flash', desc: 'Padrão' },
                            { id: 'gemini-2.5-flash-lite', name: '2.5 Lite', desc: 'Econômico' },
                            { id: 'gemini-3.0-flash', name: '3.0 Flash', desc: 'Avançado' }
                        ].map(m => (
                            <button key={m.id} onClick={() => setModel(m.id)}
                                className={`p-2 rounded-lg border-2 text-center transition-all text-xs ${model === m.id
                                    ? 'border-purple-600 bg-purple-50' : 'border-gray-200 hover:border-purple-300'}`}>
                                <div className="font-bold">{m.name}</div>
                                <div className="text-gray-500 text-[10px]">{m.desc}</div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Role */}
                <div className="space-y-2">
                    <Label className="text-xs text-gray-500">Cargo</Label>
                    <div className="grid grid-cols-3 gap-2">
                        {[
                            { id: 'SDR', label: 'SDR' },
                            { id: 'EXECUTIVE', label: 'Closer' },
                            { id: 'SUPPORT', label: 'Suporte' },
                            { id: 'ONBOARDING', label: 'Onboard' },
                            { id: 'CONSULTANT', label: 'Consultor' },
                            { id: 'CONCIERGE', label: 'Triagem' },
                        ].map(r => (
                            <button key={r.id} onClick={() => setRole(r.id)}
                                className={`p-2 rounded-lg border text-xs font-medium transition-all ${role === r.id
                                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 hover:border-indigo-300'}`}>
                                {r.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* DNA Tabs */}
                <Tabs defaultValue="integration" className="w-full">
                    <TabsList className="w-full grid grid-cols-5 bg-gray-100 p-0.5 rounded-lg h-auto">
                        <TabsTrigger value="integration" className="text-[10px] py-1.5 px-1">Integrar</TabsTrigger>
                        <TabsTrigger value="personality" className="text-[10px] py-1.5 px-1">Persona</TabsTrigger>
                        <TabsTrigger value="writing" className="text-[10px] py-1.5 px-1">Escrita</TabsTrigger>
                        <TabsTrigger value="safety" className="text-[10px] py-1.5 px-1">Limites</TabsTrigger>
                        <TabsTrigger value="voice" className="text-[10px] py-1.5 px-1">Voz</TabsTrigger>
                    </TabsList>

                    {/* Integration Context */}
                    <TabsContent value="integration" className="mt-4 space-y-4">
                        <IntegrationTab apiKey={apiKey} setApiKey={setApiKey}
                            hasKey={hasKey} keyLoading={keyLoading} handleSaveKey={handleSaveKey} />
                    </TabsContent>

                    {/* Personality */}
                    <TabsContent value="personality" className="mt-4 space-y-4">
                        <PersonalityTab dna={dna} updateDna={updateDna} />
                    </TabsContent>

                    {/* Writing Style */}
                    <TabsContent value="writing" className="mt-4 space-y-4">
                        <WritingTab dna={dna} updateDna={updateDna} />
                    </TabsContent>

                    {/* Safety */}
                    <TabsContent value="safety" className="mt-4 space-y-4">
                        <SafetyTab dna={dna} updateDna={updateDna} />
                    </TabsContent>

                    {/* Voice */}
                    <TabsContent value="voice" className="mt-4 space-y-4">
                        <VoiceConfigTab dna={dna} updateDna={updateDna} agentId={selectedAgent?.id} />
                    </TabsContent>
                </Tabs>
            </div>
        );
    }

    // ===== AGENT SELECTOR VIEW (default) =====
    return (
        <div className="space-y-6">
            {/* Agent Dropdown */}
            <div className="space-y-2">
                <Label className="text-xs text-gray-500 pl-1">Agente Ativo</Label>
                <Select value={formData.agentId || ''} onValueChange={handleSelectAgent}>
                    <SelectTrigger className="h-14 rounded-xl bg-white/50 border-gray-200">
                        <div className="flex items-center gap-3">
                            <div className="p-1.5 bg-indigo-50 rounded-lg">
                                <Bot className="w-5 h-5 text-indigo-600" strokeWidth={1.5} />
                            </div>
                            <div className="flex flex-col items-start">
                                <SelectValue placeholder="Escolha um agente..." />
                                <span className="text-[10px] text-gray-400">Define personalidade & conhecimento</span>
                            </div>
                        </div>
                    </SelectTrigger>
                    <SelectContent className="max-h-64">
                        {agents.map(a => (
                            <SelectItem key={a.id} value={a.id}>
                                <span className="font-medium">{a.name}</span>
                                <span className="block text-[10px] text-gray-400">{a.model} • {a.dna_config?.identity?.role || 'sdr'}</span>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
                <Button onClick={handleCreateNew} variant="outline" size="sm" className="flex-1 text-xs">
                    Criar Novo
                </Button>
                {formData.agentId && (
                    <>
                        <Button onClick={handleEditSelected} variant="outline" size="sm" className="flex-1 text-xs">
                            Editar DNA
                        </Button>
                        <Button onClick={() => handleDelete(formData.agentId)} variant="outline" size="sm"
                            className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50">
                            Excluir
                        </Button>
                    </>
                )}
            </div>

            {/* Node-level configs removed: Goal, CTAs, Slots, Context are now handled exclusively on the Agent Wizard canvas */}
        </div>
    );
}

// ===== SUB-COMPONENTS =====
// AgentNodeSettings was moved to agent-wizard.tsx

function IntegrationTab({ apiKey, setApiKey, hasKey, keyLoading, handleSaveKey }: any) {
    return (
        <div className="space-y-4">
            {/* API Key */}
            <div className="p-3 bg-purple-50 rounded-lg border border-purple-100 space-y-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-purple-600" />
                        <span className="text-xs font-bold text-gray-900">Chave Gemini</span>
                        {hasKey && <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded">✅</span>}
                    </div>
                    <Button variant="secondary" size="sm" onClick={handleSaveKey} disabled={keyLoading || !apiKey}
                        className="h-7 text-[10px] bg-purple-600 hover:bg-purple-700 text-white">
                        {keyLoading ? <Activity className="h-3 w-3 animate-spin" /> : 'Salvar'}
                    </Button>
                </div>
                <div className="relative">
                    <Input type="password" placeholder={hasKey ? '•••••••• (salva)' : 'Cole sua API Key...'}
                        className="bg-white h-8 text-xs pr-20" value={apiKey} onChange={(e) => setApiKey(e.target.value)} />
                    <Link href="https://aistudio.google.com/app/apikey" target="_blank"
                        className="absolute top-0 right-0 h-full flex items-center pr-2 text-[10px] text-purple-600 font-bold hover:underline">
                        GERAR ↗
                    </Link>
                </div>
            </div>

            {/* Context Note */}
            <div className="p-3 bg-blue-50/50 border border-blue-100 border-dashed rounded-lg space-y-1">
                <p className="text-[10px] leading-relaxed text-blue-700 font-medium">
                    💡 O objetivo, roteiro e modo de voz devem ser configurados no fluxo da campanha.
                    Este menu define apenas a essência, voz e comportamento do Agente.
                </p>
            </div>
        </div>
    );
}

function PersonalityTab({ dna, updateDna }: any) {
    const big5Traits = [
        {
            key: 'openness', label: 'Abertura', options: [
                { value: 'LOW', label: 'Prático' }, { value: 'MEDIUM', label: 'Equilibrado' }, { value: 'HIGH', label: 'Criativo' }
            ]
        },
        {
            key: 'conscientiousness', label: 'Conscienciosidade', options: [
                { value: 'LOW', label: 'Flexível' }, { value: 'MEDIUM', label: 'Equilibrado' }, { value: 'HIGH', label: 'Metódico' }
            ]
        },
        {
            key: 'extraversion', label: 'Extroversão', options: [
                { value: 'LOW', label: 'Reservado' }, { value: 'MEDIUM', label: 'Equilibrado' }, { value: 'HIGH', label: 'Expansivo' }
            ]
        },
        {
            key: 'agreeableness', label: 'Amabilidade', options: [
                { value: 'LOW', label: 'Direto' }, { value: 'MEDIUM', label: 'Equilibrado' }, { value: 'HIGH', label: 'Acolhedor' }
            ]
        },
        {
            key: 'neuroticism', label: 'Neuroticismo', options: [
                { value: 'LOW', label: 'Calmo' }, { value: 'MEDIUM', label: 'Moderado' }, { value: 'HIGH', label: 'Reativo' }
            ]
        },
    ];

    const padTraits = [
        {
            key: 'pleasure', label: 'Prazer', options: [
                { value: 'NEGATIVE', label: 'Neutro' }, { value: 'NEUTRAL', label: 'Amigável' }, { value: 'POSITIVE', label: 'Alegre' }
            ]
        },
        {
            key: 'arousal', label: 'Energia', options: [
                { value: 'LOW', label: 'Calmo' }, { value: 'MEDIUM', label: 'Moderado' }, { value: 'HIGH', label: 'Energético' }
            ]
        },
        {
            key: 'dominance', label: 'Dominância', options: [
                { value: 'SUBMISSIVE', label: 'Submisso' }, { value: 'EGALITARIAN', label: 'Igual' }, { value: 'DOMINANT', label: 'Assertivo' }
            ]
        },
    ];

    return (
        <div className="space-y-4">
            {/* Big 5 Psychometrics */}
            <div className="space-y-1">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Big Five</span>
                <div className="space-y-3">
                    {big5Traits.map(t => (
                        <div key={t.key} className="space-y-1">
                            <span className="text-[10px] font-medium text-gray-700">{t.label}</span>
                            <ToggleGroup type="single" variant="outline"
                                value={(dna as any).psychometrics?.[t.key] || 'MEDIUM'}
                                onValueChange={(val) => { if (val) updateDna('psychometrics', t.key, val); }}
                                className="w-full grid grid-cols-3 gap-1">
                                {t.options.map(o => (
                                    <ToggleGroupItem key={o.value} value={o.value}
                                        className="text-[10px] h-7 data-[state=on]:bg-indigo-100 data-[state=on]:text-indigo-700 data-[state=on]:border-indigo-300">
                                        {o.label}
                                    </ToggleGroupItem>
                                ))}
                            </ToggleGroup>
                        </div>
                    ))}
                </div>
            </div>

            {/* PAD Emotional Baseline */}
            <div className="space-y-1 pt-2 border-t border-gray-100">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Emoção Base</span>
                <div className="space-y-3">
                    {padTraits.map(t => (
                        <div key={t.key} className="space-y-1">
                            <span className="text-[10px] font-medium text-gray-700">{t.label}</span>
                            <ToggleGroup type="single" variant="outline"
                                value={(dna as any).pad_baseline?.[t.key] || t.options[1].value}
                                onValueChange={(val) => { if (val) updateDna('pad_baseline', t.key, val); }}
                                className="w-full grid grid-cols-3 gap-1">
                                {t.options.map(o => (
                                    <ToggleGroupItem key={o.value} value={o.value}
                                        className="text-[10px] h-7 data-[state=on]:bg-purple-100 data-[state=on]:text-purple-700 data-[state=on]:border-purple-300">
                                        {o.label}
                                    </ToggleGroupItem>
                                ))}
                            </ToggleGroup>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function WritingTab({ dna, updateDna }: any) {
    const writingTraits = [
        {
            section: 'linguistics', key: 'formality', label: 'Formalidade', options: [
                { value: 'INFORMAL', label: 'Informal' }, { value: 'BALANCED', label: 'Equilibrado' }, { value: 'FORMAL', label: 'Formal' }
            ]
        },
        {
            section: 'linguistics', key: 'emoji_frequency', label: 'Uso de Emojis', options: [
                { value: 'NONE', label: 'Nunca' }, { value: 'LOW', label: 'Pouco' }, { value: 'MEDIUM', label: 'Moderado' }, { value: 'HIGH', label: 'Muito' }
            ]
        },
        {
            section: 'linguistics', key: 'caps_usage', label: 'Uso de CAPS', options: [
                { value: 'NEVER', label: 'Nunca' }, { value: 'STANDARD', label: 'Padrão' }, { value: 'FREQUENT', label: 'Frequente' }
            ]
        },
        {
            section: 'chronemics', key: 'latency_profile', label: 'Latência', options: [
                { value: 'FAST', label: 'Rápido' }, { value: 'MODERATE', label: 'Moderado' }, { value: 'SLOW', label: 'Lento' }, { value: 'VARIABLE', label: 'Variável' }
            ]
        },
        {
            section: 'chronemics', key: 'burstiness', label: 'Burstiness', options: [
                { value: 'NONE', label: 'Uma msg' }, { value: 'LOW', label: 'Pouco' }, { value: 'MEDIUM', label: 'Médio' }, { value: 'HIGH', label: 'Muito' }
            ]
        },
    ];

    return (
        <div className="space-y-4">
            {writingTraits.map(t => (
                <div key={t.key} className="space-y-1">
                    <span className="text-[10px] font-medium text-gray-700">{t.label}</span>
                    <ToggleGroup type="single" variant="outline"
                        value={(dna as any)[t.section]?.[t.key] || t.options[1]?.value || 'MEDIUM'}
                        onValueChange={(val) => { if (val) updateDna(t.section, t.key, val); }}
                        className={`w-full grid gap-1 ${t.options.length === 4 ? 'grid-cols-4' : 'grid-cols-3'}`}>
                        {t.options.map(o => (
                            <ToggleGroupItem key={o.value} value={o.value}
                                className="text-[10px] h-7 data-[state=on]:bg-sky-100 data-[state=on]:text-sky-700 data-[state=on]:border-sky-300">
                                {o.label}
                            </ToggleGroupItem>
                        ))}
                    </ToggleGroup>
                </div>
            ))}
            <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                <Label className="text-xs text-gray-700">Erros intencionais de digitação</Label>
                <Switch checked={dna.linguistics?.intentional_typos || false}
                    onCheckedChange={(c) => updateDna('linguistics', 'intentional_typos', c)} />
            </div>
            <div className="space-y-1">
                <Label className="text-xs text-gray-500">Latência base (ms)</Label>
                <Input type="number" value={dna.chronemics?.base_latency_ms || 1500}
                    onChange={e => updateDna('chronemics', 'base_latency_ms', parseInt(e.target.value))} className="h-8 text-xs" />
            </div>
            <div className="space-y-1">
                <Label className="text-xs text-gray-500">Limite de caracteres por msg</Label>
                <Input type="number" value={dna.linguistics?.max_chars || 300}
                    onChange={e => updateDna('linguistics', 'max_chars', parseInt(e.target.value))} className="h-8 text-xs" />
            </div>
        </div>
    );
}

function SafetyTab({ dna, updateDna }: any) {
    const [newTopic, setNewTopic] = useState('');
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                <div>
                    <Label className="text-xs font-medium text-gray-700">Transbordo habilitado</Label>
                    <p className="text-[10px] text-gray-400">Permite transferir para humano</p>
                </div>
                <Switch checked={dna.guardrails?.handoff_enabled ?? true}
                    onCheckedChange={(c) => updateDna('guardrails', 'handoff_enabled', c)} />
            </div>
            <div className="space-y-1">
                <Label className="text-xs text-gray-500">Máx. turnos antes do transbordo</Label>
                <Input type="number" value={dna.guardrails?.max_turns_before_handoff || 20}
                    onChange={e => updateDna('guardrails', 'max_turns_before_handoff', parseInt(e.target.value))} className="h-8 text-xs" />
            </div>
            <div className="space-y-2">
                <Label className="text-xs text-gray-500">Tópicos Proibidos</Label>
                <div className="flex gap-2">
                    <Input value={newTopic} onChange={e => setNewTopic(e.target.value)} placeholder="Ex: política, religião"
                        className="h-8 text-xs flex-1" onKeyDown={e => {
                            if (e.key === 'Enter' && newTopic.trim()) {
                                updateDna('guardrails', 'forbidden_topics', [...(dna.guardrails?.forbidden_topics || []), newTopic.trim()]);
                                setNewTopic('');
                            }
                        }} />
                    <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => {
                        if (newTopic.trim()) {
                            updateDna('guardrails', 'forbidden_topics', [...(dna.guardrails?.forbidden_topics || []), newTopic.trim()]);
                            setNewTopic('');
                        }
                    }}>+</Button>
                </div>
                <div className="flex flex-wrap gap-1">
                    {(dna.guardrails?.forbidden_topics || []).map((t: string, i: number) => (
                        <span key={i} className="text-[10px] bg-red-50 text-red-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                            {t}
                            <button onClick={() => updateDna('guardrails', 'forbidden_topics',
                                (dna.guardrails?.forbidden_topics || []).filter((_: any, idx: number) => idx !== i))}
                                className="hover:text-red-900">×</button>
                        </span>
                    ))}
                </div>
            </div>

        </div>
    );
}

function VoiceTab({ dna, updateDna, agentId }: { dna: any; updateDna: (section: string, key: string, value: any) => void; agentId?: string }) {
    const [voices, setVoices] = useState<VoiceClone[]>([]);
    const [loading, setLoading] = useState(false);
    const [enrolling, setEnrolling] = useState(false);
    const [success, setSuccess] = useState(false);
    const [voiceName, setVoiceName] = useState('');
    const [voiceDescription, setVoiceDescription] = useState('');
    const [previewing, setPreviewingId] = useState<string | null>(null);
    const [audioPlayer, setAudioPlayer] = useState<HTMLAudioElement | null>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const voiceConfig: VoiceConfig = dna.voice_config || {
        voice_id: '',
        voice_name: '',
        provider: 'qwen', // default
        enabled: false,
        response_mode: 'text_only',
        speed: 1.0,
        temperature: 0.5,
        dynamic_emotion: false
    };

    // Load voices on mount
    useEffect(() => {
        if (!agentId) return;
        loadVoices();
        return () => { audioPlayer?.pause(); };
    }, [agentId]);

    const loadVoices = async () => {
        setLoading(true);
        try {
            const list = await agentService.listVoices(agentId!);
            setVoices(list);
        } catch (e) { console.error('Error loading voices:', e); }
        setLoading(false);
    };

    const handlePreview = async (voice: VoiceClone) => {
        if (previewing === voice.id && audioPlayer) {
            audioPlayer.pause();
            setPreviewingId(null);
            setAudioPlayer(null);
            return;
        }

        if (audioPlayer) {
            audioPlayer.pause(); // stop current
        }

        setPreviewingId(voice.id);

        // Use sample_url if available, else generate TTS preview
        let urlToPlay;
        try {
            if (voice.sample_url) {
                urlToPlay = voice.sample_url;
            } else {
                const { audio_base64 } = await agentService.previewVoice(voice.id, "Olá, eu sou sua nova voz inteligente.", voice.provider || 'qwen', agentId!);
                urlToPlay = `data:audio/mp3;base64,${audio_base64}`;
            }
        } catch (err: any) {
            alert(`Erro no preview: ${err.message}`);
            setPreviewingId(null);
            return;
        }

        if (urlToPlay) {
            const audio = new Audio(urlToPlay);
            audio.onended = () => {
                setPreviewingId(null);
                setAudioPlayer(null);
            };
            audio.play();
            setAudioPlayer(audio);
        } else {
            setPreviewingId(null); // failure
        }
    };

    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        setSelectedFile(file);
        // Auto-fill name if empty
        if (!voiceName) {
            setVoiceName(file.name.replace(/\.[^/.]+$/, "").substring(0, 20));
        }
    }

    async function handleEnroll() {
        if (!selectedFile || !voiceName.trim()) return;

        setEnrolling(true);
        try {
            const base64 = await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.readAsDataURL(selectedFile);
            });

            // Use user-provided name strictly
            const nameToUse = voiceName.trim();
            // Pass provider from config
            const providerToUse = voiceConfig.provider || 'qwen';

            const result = await agentService.enrollVoice(base64, nameToUse, voiceDescription, agentId, providerToUse);

            // Auto-select the new voice
            updateDna('voice_config', 'voice_id', result.voice_id);
            updateDna('voice_config', 'voice_name', nameToUse);
            updateDna('voice_config', 'provider', result.provider);
            updateDna('voice_config', 'enabled', true);

            setSuccess(true);
            setVoiceName('');
            setVoiceDescription('');
            setSelectedFile(null);
            setTimeout(() => setSuccess(false), 5000);
            await loadVoices();
        } catch (err: any) {
            alert(`Erro ao clonar voz: ${err.message}`);
        } finally {
            setEnrolling(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    }

    const handleDeleteVoice = async (id: string, provider: string) => {
        if (!confirm('Tem certeza? Isso apagará a voz permanentemente.')) return;
        try {
            await agentService.deleteVoice(id, provider, agentId!);
            // Deselect if active
            if (voiceConfig.voice_id === id) {
                updateDna('voice_config', 'voice_id', '');
                updateDna('voice_config', 'enabled', false);
            }
            loadVoices();
        } catch (e) {
            alert('Erro ao excluir voz');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between p-3 rounded-lg bg-indigo-50 border border-indigo-100">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${voiceConfig.enabled ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-400'}`}>
                        {voiceConfig.enabled ? <Mic size={18} /> : <MicOff size={18} />}
                    </div>
                    <div>
                        <Label className="text-sm font-semibold text-indigo-900">Voz do Agente</Label>
                        <p className="text-[10px] text-indigo-600">
                            {voiceConfig.enabled
                                ? `Ativo: ${voiceConfig.voice_name || 'Voz Selecionada'}`
                                : 'Os áudios estão desativados'}
                        </p>
                    </div>
                </div>
                <Switch
                    checked={voiceConfig.enabled || false}
                    onCheckedChange={(c) => updateDna('voice_config', 'enabled', c)}
                />
            </div>

            {/* RESPONSE MODE */}
            <div className="space-y-2">
                <Label className="text-xs text-gray-500">Modo de Resposta</Label>
                <div className="grid grid-cols-2 gap-2">
                    {[
                        { id: 'text_only', label: 'Somente Texto', icon: <MessageSquare size={14} /> },
                        { id: 'voice_only', label: 'Somente Voz', icon: <Volume2 size={14} /> },
                        { id: 'mirror', label: 'Espelhar Áudio', icon: <RefreshCw size={14} /> },
                        { id: 'hybrid', label: 'Híbrido (Smart)', icon: <Zap size={14} /> }
                    ].map(m => (
                        <button key={m.id}
                            onClick={() => updateDna('voice_config', 'response_mode', m.id)}
                            className={cn(
                                "flex items-center gap-2 p-2 rounded-lg border text-xs transition-all",
                                voiceConfig.response_mode === m.id
                                    ? "border-indigo-500 bg-indigo-50 text-indigo-700 font-semibold"
                                    : "border-gray-200 bg-white hover:border-gray-300 text-gray-600"
                            )}
                        >
                            {m.icon}
                            {m.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* HYBRID TRIGGERS */}
            {voiceConfig.response_mode === 'hybrid' && (
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-100 space-y-3 animate-in fade-in zoom-in-95">
                    <div className="flex items-center gap-2 text-amber-800">
                        <Zap size={14} />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Gatilhos de Voz (Smart)</span>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                        {[
                            { id: 'first_message', label: 'Primeira Mensagem' },
                            { id: 'mirror_audio', label: 'Quando Lead usar Áudio' },
                            { id: 'after_objection', label: 'Após Objeção' },
                            { id: 'on_close', label: 'No Fechamento' }
                        ].map(t => (
                            <div key={t.id} className="flex items-center justify-between bg-white/50 p-2 rounded border border-amber-200/50">
                                <Label className="text-[11px] text-amber-900">{t.label}</Label>
                                <Switch
                                    checked={(voiceConfig.triggers as any)?.[t.id] || false}
                                    onCheckedChange={(c) => {
                                        const newTriggers = { ...(voiceConfig.triggers || {}), [t.id]: c };
                                        updateDna('voice_config', 'triggers', newTriggers);
                                    }}
                                    className="scale-75 data-[state=checked]:bg-amber-600"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* PROVIDER SELECTION */}
            <div className="space-y-2">
                <Label className="text-xs text-gray-500">Provedor de Voz</Label>
                <div className="flex gap-2">
                    {[
                        { id: 'qwen', label: 'Qwen (DashScope)', desc: 'Clonagem Rápida' },
                        { id: 'lmnt', label: 'LMNT', desc: 'Alta Qualidade + Emoção' }
                    ].map(p => (
                        <button key={p.id}
                            onClick={() => updateDna('voice_config', 'provider', p.id)}
                            className={cn(
                                "flex-1 flex flex-col items-center p-3 rounded-xl border transition-all",
                                voiceConfig.provider === p.id
                                    ? "border-indigo-500 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-500"
                                    : "border-gray-200 bg-white hover:border-gray-300"
                            )}
                        >
                            <span className="text-sm font-bold">{p.label}</span>
                            <span className="text-[10px] text-gray-500">{p.desc}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* LMNT ADVANCED SETTINGS */}
            {voiceConfig.provider === 'lmnt' && (
                <div className="space-y-4 p-4 bg-gray-50 rounded-xl border border-gray-200 animate-in slide-in-from-top-2">
                    <div className="flex items-center gap-2 mb-2">
                        <Activity className="w-4 h-4 text-purple-600" />
                        <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wide">Personalidade da Voz</h4>
                    </div>

                    {/* Speed Slider */}
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <Label className="text-xs text-gray-600">Velocidade Base</Label>
                            <span className="text-[10px] font-mono bg-white px-1.5 rounded border">{voiceConfig.speed || 1.0}x</span>
                        </div>
                        <input
                            type="range" min="0.5" max="2.0" step="0.1"
                            value={voiceConfig.speed || 1.0}
                            onChange={(e) => updateDna('voice_config', 'speed', parseFloat(e.target.value))}
                            className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                        />
                        <div className="flex justify-between text-[9px] text-gray-400 px-1">
                            <span>Lento</span>
                            <span>Rápido</span>
                        </div>
                    </div>

                    {/* Temperature Slider */}
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <Label className="text-xs text-gray-600">Expressividade (Temp)</Label>
                            <span className="text-[10px] font-mono bg-white px-1.5 rounded border">{voiceConfig.temperature || 0.5}</span>
                        </div>
                        <input
                            type="range" min="0.0" max="1.0" step="0.1"
                            value={voiceConfig.temperature || 0.5}
                            onChange={(e) => updateDna('voice_config', 'temperature', parseFloat(e.target.value))}
                            className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                        />
                        <div className="flex justify-between text-[9px] text-gray-400 px-1">
                            <span>Monótono</span>
                            <span>Dinâmico</span>
                        </div>
                    </div>

                    {/* Dynamic Emotion Toggle */}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-200/50">
                        <div>
                            <Label className="text-xs font-semibold text-purple-700">Adaptação Emocional Dinâmica</Label>
                            <p className="text-[10px] text-gray-500 leading-tight mt-0.5">
                                Ajusta velocidade e tom baseado na emoção do Lead (PAD).
                            </p>
                        </div>
                        <Switch
                            checked={voiceConfig.dynamic_emotion || false}
                            onCheckedChange={(c) => updateDna('voice_config', 'dynamic_emotion', c)}
                            className="data-[state=checked]:bg-purple-600"
                        />
                    </div>
                </div>
            )}

            {/* Voice List & Enrollment */}
            <div className="space-y-3 pt-2">
                <Label className="text-xs text-gray-500">Biblioteca de Vozes ({voiceConfig.provider})</Label>

                {/* List */}
                <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1">
                    {voices.filter(v => v.provider === voiceConfig.provider || (!v.provider && voiceConfig.provider === 'qwen')).map(voice => (
                        <div key={voice.id}
                            onClick={() => {
                                updateDna('voice_config', 'voice_id', voice.id);
                                updateDna('voice_config', 'voice_name', voice.name);
                                updateDna('voice_config', 'provider', voice.provider || 'qwen');
                            }}
                            className={cn(
                                "flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition-all hover:border-indigo-300",
                                voiceConfig.voice_id === voice.id ? "bg-indigo-50 border-indigo-500 ring-1 ring-indigo-500" : "bg-white border-gray-200"
                            )}
                        >
                            <div className="flex items-center gap-2 overflow-hidden">
                                <div className={cn("p-1.5 rounded-full shrink-0", voiceConfig.voice_id === voice.id ? "bg-indigo-200 text-indigo-700" : "bg-gray-100 text-gray-500")}>
                                    <Mic size={14} />
                                </div>
                                <div className="truncate">
                                    <div className="flex items-center gap-1.5">
                                        <p className="text-xs font-medium truncate">{voice.name}</p>
                                        <span className={cn(
                                            "text-[8px] px-1 rounded-sm border uppercase font-bold",
                                            voice.provider === 'lmnt' ? "bg-purple-100 text-purple-700 border-purple-200" : "bg-blue-100 text-blue-700 border-blue-200"
                                        )}>
                                            {voice.provider || 'qwen'}
                                        </span>
                                    </div>
                                    <p className="text-[9px] text-gray-400">{voice.id.substring(0, 8)}...</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-1">
                                <button
                                    onClick={(e) => { e.stopPropagation(); handlePreview(voice); }}
                                    className={cn("p-1.5 rounded-md hover:bg-gray-100 transition-colors", previewing === voice.id ? "text-indigo-600 animate-pulse" : "text-gray-400")}
                                >
                                    {previewing === voice.id ? <Activity size={14} /> : <Play size={14} />}
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleDeleteVoice(voice.id, voice.provider || 'qwen'); }}
                                    className="p-1.5 rounded-md text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    ))}

                    {voices.filter(v => v.provider === voiceConfig.provider || (!v.provider && voiceConfig.provider === 'qwen')).length === 0 && (
                        <div className="text-center py-6 text-gray-400 text-xs border border-dashed rounded-lg bg-gray-50/50">
                            Nenhuma voz encontrada para este provedor.
                        </div>
                    )}
                </div>

                {/* New Enrollment */}
                <div className="border border-indigo-100 bg-indigo-50/30 rounded-xl p-3 space-y-3 mt-2">
                    <Label className="text-xs font-semibold text-indigo-900 flex items-center gap-2">
                        <Upload className="w-3 h-3" />
                        Clonar Nova Voz ({voiceConfig.provider === 'lmnt' ? 'LMNT Instant' : 'Qwen Fast'})
                    </Label>

                    <div className="grid grid-cols-2 gap-2">
                        <Input
                            value={voiceName}
                            onChange={(e) => setVoiceName(e.target.value)}
                            placeholder="Nome da Voz"
                            className="col-span-2 h-8 text-xs bg-white"
                        />
                        <Input
                            value={voiceDescription}
                            onChange={(e) => setVoiceDescription(e.target.value)}
                            placeholder="Descrição (opcional)"
                            className="col-span-2 h-8 text-xs bg-white"
                        />
                    </div>

                    <div className="flex gap-2">
                        <input
                            type="file"
                            accept="audio/*"
                            className="hidden"
                            ref={fileInputRef}
                            onChange={handleFileSelect}
                        />
                        <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}
                            className={cn("flex-1 h-8 text-xs bg-white", selectedFile && "border-green-500 text-green-700")}>
                            {selectedFile ? 'Arquivo Selecionado' : 'Selecionar Áudio'}
                        </Button>
                        <Button size="sm" onClick={handleEnroll} disabled={enrolling || !selectedFile || !voiceName}
                            className="flex-1 h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white">
                            {enrolling ? <RefreshCw className="w-3 h-3 animate-spin mr-1" /> : <Mic className="w-3 h-3 mr-1" />}
                            {enrolling ? 'Clonando...' : 'Clonar Agora'}
                        </Button>
                    </div>
                    {selectedFile && <p className="text-[9px] text-center text-gray-500">{selectedFile.name}</p>}
                </div>
            </div>
        </div>
    );
}

