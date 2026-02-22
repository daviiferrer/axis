import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/data-display/accordion";
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/forms/select";
import {
    User, Brain, Target, Shield, Zap, MessageSquare, Mic,
    Briefcase, Bot, Layout, Play, Pause, ChevronRight, CheckCircle2,
    AlertCircle, Sparkles, Wand2, Clock, Users, X, Plus, Activity, Volume2, RefreshCw, Upload, Trash2, LifeBuoy, Wrench
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { WIZARD_STEPS, ROLES } from './wizard-constants';
import { agentService, Agent } from '@/services/agentService';
import { DNAConfig, VoiceConfig } from '@/services/agentService'; // Assuming types are exported
import { VoiceConfigTab } from './voice-config-tab';
import { profileService } from '@/services/profileService';

interface AgentWizardProps {
    formData: any;
    onChange: (key: string, value: any) => void;
    agents: Agent[];
    onAgentsChange: () => void;
}

const DEFAULT_DNA: any = {
    psychometrics: { openness: 'HIGH', conscientiousness: 'HIGH', extraversion: 'MEDIUM', agreeableness: 'HIGH', neuroticism: 'LOW' },
    pad_baseline: { pleasure: 'POSITIVE', arousal: 'MEDIUM', dominance: 'EGALITARIAN' },
    linguistics: {
        reduction_profile: 'BALANCED', caps_mode: 'STANDARD', correction_style: 'ASTERISK_PRE',
        typo_injection: 'NONE', max_chars: 300,
        formality: 'BALANCED', emoji_frequency: 'LOW', caps_usage: 'STANDARD', intentional_typos: false,
    },
    chronemics: { latency_profile: 'MODERATE', burstiness: 'MEDIUM', base_latency_ms: 1500 },
    guardrails: { forbidden_topics: [], handoff_enabled: true, max_turns_before_handoff: 20 },
};

export function AgentWizard({ formData, onChange, agents, onAgentsChange }: AgentWizardProps) {
    const [mode, setMode] = useState<'SELECT' | 'CREATE'>(formData.agentId ? 'SELECT' : 'CREATE');
    const [activeStep, setActiveStep] = useState(formData.agentId ? "mission" : "identity");
    const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
    const [apiKey, setApiKey] = useState('');
    const [hasKey, setHasKey] = useState<boolean | null>(null);
    const [keyLoading, setKeyLoading] = useState(false);

    // Save state
    const [saving, setSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [saveMessage, setSaveMessage] = useState('');

    // Check for API key
    useEffect(() => {
        if (mode === 'CREATE') {
            profileService.hasApiKey('gemini')
                .then(r => setHasKey(r.hasKey))
                .catch(() => setHasKey(false));
        }
    }, [mode]);

    const saveApiKey = async () => {
        if (!apiKey.trim()) return;
        setKeyLoading(true);
        try {
            await profileService.updateApiKey('gemini', apiKey.trim());
            setHasKey(true);
        } catch (e) {
            console.error('Failed to save API key', e);
        } finally {
            setKeyLoading(false);
        }
    };

    // Sync selected agent
    useEffect(() => {
        if (formData.agentId && agents.length > 0) {
            const found = agents.find(a => a.id === formData.agentId);
            if (found) setSelectedAgent(found);
        }
    }, [formData.agentId, agents]);

    const handleSelectAgent = async (agentId: string) => {
        onChange('agentId', agentId);
        const agent = agents.find(a => a.id === agentId);
        if (agent) {
            setSelectedAgent(agent);
            // Propagate common fields to node config
            onChange('agentName', agent.name);
            onChange('role', agent.dna_config?.identity?.role || 'SDR');
            // We don't overwrite goal/slots as those are node-specific
        }
    };

    const handleCreateNew = () => {
        onChange('agentId', null);
        onChange('agentName', '');
        onChange('role', 'SDR');
        onChange('dna', DEFAULT_DNA);
        setMode('CREATE');
        setActiveStep('identity');
    };

    const handleEditSelected = () => {
        // Copy selected agent data to form to allow editing
        if (selectedAgent) {
            onChange('agentName', selectedAgent.name);
            onChange('role', selectedAgent.dna_config?.identity?.role || 'SDR');
            onChange('dna', selectedAgent.dna_config || DEFAULT_DNA);
            setMode('CREATE'); // Switch to edit interface
        }
    };

    // Helper to update DNA directly
    const updateDna = (section: string, fieldOrUpdates: string | Record<string, any>, value?: any) => {
        const currentDna = formData.dna || DEFAULT_DNA;
        const currentSection = currentDna[section] || {};

        let newSectionData;
        if (typeof fieldOrUpdates === 'string') {
            newSectionData = { ...currentSection, [fieldOrUpdates]: value };
        } else {
            newSectionData = { ...currentSection, ...fieldOrUpdates };
        }

        onChange('dna', {
            ...currentDna,
            [section]: newSectionData
        });
    };

    // Helper to check if a step is "complete" (simple validation)
    const isStepComplete = (stepId: string) => {
        const dna = formData.dna || {};
        switch (stepId) {
            case 'identity':
                return !!formData.agentName && !!formData.role; // Name & Role required
            case 'behavior': // Added Behavior check
                return !!dna.psychometrics;
            default:
                return false;
        }
    };

    const handleSaveAgent = async () => {
        if (!formData.agentName?.trim()) return;
        setSaving(true);
        setSaveStatus('idle');
        try {
            const currentDna = formData.dna || DEFAULT_DNA;
            // Ensure identity role matches UI
            const finalDna = { ...currentDna, identity: { role: formData.role || 'SDR' } };

            const payload = {
                name: formData.agentName.trim(),
                description: '',
                model: formData.model || 'gemini-2.5-flash',
                provider: 'gemini',
                dna_config: finalDna,
            };

            let result: Agent;
            if (formData.agentId) {
                // If editing existing
                result = await agentService.update(formData.agentId, payload);
            } else {
                // If creating new
                result = await agentService.create(payload as any);
            }

            // Update parent node data
            onChange('agentId', result.id);
            onChange('agentName', result.name);
            onChange('model', result.model || 'gemini-2.5-flash');
            onChange('role', result.dna_config?.identity?.role || formData.role);

            setSelectedAgent(result);
            onAgentsChange();
            setSaveStatus('success');
            setSaveMessage(formData.agentId ? 'Agente atualizado com sucesso!' : 'Agente criado com sucesso!');

            // Switch to select mode to show node settings
            setTimeout(() => {
                setSaveStatus('idle');
                setMode('SELECT');
            }, 1500);

        } catch (e: any) {
            console.error('Agent save failed:', e);
            setSaveStatus('error');
            if (e?.response?.data?.error === 'MISSING_API_KEY') {
                setSaveMessage('Configure sua API Key Gemini primeiro.');
            } else {
                setSaveMessage(e?.response?.data?.message || 'Erro ao salvar agente. Tente novamente.');
            }
            setTimeout(() => setSaveStatus('idle'), 4000);
        }
        setSaving(false);
    };

    return (
        <div className="flex flex-col h-full bg-gray-50/50">
            {/* Header: Mode Switch & Progress */}
            <div className="px-5 py-3 border-b bg-white flex flex-col gap-3 sticky top-0 z-10 shadow-sm">
                <div className="flex bg-gray-100 p-1 rounded-lg">
                    <button
                        onClick={() => setMode('SELECT')}
                        className={cn("flex-1 text-xs font-medium py-1.5 rounded-md transition-all", mode === 'SELECT' ? "bg-white shadow text-indigo-700" : "text-gray-500 hover:text-gray-700")}
                    >
                        Selecionar Existente
                    </button>
                    <button
                        onClick={handleCreateNew}
                        className={cn("flex-1 text-xs font-medium py-1.5 rounded-md transition-all", mode === 'CREATE' ? "bg-white shadow text-indigo-700" : "text-gray-500 hover:text-gray-700")}
                    >
                        Criar / Editar
                    </button>
                </div>

                {mode === 'CREATE' && (
                    <div className="flex gap-1 justify-center">
                        {WIZARD_STEPS.map(step => (
                            <div key={step.id}
                                onClick={() => setActiveStep(step.id)}
                                className={cn(
                                    "w-2 h-2 rounded-full cursor-pointer transition-all",
                                    activeStep === step.id ? "bg-indigo-600 scale-125" :
                                        isStepComplete(step.id) ? "bg-green-500" : "bg-gray-200"
                                )} />
                        ))}
                    </div>
                )}
            </div>

            {/* ScrollArea removed here as it is handled by parent NodeConfigSheet */}
            <div className="flex-1">
                <div className="p-4 pb-20">

                    {/* MODE: SELECT EXISTING */}
                    {mode === 'SELECT' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-left-2">
                            <div className="space-y-2">
                                <Label className="text-xs text-gray-500 pl-1">Agente Ativo</Label>
                                <Select value={formData.agentId || undefined} onValueChange={handleSelectAgent}>
                                    <SelectTrigger className="h-14 rounded-xl bg-white border-gray-200">
                                        <div className="flex items-center gap-3">
                                            <div className="p-1.5 bg-indigo-50 rounded-lg">
                                                <Bot className="w-5 h-5 text-indigo-600" strokeWidth={1.5} />
                                            </div>
                                            <div className="flex flex-col items-start text-left">
                                                <SelectValue placeholder="Escolha um agente..." />
                                                <span className="text-[10px] text-gray-400">Define personalidade & conhecimento</span>
                                            </div>
                                        </div>
                                    </SelectTrigger>
                                    <SelectContent className="max-h-64">
                                        {agents.length === 0 ? (
                                            <div className="p-4 text-center">
                                                <p className="text-xs text-gray-500 mb-2">Nenhum agente encontrado</p>
                                                <Button size="sm" variant="outline" onClick={handleCreateNew} className="h-7 text-[10px] rounded-lg">
                                                    Criar Primeiro Agente
                                                </Button>
                                            </div>
                                        ) : (
                                            agents.map(a => (
                                                <SelectItem key={a.id} value={a.id}>
                                                    <span className="font-medium">{a.name}</span>
                                                    <span className="block text-[10px] text-gray-400">{a.model} • {a.dna_config?.identity?.role || 'sdr'}</span>
                                                </SelectItem>
                                            ))
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>

                            {formData.agentId && (
                                <>
                                    <div className="flex gap-2">
                                        <Button onClick={handleEditSelected} variant="outline" size="sm" className="flex-1 text-xs h-9">
                                            <Brain size={14} className="mr-2 text-purple-600" />
                                            Editar DNA do Agente
                                        </Button>
                                    </div>

                                    <div className="mt-6 pt-6 border-t border-gray-100 pb-20">
                                        <div className="flex items-center gap-2 mb-4">
                                            <div className="p-1.5 bg-emerald-100 rounded-lg text-emerald-700">
                                                <Target size={16} />
                                            </div>
                                            <div>
                                                <h3 className="text-xs font-bold text-gray-900">Configuração do Passo</h3>
                                                <p className="text-[10px] text-gray-500">Regras específicas para este nó</p>
                                            </div>
                                        </div>

                                        <Tabs defaultValue="context" className="w-full">
                                            <TabsList className="w-full grid grid-cols-3 bg-gray-100 p-0.5 rounded-lg h-auto mb-4">
                                                <TabsTrigger value="context" className="text-[10px] py-1.5 px-1 truncate">Missão & Contexto</TabsTrigger>
                                                <TabsTrigger value="tools" className="text-[10px] py-1.5 px-1 truncate flex items-center gap-1"><Wrench size={10} /> Ferramentas</TabsTrigger>
                                                <TabsTrigger value="voice" className="text-[10px] py-1.5 px-1 truncate">Modo de Voz</TabsTrigger>
                                            </TabsList>

                                            <TabsContent value="context" className="mt-0 space-y-4">
                                                <NodeContextSettings formData={formData} onChange={onChange} />
                                                <AgentMissionSettings formData={formData} onChange={onChange} />
                                            </TabsContent>

                                            <TabsContent value="tools" className="mt-0">
                                                <NodeToolsSettings formData={formData} onChange={onChange} />
                                            </TabsContent>

                                            <TabsContent value="voice" className="mt-0">
                                                <NodeVoiceSettings formData={formData} onChange={onChange} />
                                            </TabsContent>
                                        </Tabs>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {/* MODE: CREATE / EDIT */}
                    {mode === 'CREATE' && (
                        <Accordion
                            type="single"
                            collapsible
                            value={activeStep}
                            onValueChange={setActiveStep}
                            className="space-y-4"
                        >
                            {/* 1. IDENTITY STEP */}
                            <AccordionItem value="identity" className="border rounded-xl bg-white shadow-sm overflow-hidden">
                                <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-gray-50">
                                    <div className="flex items-center gap-3 text-left">
                                        <div className={cn("p-2 rounded-lg", activeStep === 'identity' ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500")}>
                                            <User size={18} />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold text-gray-900">1. Identidade</h3>
                                            <p className="text-[11px] text-gray-500">Quem é o agente?</p>
                                        </div>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="px-4 pb-4 pt-0 space-y-4">
                                    <Separator className="mb-4" />
                                    <div className="space-y-2">
                                        <Label className="text-xs font-semibold">Nome do Agente</Label>
                                        <Input
                                            value={formData.agentName || ''}
                                            onChange={e => onChange('agentName', e.target.value)}
                                            placeholder="Ex: Sofia (SDR)"
                                            className="bg-gray-50/50"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-semibold">Modelo de IA</Label>
                                        <Select
                                            value={formData.model || 'gemini-2.5-flash'}
                                            onValueChange={v => onChange('model', v)}
                                        >
                                            <SelectTrigger className="h-9 text-xs bg-white">
                                                <SelectValue placeholder="Selecione o modelo..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="gemini-2.5-flash">Gemini 2.5 Flash</SelectItem>
                                                <SelectItem value="gemini-2.5-flash-lite">Gemini 2.5 Flash Lite</SelectItem>
                                                <SelectItem value="gemini-3.0-flash">Gemini 3.0 Flash</SelectItem>
                                            </SelectContent>
                                        </Select>

                                        {hasKey === false && (
                                            <div className="mt-3 p-3 bg-amber-50 rounded-xl border border-amber-200 animate-in fade-in slide-in-from-top-2 shadow-sm">
                                                <div className="flex items-start gap-3">
                                                    <div className="p-1.5 bg-amber-100 rounded-full shrink-0">
                                                        <AlertCircle size={16} className="text-amber-600" />
                                                    </div>
                                                    <div className="flex-1 space-y-2.5">
                                                        <div>
                                                            <span className="text-xs font-bold text-amber-900 block mb-0.5">Chave Gemini Ausente</span>
                                                            <span className="text-[10px] text-amber-700 leading-relaxed block">
                                                                Para dar vida a este agente, você precisa configurar sua chave de API do Google Gemini.
                                                            </span>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <Input
                                                                type="password"
                                                                placeholder="Cole a API Key (AIzaSy...)"
                                                                value={apiKey}
                                                                onChange={e => setApiKey(e.target.value)}
                                                                className="h-8 text-xs bg-white border-amber-200 focus-visible:ring-amber-500 shadow-sm"
                                                            />
                                                            <Button
                                                                size="sm"
                                                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); saveApiKey(); }}
                                                                disabled={keyLoading || !apiKey}
                                                                className="h-8 text-xs bg-amber-600 hover:bg-amber-700 text-white shadow-sm px-4 shrink-0 transition-opacity"
                                                            >
                                                                {keyLoading ? <Activity size={12} className="animate-spin" /> : 'Salvar'}
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-semibold">Função (Cargo)</Label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {ROLES.map(role => {
                                                const Icon = role.icon;
                                                const isSelected = formData.role === role.id;
                                                return (
                                                    <button
                                                        key={role.id}
                                                        onClick={() => onChange('role', role.id)}
                                                        className={cn(
                                                            "flex flex-col items-start p-3 rounded-xl border text-left transition-all hover:border-indigo-300",
                                                            isSelected
                                                                ? "bg-indigo-50 border-indigo-500 ring-1 ring-indigo-500"
                                                                : "bg-white border-gray-200"
                                                        )}
                                                    >
                                                        <div className="flex items-center justify-between w-full mb-1">
                                                            <Icon size={16} className={isSelected ? "text-indigo-600" : "text-gray-400"} />
                                                            {isSelected && <CheckCircle2 size={14} className="text-indigo-600" />}
                                                        </div>
                                                        <span className={cn("text-xs font-bold block", isSelected ? "text-indigo-900" : "text-gray-700")}>
                                                            {role.label}
                                                        </span>
                                                        <span className="text-[10px] text-gray-500 leading-tight block mt-1">
                                                            {role.description}
                                                        </span>
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </div>
                                    <div className="flex justify-end mt-4">
                                        <Button size="sm" variant="ghost" className="text-xs text-indigo-600" onClick={() => setActiveStep('behavior')}>
                                            Próximo: DNA Avançado <ChevronRight size={12} className="ml-1" />
                                        </Button>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>

                            {/* The "Cérebro" step was removed to separate Persona from Node settings. Objective/Story is now configured at the Node level. */}

                            {/* 3. DNA AVANÇADO (FULL SPECTRUM) */}
                            <AccordionItem value="behavior" className="border rounded-xl bg-white shadow-sm overflow-hidden">
                                <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-gray-50">
                                    <div className="flex items-center gap-3 text-left">
                                        <div className={cn("p-2 rounded-lg", activeStep === 'behavior' ? "bg-orange-100 text-orange-700" : "bg-gray-100 text-gray-500")}>
                                            <Activity size={18} />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold text-gray-900">3. DNA Avançado</h3>
                                            <p className="text-[11px] text-gray-500">Personalidade & Comportamento</p>
                                        </div>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="px-4 pb-4 pt-0 space-y-6">
                                    <Separator className="mb-4" />

                                    {/* A. PSYCHOMETRICS (BIG 5) */}
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Sparkles size={14} className="text-orange-500" />
                                            <Label className="text-xs font-bold text-gray-800">Psicometria (Big 5)</Label>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            {[
                                                { key: 'openness', label: 'Criatividade (Openness)', options: [{ v: 'LOW', l: 'Prático / Conservador' }, { v: 'MEDIUM', l: 'Equilibrado' }, { v: 'HIGH', l: 'Criativo / Curioso' }] },
                                                { key: 'conscientiousness', label: 'Organização (Conscientiousness)', options: [{ v: 'LOW', l: 'Espontâneo / Flexível' }, { v: 'MEDIUM', l: 'Equilibrado' }, { v: 'HIGH', l: 'Disciplinado / Metódico' }] },
                                                { key: 'extraversion', label: 'Extroversão', options: [{ v: 'LOW', l: 'Reservado / Introvertido' }, { v: 'MEDIUM', l: 'Ambivertido' }, { v: 'HIGH', l: 'Sociável / Falante' }] },
                                                { key: 'agreeableness', label: 'Amabilidade', options: [{ v: 'LOW', l: 'Direto / Competitivo' }, { v: 'MEDIUM', l: 'Cooperativo' }, { v: 'HIGH', l: 'Empático / Altruísta' }] },
                                                { key: 'neuroticism', label: 'Estabilidade Emocional', options: [{ v: 'LOW', l: 'Resiliente / Calmo' }, { v: 'MEDIUM', l: 'Reativo' }, { v: 'HIGH', l: 'Sensível / Ansioso' }] },
                                            ].map(trait => (
                                                <div key={trait.key} className="space-y-1">
                                                    <Label className="text-[10px] text-gray-500">{trait.label}</Label>
                                                    <Select
                                                        value={(formData.dna?.psychometrics || {})[trait.key] || 'MEDIUM'}
                                                        onValueChange={(v) => updateDna('psychometrics', trait.key, v)}
                                                    >
                                                        <SelectTrigger className="h-8 text-[11px] bg-white">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {trait.options.map(o => (
                                                                <SelectItem key={o.v} value={o.v} className="text-[11px]">
                                                                    {o.l}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <Separator />

                                    {/* B. EMOTIONAL STATE (PAD) */}
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Zap size={14} className="text-yellow-500" />
                                            <Label className="text-xs font-bold text-gray-800">Estado Emocional (PAD)</Label>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2">
                                            {[
                                                { key: 'pleasure', label: 'Prazer (P)', options: [{ v: 'NEGATIVE', l: 'Descontente' }, { v: 'NEUTRAL', l: 'Neutro' }, { v: 'POSITIVE', l: 'Contente' }] },
                                                { key: 'arousal', label: 'Energia (A)', options: [{ v: 'LOW', l: 'Calmo' }, { v: 'MEDIUM', l: 'Alerta' }, { v: 'HIGH', l: 'Excitado' }] },
                                                { key: 'dominance', label: 'Dominância (D)', options: [{ v: 'SUBMISSIVE', l: 'Submisso' }, { v: 'EGALITARIAN', l: 'Igualitário' }, { v: 'DOMINANT', l: 'Dominante' }] },
                                            ].map(trait => (
                                                <div key={trait.key} className="space-y-1">
                                                    <Label className="text-[10px] text-gray-500">{trait.label}</Label>
                                                    <Select
                                                        value={(formData.dna?.pad_baseline || {})[trait.key] || 'EGALITARIAN'} // Default fallback fix
                                                        onValueChange={(v) => updateDna('pad_baseline', trait.key, v)}
                                                    >
                                                        <SelectTrigger className="h-8 text-[10px] bg-white px-2">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {trait.options.map(o => (
                                                                <SelectItem key={o.v} value={o.v} className="text-[11px]">
                                                                    {o.l}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <Separator />

                                    {/* C. COMMUNICATION STYLE (LINGUISTICS) */}
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 mb-2">
                                            <MessageSquare size={14} className="text-blue-500" />
                                            <Label className="text-xs font-bold text-gray-800">Estilo de Comunicação</Label>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1">
                                                <Label className="text-[10px] text-gray-500">Formalidade</Label>
                                                <Select
                                                    value={formData.dna?.linguistics?.formality || 'BALANCED'}
                                                    onValueChange={(v) => updateDna('linguistics', 'formality', v)}
                                                >
                                                    <SelectTrigger className="h-8 text-[11px] bg-white">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="CASUAL" className="text-[11px]">Casual / Gírias</SelectItem>
                                                        <SelectItem value="BALANCED" className="text-[11px]">Balanceado</SelectItem>
                                                        <SelectItem value="FORMAL" className="text-[11px]">Formal / Profissional</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-[10px] text-gray-500">Uso de Emojis</Label>
                                                <Select
                                                    value={formData.dna?.linguistics?.emoji_frequency || 'LOW'}
                                                    onValueChange={(v) => updateDna('linguistics', 'emoji_frequency', v)}
                                                >
                                                    <SelectTrigger className="h-8 text-[11px] bg-white">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="NONE" className="text-[11px]">Nenhum</SelectItem>
                                                        <SelectItem value="LOW" className="text-[11px]">Baixo (Ocasional)</SelectItem>
                                                        <SelectItem value="HIGH" className="text-[11px]">Alto (Frequente)</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-[10px] text-gray-500">Tamanho da Resposta</Label>
                                                <Select
                                                    value={formData.dna?.linguistics?.reduction_profile || 'BALANCED'}
                                                    onValueChange={(v) => updateDna('linguistics', 'reduction_profile', v)}
                                                >
                                                    <SelectTrigger className="h-8 text-[11px] bg-white">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="CONCISE" className="text-[11px]">Conciso (Curto)</SelectItem>
                                                        <SelectItem value="BALANCED" className="text-[11px]">Balanceado</SelectItem>
                                                        <SelectItem value="DETAILED" className="text-[11px]">Detalhado (Longo)</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        <div className="pt-2 flex items-center justify-between">
                                            <Label className="text-xs text-gray-600">Erros de Digitação (Humanizar)</Label>
                                            <Switch
                                                checked={formData.dna?.linguistics?.intentional_typos || false}
                                                onCheckedChange={(c) => updateDna('linguistics', 'intentional_typos', c)}
                                                className="scale-75 data-[state=checked]:bg-orange-500"
                                            />
                                        </div>
                                    </div>

                                    {/* Voice Config Preview (Restored per user request, now fully featured) */}
                                    <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                        <VoiceConfigTab dna={formData.dna} updateDna={updateDna} agentId={formData.agentId || undefined} />
                                    </div>

                                    <div className="flex justify-end mt-4">
                                        <Button size="sm" variant="ghost" className="text-xs text-indigo-600" onClick={() => { }}>
                                            Pode Salvar <CheckCircle2 size={12} className="ml-1" />
                                        </Button>
                                    </div>

                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    )}

                    {/* Select/Edit flow wraps up here */}
                </div>
            </div>

            {/* Footer Actions - Only in Create Mode */}
            {mode === 'CREATE' && (
                <div className="p-4 border-t bg-white safe-area-pb space-y-3">
                    {saveStatus !== 'idle' && (
                        <div className={cn(
                            "p-3 rounded-lg flex items-center gap-2 text-xs font-medium animate-in slide-in-from-bottom-2",
                            saveStatus === 'success' ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"
                        )}>
                            {saveStatus === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                            {saveMessage}
                        </div>
                    )}
                    <Button
                        onClick={handleSaveAgent}
                        disabled={saving || !formData.agentName}
                        className={cn(
                            "w-full font-medium h-10 rounded-xl shadow-lg transition-all",
                            saveStatus === 'success' ? "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200 text-white" : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200"
                        )}
                    >
                        {saving ? (
                            <Activity size={16} className="animate-spin mr-2" />
                        ) : saveStatus === 'success' ? (
                            <CheckCircle2 size={16} className="mr-2" />
                        ) : (
                            <CheckCircle2 size={16} className="mr-2" />
                        )}
                        {saving ? 'Salvando...' : saveStatus === 'success' ? 'Salvo!' : formData.agentId ? 'Salvar Alterações' : 'Salvar Novo Agente'}
                    </Button>
                </div>
            )}
        </div>
    );
}

// === SUB COMPONENTS ===

function AgentMissionSettings({ formData, onChange }: { formData: any; onChange: (k: string, v: any) => void }) {
    const goals = [
        { id: 'QUALIFY_LEAD', label: 'Qualificar', icon: Target },
        { id: 'CLOSE_SALE', label: 'Vender', icon: Briefcase },
        { id: 'SCHEDULE_MEETING', label: 'Agendar', icon: Clock },
        { id: 'SUPPORT_TICKET', label: 'Suporte', icon: LifeBuoy },
        { id: 'PROVIDE_INFO', label: 'Info', icon: MessageSquare },
    ];

    // Slot Logic
    const [slotInput, setSlotInput] = useState('');
    const [slotType, setSlotType] = useState('string');
    const [slotOptions, setSlotOptions] = useState('');

    // Helper to normalize legacy string array into typed object array [{name, type, options}]
    const currentSlots = useMemo(() => {
        if (!Array.isArray(formData.criticalSlots)) return [];
        return formData.criticalSlots.map((s: any) => {
            if (typeof s === 'string') return { name: s, type: 'string' };
            return s;
        });
    }, [formData.criticalSlots]);

    const addSlot = () => {
        if (!slotInput.trim()) return;
        const normalizedName = slotInput.trim().toLowerCase().replace(/\s+/g, '_');

        // Validation for enum type
        if (slotType === 'enum') {
            const opts = slotOptions.split(',').map(o => o.trim()).filter(Boolean);
            if (opts.length === 0) {
                // Prevent saving enum without options (fool-proof)
                alert("Por favor, informe as opções permitidas separadas por vírgula para o tipo Lista.");
                return;
            }
        }

        // Check if slot name already exists
        if (currentSlots.some((s: any) => s.name === normalizedName)) {
            alert("Um slot com este nome já existe.");
            return;
        }

        const newSlot: any = { name: normalizedName, type: slotType };
        if (slotType === 'enum') {
            newSlot.options = slotOptions.split(',').map(o => o.trim()).filter(Boolean);
        }

        onChange('criticalSlots', [...currentSlots, newSlot]);

        // Reset form
        setSlotInput('');
        setSlotType('string');
        setSlotOptions('');
    };

    const removeSlot = (slotNameToRemove: string) => {
        onChange('criticalSlots', currentSlots.filter((s: any) => s.name !== slotNameToRemove));
    };

    const typeLabels: Record<string, string> = {
        'string': 'Texto Livre',
        'number': 'Número',
        'boolean': 'Sim/Não',
        'enum': 'Lista Fechada'
    };

    return (
        <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Main Goal */}
            <div className="space-y-2">
                <Label className="text-xs font-semibold">Objetivo Principal</Label>
                <div className="grid grid-cols-3 gap-2">
                    {goals.map((type) => {
                        const Icon = type.icon;
                        const isSelected = (formData.goal || 'PROVIDE_INFO') === type.id;
                        return (
                            <button
                                key={type.id}
                                onClick={() => onChange('goal', type.id)}
                                className={cn(
                                    "flex flex-col items-center justify-center p-2 rounded-xl border transition-all h-16 gap-1",
                                    isSelected
                                        ? "bg-emerald-50 border-emerald-500 text-emerald-800"
                                        : "bg-white border-gray-100 text-gray-400 hover:bg-gray-50"
                                )}
                            >
                                <Icon size={16} className={isSelected ? "text-emerald-600" : "text-gray-400"} />
                                <span className="text-[10px] font-medium leading-none">{type.label}</span>
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* CRITICAL SLOTS (Typed) */}
            <div className={cn("p-4 rounded-xl border space-y-4", "bg-emerald-50/50 border-emerald-200")}>
                <div className="flex items-start justify-between">
                    <div>
                        <Label className="text-sm font-bold text-emerald-950">Dados a Coletar (Slots)</Label>
                        <p className="text-[11px] text-emerald-700 mt-1 max-w-[90%] leading-snug">
                            Defina formatos restritos (números, listas) para garantir que a IA extraia com exatidão e **não quebre seus blocos de Lógica (If/Else)**.
                        </p>
                    </div>
                </div>

                {/* Form to add new slot */}
                <div className="bg-white border border-emerald-100/80 shadow-sm rounded-xl p-3 space-y-3">
                    <div className="grid grid-cols-[2fr_1fr] gap-2">
                        <div className="space-y-1">
                            <Label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Nome do Dado</Label>
                            <Input
                                placeholder="ex: modelo_carro"
                                value={slotInput}
                                onChange={(e) => setSlotInput(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
                                className="h-8 text-xs bg-gray-50/50 border-gray-200"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Tipo (Formato)</Label>
                            <Select value={slotType} onValueChange={setSlotType}>
                                <SelectTrigger className="h-8 text-xs bg-gray-50/50 border-gray-200 shadow-none">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="string" className="text-xs">
                                        <div className="flex flex-col"><span className="font-semibold text-gray-900">Texto</span><span className="text-[9px] text-gray-500">Qualquer frase</span></div>
                                    </SelectItem>
                                    <SelectItem value="number" className="text-xs">
                                        <div className="flex flex-col"><span className="font-semibold text-gray-900">Número</span><span className="text-[9px] text-gray-500">Força matemática (ex: 500)</span></div>
                                    </SelectItem>
                                    <SelectItem value="boolean" className="text-xs">
                                        <div className="flex flex-col"><span className="font-semibold text-gray-900">Sim/Não</span><span className="text-[9px] text-gray-500">Respostas booleanas</span></div>
                                    </SelectItem>
                                    <SelectItem value="enum" className="text-xs">
                                        <div className="flex flex-col"><span className="font-semibold text-emerald-700">Lista (Recomendado)</span><span className="text-[9px] text-gray-500">Restringe a opções fixas</span></div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {slotType === 'enum' && (
                        <div className="space-y-1 animate-in slide-in-from-top-1 fade-in">
                            <Label className="text-[10px] uppercase font-bold text-indigo-500 tracking-wider flex items-center gap-1">
                                <AlertCircle size={10} /> Opções Permitidas (Separe por vírgula)
                            </Label>
                            <Input
                                placeholder="ex: suv, hatch, sedan"
                                value={slotOptions}
                                onChange={(e) => setSlotOptions(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSlot(); } }}
                                className="h-8 text-xs bg-indigo-50/30 border-indigo-200 focus-visible:ring-indigo-500/20"
                            />
                        </div>
                    )}

                    <Button
                        onClick={addSlot}
                        disabled={!slotInput.trim() || (slotType === 'enum' && !slotOptions.trim())}
                        className="w-full h-8 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm mt-1"
                    >
                        <Plus size={14} className="mr-1" /> Adicionar Filtro Rigoroso
                    </Button>
                </div>

                {/* List of existing slots */}
                {currentSlots.length > 0 && (
                    <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider ml-1">Ativos neste nó</Label>
                        <div className="space-y-1.5">
                            {currentSlots.map((slot: any) => (
                                <div key={slot.name} className="flex flex-col bg-white border border-emerald-100 rounded-lg p-2 shadow-sm group">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono text-xs font-semibold text-emerald-950 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                                                {slot.name}
                                            </span>
                                            <Badge variant="outline" className="text-[9px] h-4 px-1.5 font-normal bg-gray-50text-gray-600 border-gray-200">
                                                {typeLabels[slot.type] || 'Texto'}
                                            </Badge>
                                        </div>
                                        <button onClick={() => removeSlot(slot.name)} className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-0.5">
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                    {slot.type === 'enum' && slot.options && (
                                        <div className="mt-1.5 flex flex-wrap gap-1">
                                            {slot.options.map((opt: string) => (
                                                <span key={opt} className="text-[9px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-100">
                                                    {opt}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Suggestions */}
                {currentSlots.length === 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                        {['email', 'telefone', 'nome'].map(s => (
                            <button key={s} onClick={() => { onChange('criticalSlots', [...currentSlots, { name: s, type: 'string' }]) }}
                                className="text-[10px] px-2 py-1 bg-white border border-emerald-100 rounded-md text-emerald-700 shadow-sm hover:bg-emerald-50 transition-colors font-medium">
                                + Add {s}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Allowed CTAs */}
            <div className="space-y-3">
                <Label className="text-xs font-semibold">Ações Permitidas (CTAs)</Label>
                <div className="grid grid-cols-1 gap-2">
                    {[
                        { id: 'SCHEDULE_CALL', label: 'Agendar Reunião', icon: Clock },
                        { id: 'REQUEST_HANDOFF', label: 'Transbordo Humano', icon: Users },
                        { id: 'SEND_PROPOSAL', label: 'Enviar Proposta', icon: MessageSquare }
                    ].map(cta => {
                        const Icon = cta.icon;
                        const isActive = (formData.allowed_ctas || []).includes(cta.id);
                        return (
                            <div key={cta.id} className="flex items-center justify-between p-2 rounded-lg border bg-gray-50/50">
                                <div className="flex items-center gap-2">
                                    <Icon size={12} className="text-gray-600" />
                                    <span className="text-xs font-medium text-gray-700">{cta.label}</span>
                                </div>
                                <Switch
                                    checked={isActive}
                                    onCheckedChange={(checked) => {
                                        const current = formData.allowed_ctas || [];
                                        const next = checked
                                            ? [...current, cta.id]
                                            : current.filter((id: string) => id !== cta.id);
                                        onChange('allowed_ctas', next);
                                    }}
                                    className="scale-75"
                                />
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    );
}

// === NEW SUB COMPONENTS for NODE CONTEXT and VOICE MODE ===

function NodeContextSettings({ formData, onChange }: { formData: any; onChange: (k: string, v: any) => void }) {
    return (
        <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="space-y-3 p-3 rounded-xl border bg-purple-50/50 border-purple-100">
                <div className="flex items-center justify-between">
                    <div>
                        <Label className="text-xs font-semibold text-purple-900">Regras e Contexto</Label>
                        <p className="text-[10px] text-purple-600 mt-0.5">
                            Este prompt e setor valem <b>apenas</b> para este nó.
                        </p>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label className="text-[10px] text-purple-700">Setor (Vertical)</Label>
                    <Select
                        value={formData.industry_vertical || formData.dna?.business_context?.industry || 'GENERIC'}
                        onValueChange={(v) => onChange('industry_vertical', v)}
                    >
                        <SelectTrigger className="h-8 text-[11px] bg-white border-purple-200 focus:ring-purple-500/20">
                            <SelectValue placeholder="Selecione o setor..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ADVOCACIA">Advocacia</SelectItem>
                            <SelectItem value="SAAS">Tecnologia / SaaS</SelectItem>
                            <SelectItem value="IMOBILIARIA">Imobiliária</SelectItem>
                            <SelectItem value="CLINICA">Saúde / Clínica</SelectItem>
                            <SelectItem value="ECOMMERCE">E-commerce</SelectItem>
                            <SelectItem value="GENERIC">Outro / Genérico</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label className="text-[10px] text-purple-700">Prompt / Playbook deste nó</Label>
                    </div>
                    <Textarea
                        value={formData.systemPrompt || ''}
                        onChange={e => onChange('systemPrompt', e.target.value)}
                        placeholder="O que o agente deve focar em falar nesta etapa específica..."
                        className="text-[11px] bg-white border-purple-200 min-h-[150px] resize-none focus:ring-purple-500/20"
                    />
                </div>
            </div>
        </div>
    );
}

function NodeVoiceSettings({ formData, onChange }: { formData: any; onChange: (k: string, v: any) => void }) {
    const activeMode = formData.response_mode || 'inherit';

    const modes = [
        { id: 'inherit', label: 'Seguir DNA', desc: 'Usa a config global do agente' },
        { id: 'hybrid', label: 'Híbrido', desc: 'Sua voz com cliente áudio' },
        { id: 'text_only', label: 'Somente Texto', desc: 'Sempre texto' },
        { id: 'voice_only', label: 'Somente Áudio', desc: 'Sempre áudio' },
    ];

    return (
        <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="space-y-3 p-3 rounded-xl border bg-blue-50/50 border-blue-100">
                <div className="flex items-center justify-between">
                    <div>
                        <Label className="text-xs font-semibold text-blue-900">Modo de Resposta</Label>
                        <p className="text-[10px] text-blue-600 mt-0.5">
                            Como o agente responde nesta etapa?
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-2 pt-2">
                    {modes.map(mode => {
                        const isActive = activeMode === mode.id;

                        return (
                            <button
                                key={mode.id}
                                onClick={() => onChange('response_mode', mode.id)}
                                className={cn(
                                    "flex items-center justify-between p-3 rounded-lg border text-left transition-all",
                                    isActive
                                        ? "bg-white border-blue-400 shadow-sm ring-1 ring-blue-400"
                                        : "bg-white/50 border-blue-100 hover:bg-white hover:border-blue-300"
                                )}
                            >
                                <div>
                                    <div className={cn("text-xs font-semibold", isActive ? "text-blue-900" : "text-gray-700")}>
                                        {mode.label}
                                    </div>
                                    <div className="text-[10px] text-gray-500 mt-0.5">
                                        {mode.desc}
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

// ----------------------------------------------------------------------------
// NODE TOOLS SETTINGS
// ----------------------------------------------------------------------------
export function NodeToolsSettings({ formData, onChange }: { formData: any, onChange: (key: string, value: any) => void }) {
    const currentTools = Array.isArray(formData.tools) ? formData.tools : [];

    const addTool = () => {
        const newTool = {
            id: Math.random().toString(36).substr(2, 9),
            name: 'nova_ferramenta_' + Math.floor(Math.random() * 100),
            description: '',
            url: '',
            method: 'POST'
        };
        onChange('tools', [...currentTools, newTool]);
    };

    const removeTool = (id: string) => {
        onChange('tools', currentTools.filter((t: any) => t.id !== id));
    };

    const updateTool = (id: string, field: string, value: any) => {
        onChange('tools', currentTools.map((t: any) => t.id === id ? { ...t, [field]: value } : t));
    };

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex items-center justify-between p-3 rounded-xl border bg-amber-50/50 border-amber-100">
                <div>
                    <Label className="text-xs font-semibold text-amber-900">Ferramentas (Tool Calling)</Label>
                    <p className="text-[10px] text-amber-700 mt-0.5 leading-tight">
                        Dê poderes à IA para buscar ou enviar dados para outros sistemas no meio da conversa.
                    </p>
                </div>
                <Button variant="outline" size="sm" onClick={addTool} className="h-7 text-[10px] px-2 bg-white flex items-center gap-1 text-amber-700 border-amber-200 hover:bg-amber-100 hover:text-amber-800">
                    <Plus size={12} />
                    Adicionar
                </Button>
            </div>

            {currentTools.length === 0 ? (
                <div className="text-center p-6 rounded-xl border border-dashed bg-gray-50/50 flex flex-col items-center gap-2">
                    <Wrench size={20} className="text-gray-300" />
                    <p className="text-[10px] text-gray-500 max-w-[200px]">Nenhuma ferramenta conectada. O agente funcionará apenas com conversação let.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {currentTools.map((tool: any) => (
                        <div key={tool.id} className="p-3 rounded-xl border bg-white shadow-sm space-y-3 relative group">
                            <button onClick={() => removeTool(tool.id)} className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors opacity-0 group-hover:opacity-100 flex items-center justify-center">
                                <Trash2 size={12} />
                            </button>

                            <div className="grid grid-cols-[2fr_1fr] gap-2 pr-6">
                                <div className="space-y-1">
                                    <Label className="text-[10px] font-medium text-gray-700">Nome (Tool Name)</Label>
                                    <Input
                                        value={tool.name}
                                        onChange={e => updateTool(tool.id, 'name', e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
                                        className="h-7 text-[10px] font-mono bg-amber-50/30 border-amber-100 focus-visible:ring-amber-500/20"
                                        placeholder="ex: gerar_link_stripe"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[10px] font-medium text-gray-700">Método</Label>
                                    <Select value={tool.method || 'POST'} onValueChange={(v) => updateTool(tool.id, 'method', v)}>
                                        <SelectTrigger className="h-7 text-[10px] font-mono bg-gray-50">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="POST" className="text-[10px] font-mono">POST</SelectItem>
                                            <SelectItem value="GET" className="text-[10px] font-mono">GET</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <Label className="text-[10px] font-medium text-gray-700">Descrição (Instrução para a IA)</Label>
                                <Textarea
                                    value={tool.description}
                                    onChange={e => updateTool(tool.id, 'description', e.target.value)}
                                    className="min-h-[50px] text-[10px] resize-none border-gray-200 focus-visible:ring-amber-500/20"
                                    placeholder="Ex: Use quando o cliente confirmar interesse com os dados preenchidos. Sempre requisite 'email' e 'produto_id'."
                                />
                            </div>

                            <div className="space-y-1">
                                <Label className="text-[10px] font-medium text-gray-700">URL do Webhook (Destino API)</Label>
                                <div className="flex items-center gap-2">
                                    <div className="p-1 px-2 border rounded-md bg-gray-50 text-[10px] text-gray-400 font-mono">http</div>
                                    <Input
                                        value={tool.url}
                                        onChange={e => updateTool(tool.id, 'url', e.target.value)}
                                        className="h-7 text-[10px] font-mono border-gray-200 flex-1 bg-white"
                                        placeholder="hook.us1.make.com/..."
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
