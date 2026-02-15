'use client'

import React, { useState, useEffect } from 'react';
import { Bot, Brain, Flag, Zap, Activity, Briefcase, Target, MessageSquare, Clock, Shield } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/forms/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { agentService, Agent, DNAConfig } from '@/services/agentService';
import { profileService } from '@/services/profileService';
import Link from 'next/link';

const DEFAULT_DNA: DNAConfig = {
    psychometrics: { openness: 0.7, conscientiousness: 0.8, extraversion: 0.6, agreeableness: 0.75, neuroticism: 0.2 },
    pad_baseline: { pleasure: 0.6, arousal: 0.5, dominance: 0.5 },
    linguistics: { formality: 0.5, emoji_frequency: 0.3, caps_usage: 0.1, intentional_typos: false, max_chars: 300 },
    chronemics: { base_latency_ms: 1500, burstiness: 0.4 },
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
            if (agent.dna_config) setDna({ ...DEFAULT_DNA, ...agent.dna_config });
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

    const updateDna = (section: string, key: string, value: any) => {
        setDna(prev => ({
            ...prev,
            [section]: { ...(prev as any)[section], [key]: value }
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const payload = { name: agentName, description: agentDesc, model, role, dna_config: dna };
            let result: Agent;
            if (selectedAgent?.id) {
                result = await agentService.update(selectedAgent.id, payload);
            } else {
                result = await agentService.create(payload as any);
            }
            onChange('agentId', result.id);
            setSelectedAgent(result);
            onAgentsChange();
            setShowDnaEditor(false);
        } catch (e) { console.error(e); }
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
                <div className="flex items-center justify-between">
                    <button onClick={() => setShowDnaEditor(false)} className="text-xs text-gray-500 hover:text-gray-900 flex items-center gap-1">
                        ← Voltar
                    </button>
                    <Button onClick={handleSave} disabled={saving || !agentName} size="sm"
                        className="bg-purple-600 hover:bg-purple-700 text-white">
                        {saving ? <Activity className="h-3 w-3 animate-spin mr-1" /> : null}
                        {selectedAgent ? 'Atualizar' : 'Criar'} Agente
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
                            { id: 'gemini-2.5-flash', name: '2.5 Flash', desc: '⚡ Padrão' },
                            { id: 'gemini-2.5-flash-lite', name: '2.5 Lite', desc: '💰 Econômico' },
                            { id: 'gemini-3.0-flash', name: '3.0 Flash', desc: '🧠 Avançado' }
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
                            { id: 'SDR', label: '🎯 SDR' },
                            { id: 'EXECUTIVE', label: '💰 Closer' },
                            { id: 'SUPPORT', label: '🎧 Suporte' },
                            { id: 'ONBOARDING', label: '🚀 Onboard' },
                            { id: 'CONSULTANT', label: '🧠 Consultor' },
                            { id: 'CONCIERGE', label: '🛎️ Triagem' },
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
                <Tabs defaultValue="business" className="w-full">
                    <TabsList className="w-full grid grid-cols-4 bg-gray-100 p-0.5 rounded-lg h-auto">
                        <TabsTrigger value="business" className="text-[10px] py-1.5 px-1">🏢 Negócio</TabsTrigger>
                        <TabsTrigger value="personality" className="text-[10px] py-1.5 px-1">🧠 Persona</TabsTrigger>
                        <TabsTrigger value="writing" className="text-[10px] py-1.5 px-1">💬 Escrita</TabsTrigger>
                        <TabsTrigger value="safety" className="text-[10px] py-1.5 px-1">🛡️ Limites</TabsTrigger>
                    </TabsList>

                    {/* Business Context */}
                    <TabsContent value="business" className="mt-4 space-y-4">
                        <BusinessTab dna={dna} updateDna={updateDna} apiKey={apiKey} setApiKey={setApiKey}
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
                    ➕ Criar Novo
                </Button>
                {formData.agentId && (
                    <>
                        <Button onClick={handleEditSelected} variant="outline" size="sm" className="flex-1 text-xs">
                            ✏️ Editar DNA
                        </Button>
                        <Button onClick={() => handleDelete(formData.agentId)} variant="outline" size="sm"
                            className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50">
                            🗑️
                        </Button>
                    </>
                )}
            </div>

            {/* Node-level configs: Goal, CTAs, Slots */}
            <AgentNodeSettings formData={formData} onChange={onChange} />
        </div>
    );
}

// ===== SUB-COMPONENTS =====

function AgentNodeSettings({ formData, onChange }: { formData: any; onChange: (k: string, v: any) => void }) {
    return (
        <>
            {/* Goal */}
            <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100 space-y-3">
                <div className="flex items-center gap-2">
                    <Brain className="w-4 h-4 text-blue-600" />
                    <Label className="text-sm font-semibold text-blue-900">Objetivo do Nó</Label>
                </div>
                <Select value={formData.goal || 'PROVIDE_INFO'} onValueChange={(v) => onChange('goal', v)}>
                    <SelectTrigger className="h-10 rounded-xl bg-white/80"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="QUALIFY_LEAD">🎯 Qualificar Lead</SelectItem>
                        <SelectItem value="CLOSE_SALE">💰 Fechar Venda</SelectItem>
                        <SelectItem value="SCHEDULE_MEETING">📅 Agendar Reunião</SelectItem>
                        <SelectItem value="HANDLE_OBJECTION">🛡️ Tratar Objeção</SelectItem>
                        <SelectItem value="PROVIDE_INFO">💬 Responder Dúvidas</SelectItem>
                        <SelectItem value="RECOVER_COLD">🔥 Recuperar Lead Frio</SelectItem>
                        <SelectItem value="ONBOARD_USER">🚀 Onboarding</SelectItem>
                        <SelectItem value="SUPPORT_TICKET">🎧 Suporte</SelectItem>
                        <SelectItem value="CUSTOM">⚙️ Personalizado</SelectItem>
                    </SelectContent>
                </Select>
                {formData.goal === 'CUSTOM' && (
                    <Textarea rows={2} value={formData.custom_objective || ''}
                        onChange={(e) => onChange('custom_objective', e.target.value)}
                        placeholder="Descreva o objetivo..." className="bg-white/80 text-sm rounded-xl" />
                )}
            </div>

            {/* Informações que a IA deve coletar */}
            <div className="p-4 rounded-xl bg-green-50/50 border border-green-100 space-y-3">
                <div>
                    <Label className="text-sm font-semibold text-green-900">📋 O que a IA deve coletar?</Label>
                    <p className="text-[10px] text-green-600 mt-0.5">Marque as informações que a IA deve extrair do lead antes de avançar</p>
                </div>
                <ToggleGroup type="multiple" variant="outline" value={formData.criticalSlots || []}
                    onValueChange={(val) => onChange('criticalSlots', val)} className="justify-start flex-wrap gap-1.5">
                    {[
                        { label: '👤 Nome', value: 'lead_name' },
                        { label: '📞 Telefone', value: 'contact_phone' },
                        { label: '📍 Cidade', value: 'location' },
                        { label: '📝 CPF', value: 'cpf' },
                        { label: '🚗 Veículo', value: 'vehicle_model' },
                        { label: '📅 Ano', value: 'vehicle_year' },
                        { label: '🔧 Serviço', value: 'service_type' },
                        { label: '💬 Problema', value: 'problem_description' },
                        { label: '💰 Orçamento', value: 'budget' },
                        { label: '💳 Pagamento', value: 'payment_method' },
                        { label: '⏰ Urgência', value: 'urgency' },
                        { label: '📆 Data', value: 'desired_date' },
                        { label: '🏢 Decisor', value: 'authority' },
                        { label: '🎯 Necessidade', value: 'need' },
                        { label: '⏳ Prazo', value: 'timeline' },
                    ].map(s => (
                        <ToggleGroupItem key={s.value} value={s.value}
                            className="h-8 px-3 text-xs data-[state=on]:bg-green-100 data-[state=on]:text-green-700 data-[state=on]:border-green-300">
                            {s.label}
                        </ToggleGroupItem>
                    ))}
                </ToggleGroup>
            </div>

            {/* CTAs */}
            <div className="space-y-2">
                <Label className="text-xs text-gray-500">Ações permitidas da IA</Label>
                <ToggleGroup type="multiple" variant="outline" value={formData.allowed_ctas || []}
                    onValueChange={(val) => onChange('allowed_ctas', val)} className="justify-start flex-wrap gap-2">
                    {[
                        { value: 'ASK_QUESTION', label: '❓ Pergunta' },
                        { value: 'PROPOSE_DEMO', label: '🎬 Demo' },
                        { value: 'SEND_PROPOSAL', label: '📄 Proposta' },
                        { value: 'SCHEDULE_CALL', label: '📞 Agendar' },
                        { value: 'CONFIRM_INTEREST', label: '✅ Confirmar' },
                        { value: 'REQUEST_HANDOFF', label: '🙋 Humano' },
                    ].map(c => (
                        <ToggleGroupItem key={c.value} value={c.value}
                            className="h-8 px-3 text-xs data-[state=on]:bg-blue-100 data-[state=on]:text-blue-700">{c.label}</ToggleGroupItem>
                    ))}
                </ToggleGroup>
            </div>
        </>
    );
}

function BusinessTab({ dna, updateDna, apiKey, setApiKey, hasKey, keyLoading, handleSaveKey }: any) {
    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label className="text-xs font-bold text-gray-700">Setor</Label>
                <div className="grid grid-cols-3 gap-1.5">
                    {[
                        { id: 'ADVOCACIA', label: '⚖️ Advocacia' },
                        { id: 'OFICINA_MECANICA', label: '🔧 Oficina' },
                        { id: 'ASSISTENCIA_TECNICA', label: '🔌 Assist. Técnica' },
                        { id: 'IMOBILIARIA', label: '🏠 Imobiliária' },
                        { id: 'CLINICA', label: '🏥 Clínica' },
                        { id: 'ECOMMERCE', label: '🛒 E-commerce' },
                        { id: 'SAAS', label: '💻 SaaS' },
                        { id: 'AGENCIA', label: '🎨 Agência' },
                        { id: 'CONSULTORIA', label: '📊 Consultoria' },
                        { id: 'ACADEMIA', label: '💪 Academia' },
                        { id: 'RESTAURANTE', label: '🍽️ Restaurante' },
                        { id: 'GENERIC', label: '⚪ Genérico' },
                    ].map(ind => (
                        <button key={ind.id} onClick={() => updateDna('business_context', 'industry', ind.id)}
                            className={`p-2 rounded-lg border text-[10px] font-medium transition-all ${dna.business_context?.industry === ind.id
                                ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 hover:border-indigo-300'}`}>
                            {ind.label}
                        </button>
                    ))}
                </div>
            </div>
            <div className="space-y-1">
                <Label className="text-xs text-gray-500">Nome da Empresa</Label>
                <Input value={dna.business_context?.company_name || ''} onChange={e => updateDna('business_context', 'company_name', e.target.value)}
                    className="h-9" placeholder="Ex: Escritório Silva & Associados" />
            </div>

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

            <div className="space-y-1">
                <Label className="text-xs text-gray-500">Contexto / Playbook</Label>
                <Textarea value={dna.business_context?.custom_context || ''} onChange={e => updateDna('business_context', 'custom_context', e.target.value)}
                    className="min-h-[100px] text-xs" placeholder="Informações específicas do negócio..." />
            </div>
        </div>
    );
}

function PersonalityTab({ dna, updateDna }: any) {
    const sliders = [
        { section: 'psychometrics', key: 'openness', label: '🎨 Abertura', left: 'Prático', right: 'Criativo' },
        { section: 'psychometrics', key: 'conscientiousness', label: '📋 Conscienciosidade', left: 'Flexível', right: 'Metódico' },
        { section: 'psychometrics', key: 'extraversion', label: '🗣️ Extroversão', left: 'Reservado', right: 'Expansivo' },
        { section: 'psychometrics', key: 'agreeableness', label: '🤝 Amabilidade', left: 'Direto', right: 'Acolhedor' },
        { section: 'psychometrics', key: 'neuroticism', label: '😰 Neuroticismo', left: 'Calmo', right: 'Reativo' },
        { section: 'pad_baseline', key: 'pleasure', label: '😊 Prazer', left: 'Neutro', right: 'Alegre' },
        { section: 'pad_baseline', key: 'arousal', label: '⚡ Energia', left: 'Calmo', right: 'Energético' },
        { section: 'pad_baseline', key: 'dominance', label: '👑 Dominância', left: 'Submisso', right: 'Assertivo' },
    ];

    return (
        <div className="space-y-3">
            {sliders.map(s => (
                <div key={s.key} className="space-y-1">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-medium text-gray-700">{s.label}</span>
                        <span className="text-[10px] text-gray-400">{Math.round(((dna as any)[s.section]?.[s.key] || 0.5) * 100)}%</span>
                    </div>
                    <Slider value={[((dna as any)[s.section]?.[s.key] || 0.5) * 100]} max={100} step={1}
                        onValueChange={(v) => updateDna(s.section, s.key, v[0] / 100)} className="py-1" />
                    <div className="flex justify-between text-[9px] text-gray-400">
                        <span>{s.left}</span><span>{s.right}</span>
                    </div>
                </div>
            ))}
        </div>
    );
}

function WritingTab({ dna, updateDna }: any) {
    return (
        <div className="space-y-4">
            {[
                { section: 'linguistics', key: 'formality', label: '📝 Formalidade', left: 'Informal', right: 'Formal' },
                { section: 'linguistics', key: 'emoji_frequency', label: '😀 Emojis', left: 'Nunca', right: 'Muito' },
                { section: 'linguistics', key: 'caps_usage', label: '🔠 CAPS', left: 'Nunca', right: 'Frequente' },
                { section: 'chronemics', key: 'base_latency_ms', label: '⏱️ Latência (ms)', left: '500ms', right: '5000ms', max: 5000, isMs: true },
                { section: 'chronemics', key: 'burstiness', label: '💥 Burstiness', left: 'Uma msg', right: 'Várias msgs' },
            ].map(s => (
                <div key={s.key} className="space-y-1">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-medium text-gray-700">{s.label}</span>
                        <span className="text-[10px] text-gray-400">
                            {s.isMs ? `${(dna as any)[s.section]?.[s.key] || 1500}ms` : `${Math.round(((dna as any)[s.section]?.[s.key] || 0.5) * 100)}%`}
                        </span>
                    </div>
                    <Slider
                        value={[s.isMs ? ((dna as any)[s.section]?.[s.key] || 1500) : ((dna as any)[s.section]?.[s.key] || 0.5) * 100]}
                        max={s.isMs ? (s.max || 5000) : 100} step={s.isMs ? 100 : 1}
                        onValueChange={(v) => updateDna(s.section, s.key, s.isMs ? v[0] : v[0] / 100)} className="py-1" />
                    <div className="flex justify-between text-[9px] text-gray-400">
                        <span>{s.left}</span><span>{s.right}</span>
                    </div>
                </div>
            ))}
            <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                <Label className="text-xs text-gray-700">Erros intencionais de digitação</Label>
                <Switch checked={dna.linguistics?.intentional_typos || false}
                    onCheckedChange={(c) => updateDna('linguistics', 'intentional_typos', c)} />
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
