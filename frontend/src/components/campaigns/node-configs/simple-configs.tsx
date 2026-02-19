'use client'

import React, { useCallback } from 'react';
import { Clock, Split, GitBranch, CornerUpRight, ExternalLink, Users, Flag, CheckCircle2, XCircle, Archive, AlertTriangle, Key, Tag as TagIcon, RefreshCcw, Webhook as WebhookIcon, MessageSquare, ArrowRight, Plus, Trash2, Zap } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/forms/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/forms/radio-group';
import { cn } from '@/lib/utils';

// ============= DELAY CONFIG =============
export function DelayConfig({ formData, onChange }: { formData: any; onChange: (k: string, v: any) => void }) {
    return (
        <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-amber-50/50 border border-amber-100/50 flex flex-col items-center justify-center space-y-4">
                <Clock className="w-8 h-8 text-amber-500/80" />
                <div className="flex items-end gap-3 w-full justify-center">
                    <div className="space-y-1">
                        <Input type="number" min="0" value={formData.delayValue || formData.duration || 0}
                            onChange={(e) => onChange('delayValue', e.target.value)}
                            className="w-24 text-center text-3xl font-bold h-16 rounded-xl border-amber-200/50 bg-white/80 focus:ring-amber-500/20 text-gray-900" />
                        <p className="text-[10px] text-center text-amber-600/70 font-medium tracking-wide">QUANTIDADE</p>
                    </div>
                    <div className="space-y-1">
                        <Select value={formData.delayUnit || formData.unit || 'm'} onValueChange={(v) => onChange('delayUnit', v)}>
                            <SelectTrigger className="w-28 h-16 rounded-xl border-amber-200/50 bg-white/80 focus:ring-amber-500 text-lg font-medium justify-center"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="s">Segundos</SelectItem>
                                <SelectItem value="m">Minutos</SelectItem>
                                <SelectItem value="h">Horas</SelectItem>
                                <SelectItem value="d">Dias</SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-[10px] text-center text-amber-600/70 font-medium tracking-wide">UNIDADE</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ============= SPLIT CONFIG =============
export function SplitConfig({ formData, onChange }: { formData: any; onChange: (k: string, v: any) => void }) {
    return (
        <div className="space-y-8 pt-4">
            <div className="p-4 rounded-xl bg-pink-50 border border-pink-100 flex items-center gap-3">
                <Split className="w-5 h-5 text-pink-600" />
                <div>
                    <h4 className="text-sm font-semibold text-pink-900">Teste A/B</h4>
                    <p className="text-[11px] text-pink-700">Distribui o tráfego entre dois caminhos.</p>
                </div>
            </div>

            <div className="space-y-6 px-2">
                <div className="flex justify-between items-center">
                    <div className="flex flex-col items-center">
                        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 mb-1">Caminho A</span>
                        <span className="text-lg font-bold text-gray-700">{formData.variantA_percent ?? 50}%</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <span className="text-xs font-bold text-pink-600 bg-pink-50 px-3 py-1.5 rounded-lg border border-pink-100 mb-1">Caminho B</span>
                        <span className="text-lg font-bold text-gray-700">{100 - (formData.variantA_percent ?? 50)}%</span>
                    </div>
                </div>

                <Slider defaultValue={[formData.variantA_percent ?? 50]} max={100} step={5}
                    onValueChange={(vals) => onChange('variantA_percent', vals[0])} className="py-2" />

                <p className="text-[10px] text-center text-gray-400">Arraste para ajustar a proporção</p>
            </div>
        </div>
    );
}

// ============= ACTION CONFIG =============
export function ActionConfig({ formData, onChange }: { formData: any; onChange: (k: string, v: any) => void }) {
    const actionTypes = [
        { id: 'message', label: 'Mensagem', icon: MessageSquare, color: 'text-blue-600 bg-blue-50 border-blue-200' },
        { id: 'update_tag', label: 'Adicionar Tag', icon: TagIcon, color: 'text-purple-600 bg-purple-50 border-purple-200' },
        { id: 'remove_tag', label: 'Remover Tag', icon: TagIcon, color: 'text-pink-600 bg-pink-50 border-pink-200' },
        { id: 'update_status', label: 'Status', icon: RefreshCcw, color: 'text-green-600 bg-green-50 border-green-200' },
        { id: 'set_variable', label: 'Set Variável', icon: Key, color: 'text-orange-600 bg-orange-50 border-orange-200' },
        { id: 'webhook', label: 'Webhook', icon: WebhookIcon, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
    ];

    const currentType = actionTypes.find(t => t.id === (formData.actionType || 'message')) || actionTypes[0];

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-3 gap-2">
                {actionTypes.map((type) => {
                    const Icon = type.icon;
                    const isSelected = (formData.actionType || 'message') === type.id;
                    return (
                        <button
                            key={type.id}
                            onClick={() => onChange('actionType', type.id)}
                            className={cn(
                                "flex flex-col items-center justify-center p-3 rounded-xl border transition-all h-20 gap-2",
                                isSelected
                                    ? `border-2 shadow-sm ${type.color.replace('border-', 'border-opacity-100 border-')}`
                                    : "bg-white border-gray-100 text-gray-400 hover:bg-gray-50 hover:border-gray-200"
                            )}
                        >
                            <Icon className={cn("w-5 h-5", isSelected ? "opacity-100" : "opacity-60")} />
                            <span className="text-[10px] font-medium leading-none text-center">{type.label}</span>
                        </button>
                    );
                })}
            </div>

            <div className={cn("p-4 rounded-xl border space-y-4 animate-in fade-in slide-in-from-top-2 duration-300", currentType.color.replace('text-', 'bg-opacity-20 '))} style={{ backgroundColor: 'var(--tw-bg-opacity)' }}>

                {(formData.actionType === 'message' || !formData.actionType) && (
                    <div className="space-y-3">
                        <Label className="text-xs text-gray-500 pl-1">Conteúdo da Mensagem</Label>
                        <Textarea rows={4} value={formData.messageTemplate || formData.messageContent || ''}
                            onChange={(e) => onChange('messageTemplate', e.target.value)}
                            placeholder="Olá {{name}}, tudo bem?"
                            className="bg-white/80 border-0 shadow-sm text-sm resize-none rounded-xl focus-visible:ring-1 focus-visible:ring-blue-400" />
                        <div className="flex items-center justify-between">
                            <p className="text-[10px] text-gray-500">Use {"{{name}}"} para variáveis</p>
                            <div className="flex items-center gap-2">
                                <Switch id="spintax" checked={formData.spintaxEnabled || false}
                                    onCheckedChange={(c) => onChange('spintaxEnabled', c)} />
                                <Label htmlFor="spintax" className="text-xs text-gray-500">Spintax</Label>
                            </div>
                        </div>
                    </div>
                )}

                {formData.actionType?.includes('tag') && (
                    <div className="space-y-2">
                        <Label className="text-xs text-gray-500 pl-1">Nome da Tag</Label>
                        <Input value={formData.tagPayload || ''} onChange={(e) => onChange('tagPayload', e.target.value)}
                            placeholder="ex: 'VIP', 'Interessado'" className="h-10 bg-white/80 border-0 shadow-sm rounded-lg" />
                    </div>
                )}

                {formData.actionType === 'update_status' && (
                    <div className="space-y-2">
                        <Label className="text-xs text-gray-500 pl-1">Novo Status</Label>
                        <Select value={formData.statusPayload || ''} onValueChange={(v) => onChange('statusPayload', v)}>
                            <SelectTrigger className="h-10 bg-white/80 border-0 shadow-sm rounded-lg"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="new">Novo</SelectItem>
                                <SelectItem value="contacted">Contatado</SelectItem>
                                <SelectItem value="qualified">Qualificado</SelectItem>
                                <SelectItem value="proposal">Proposta</SelectItem>
                                <SelectItem value="won">Ganho</SelectItem>
                                <SelectItem value="lost">Perdido</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                )}

                {formData.actionType === 'set_variable' && (
                    <div className="space-y-3">
                        <div className="space-y-2">
                            <Label className="text-xs text-gray-500 pl-1">Nome da Variável</Label>
                            <Input value={formData.variableName || ''} onChange={(e) => onChange('variableName', e.target.value)}
                                placeholder="ex: product_interest" className="h-10 bg-white/80 border-0 shadow-sm rounded-lg font-mono text-xs" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs text-gray-500 pl-1">Valor</Label>
                            <Input value={formData.variableValue || ''} onChange={(e) => onChange('variableValue', e.target.value)}
                                placeholder="ex: 'premium'" className="h-10 bg-white/80 border-0 shadow-sm rounded-lg" />
                        </div>
                    </div>
                )}

                {formData.actionType === 'webhook' && (
                    <div className="space-y-2">
                        <Label className="text-xs text-gray-500 pl-1">URL do Webhook</Label>
                        <Input value={formData.webhookUrl || ''} onChange={(e) => onChange('webhookUrl', e.target.value)}
                            placeholder="https://api.exemplo.com/webhook" className="h-10 bg-white/80 border-0 shadow-sm rounded-lg font-mono text-xs" />
                        <p className="text-[10px] text-gray-500">POST com payload JSON do lead</p>
                    </div>
                )}
            </div>
        </div>
    );
}

// ============= LOGIC CONFIG =============

// Preset templates for friendly UX
const CONDITION_PRESETS = [
    {
        id: 'source',
        label: 'Origem do lead',
        description: 'De onde o lead veio',
        variable: 'source',
        operator: '==',
        options: [
            { value: 'inbound', label: 'Inbound (mandou mensagem)' },
            { value: 'ad_click', label: 'Anúncio (Meta Ads)' },
            { value: 'imported', label: 'Importado (CSV/planilha)' },
            { value: 'linkedin', label: 'LinkedIn' },
            { value: 'maps', label: 'Google Maps' },
            { value: 'web', label: 'Web scraping' },
            { value: 'facebook_ads', label: 'Facebook Ads (webhook)' },
            { value: 'handoff', label: 'Transferência interna' },
        ]
    },
    {
        id: 'status',
        label: 'Status do lead',
        description: 'Situação atual do lead',
        variable: 'status',
        operator: '==',
        options: [
            { value: 'new', label: 'Novo' },
            { value: 'contacted', label: 'Contactado' },
            { value: 'qualified', label: 'Qualificado' },
            { value: 'unqualified', label: 'Desqualificado' },
            { value: 'converted', label: 'Convertido' },
        ]
    },
    {
        id: 'custom_slot',
        label: 'Slot de qualificação',
        description: 'Dado coletado pela IA (campo personalizado)',
        variable: '', // user types
        operator: '==',
        options: null, // user types
    },
    {
        id: 'sentiment',
        label: 'Sentimento do Lead',
        description: 'Análise de emoção (0 a 1)',
        variable: 'last_sentiment',
        operator: '>=',
        options: null,
    },
    {
        id: 'score',
        label: 'Lead Score',
        description: 'Pontuação de engajamento (0 a 100)',
        variable: 'score',
        operator: '>=',
        options: null,
    }
];

export function LogicConfig({ formData, onChange }: { formData: any; onChange: (k: string, v: any) => void }) {
    const conditions: Array<{ variable: string; operator: string; value: string; presetId?: string }> = formData.conditions || [];

    const updateConditions = useCallback((next: typeof conditions) => {
        onChange('conditions', next);
    }, [onChange]);

    const addFromPreset = (preset: typeof CONDITION_PRESETS[0]) => {
        const defaultValue = preset.options ? preset.options[0].value : '';
        updateConditions([...conditions, {
            variable: preset.variable,
            operator: preset.operator,
            value: defaultValue,
            presetId: preset.id,
        }]);
    };

    const removeCondition = (idx: number) => {
        updateConditions(conditions.filter((_, i) => i !== idx));
    };

    const updateConditionValue = (idx: number, value: string) => {
        updateConditions(conditions.map((c, i) => i === idx ? { ...c, value } : c));
    };

    const updateConditionVariable = (idx: number, variable: string) => {
        updateConditions(conditions.map((c, i) => i === idx ? { ...c, variable } : c));
    };

    // Find the preset config for a condition
    const getPreset = (cond: typeof conditions[0]) =>
        CONDITION_PRESETS.find(p => p.id === cond.presetId) || null;

    // Get friendly label for a condition's current value
    const getFriendlyLabel = (cond: typeof conditions[0]) => {
        const preset = getPreset(cond);
        if (!preset?.options) return cond.value || '?';
        const opt = preset.options.find(o => o.value === cond.value);
        return opt?.label || cond.value;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-slate-50 to-blue-50/30 border border-slate-200 space-y-3">
                <div className="flex items-center gap-2">
                    <GitBranch className="w-4 h-4 text-slate-600" />
                    <Label className="text-sm font-semibold text-slate-900">Condição IF/ELSE</Label>
                </div>
                <p className="text-[11px] text-gray-500 leading-tight">
                    Separe leads automaticamente. Ex: <strong>se veio do Inbound</strong> → atende de um jeito,
                    <strong> se veio de Anúncio</strong> → atende de outro.
                </p>
            </div>

            {/* Existing Conditions */}
            {conditions.length > 0 && (
                <div className="space-y-3">
                    {conditions.map((cond, idx) => {
                        const preset = getPreset(cond);
                        const isCustom = cond.presetId === 'custom_slot';

                        return (
                            <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-white space-y-3 relative group animate-in fade-in slide-in-from-top-1 duration-200 shadow-sm">
                                {/* Condition Header */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                                            Saída {idx + 1}
                                        </span>
                                        <span className="text-xs font-semibold text-slate-700">
                                            {preset?.label || '🧩 Condição'}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => removeCondition(idx)}
                                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 transition-all"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>

                                {/* Custom slot: variable input */}
                                {isCustom && (
                                    <div className="space-y-1">
                                        <Label className="text-[10px] text-gray-400">Nome do slot</Label>
                                        <Input
                                            value={cond.variable}
                                            onChange={(e) => updateConditionVariable(idx, e.target.value)}
                                            placeholder="ex: interesse, orcamento, cidade"
                                            className="h-9 text-xs bg-slate-50 border-slate-200 rounded-lg"
                                        />
                                    </div>
                                )}

                                {/* Value selector */}
                                <div className="space-y-1">
                                    <Label className="text-[10px] text-gray-400">
                                        {isCustom ? 'Valor esperado' : 'Se for igual a'}
                                    </Label>
                                    {preset?.options ? (
                                        <Select value={cond.value} onValueChange={(v) => updateConditionValue(idx, v)}>
                                            <SelectTrigger className="h-10 text-sm bg-slate-50 border-slate-200 rounded-lg">
                                                <SelectValue placeholder="Escolha..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {preset.options.map(opt => (
                                                    <SelectItem key={opt.value} value={opt.value}>
                                                        <span className="text-sm">{opt.label}</span>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    ) : (
                                        <Input
                                            value={cond.value}
                                            onChange={(e) => updateConditionValue(idx, e.target.value)}
                                            placeholder="ex: alto, sim, São Paulo"
                                            className="h-9 text-xs bg-slate-50 border-slate-200 rounded-lg"
                                        />
                                    )}
                                </div>

                                {/* Friendly preview */}
                                <div className="px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-100">
                                    <span className="text-xs text-emerald-700">
                                        SE <strong>{isCustom ? (cond.variable || '...') : (preset?.description || cond.variable)}</strong> for <strong>{getFriendlyLabel(cond)}</strong> → vai pra Saída {idx + 1}
                                    </span>
                                </div>
                            </div>
                        );
                    })}

                    {/* Default/Else path */}
                    <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-gray-50 border border-dashed border-gray-200">
                        <ArrowRight size={14} className="text-gray-300" />
                        <span className="text-xs text-gray-500">Saída {conditions.length + 1} — <strong>Senão</strong> (todos os outros leads)</span>
                    </div>
                </div>
            )}

            {/* Add Condition Buttons */}
            <div className="space-y-2">
                <Label className="text-xs text-gray-500 pl-1">
                    {conditions.length === 0 ? 'Escolha o que verificar' : '+ Adicionar outra condição'}
                </Label>
                <div className="grid grid-cols-1 gap-2">
                    {CONDITION_PRESETS.map(preset => (
                        <button
                            key={preset.id}
                            onClick={() => addFromPreset(preset)}
                            className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 bg-white hover:bg-blue-50 hover:border-blue-200 transition-all text-left group"
                        >
                            <span className="text-base">{preset.label.split(' ')[0]}</span>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-700 group-hover:text-blue-700">{preset.label.slice(3)}</p>
                                <p className="text-[10px] text-gray-400">{preset.description}</p>
                            </div>
                            <Plus size={16} className="text-gray-300 group-hover:text-blue-500" />
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ============= GOTO CONFIG =============
export function GotoConfig({ formData, onChange }: { formData: any; onChange: (k: string, v: any) => void }) {
    return (
        <div className="space-y-6">
            <div className="p-4 rounded-xl bg-cyan-50 border border-cyan-200 space-y-3">
                <div className="flex items-center gap-2">
                    <CornerUpRight className="w-4 h-4 text-cyan-600" />
                    <Label className="text-sm font-semibold text-cyan-900">Pular para Node</Label>
                </div>
                <p className="text-[11px] text-gray-500">Redireciona o fluxo para outro node dentro desta campanha.</p>
            </div>
            <div className="space-y-2">
                <Label className="text-xs text-gray-500 pl-1">ID do Node Destino</Label>
                <Input value={formData.targetNodeId || ''} onChange={(e) => onChange('targetNodeId', e.target.value)}
                    placeholder="ex: node_abc123" className="h-11 rounded-xl font-mono text-sm" />
                <p className="text-[10px] text-gray-400">Copie o ID do node alvo clicando nele no canvas</p>
            </div>
        </div>
    );
}

// ============= GOTO CAMPAIGN CONFIG =============
export function GotoCampaignConfig({ formData, onChange, campaigns }: { formData: any; onChange: (k: string, v: any) => void; campaigns: any[] }) {
    return (
        <div className="space-y-6">
            <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 space-y-3">
                <div className="flex items-center gap-2">
                    <ExternalLink className="w-4 h-4 text-indigo-600" />
                    <Label className="text-sm font-semibold text-indigo-900">Transferir para Campanha</Label>
                </div>
                <p className="text-[11px] text-gray-500">Move o lead para outra campanha (ex: Triagem → Vendas).</p>
            </div>
            <div className="space-y-2">
                <Label className="text-xs text-gray-500 pl-1">Campanha Destino</Label>
                <Select value={formData.target_campaign_id || ''} onValueChange={(v) => onChange('target_campaign_id', v)}>
                    <SelectTrigger className="h-11 rounded-xl bg-white/50 border-gray-200"><SelectValue placeholder="Selecione a campanha..." /></SelectTrigger>
                    <SelectContent className="max-h-64">
                        {campaigns.map(c => (<SelectItem key={c.id} value={c.id}><span className="font-medium">{c.name}</span><span className="block text-[10px] text-gray-400">{c.mode}</span></SelectItem>))}
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label className="text-xs text-gray-500 pl-1">Motivo (opcional)</Label>
                <Input value={formData.reason || ''} onChange={(e) => onChange('reason', e.target.value)}
                    placeholder="ex: qualificado_para_vendas" className="h-11 rounded-xl" />
            </div>
        </div>
    );
}

// ============= HANDOFF CONFIG =============
export function HandoffConfig({ formData, onChange, campaigns }: { formData: any; onChange: (k: string, v: any) => void; campaigns: any[] }) {
    const targets = [
        { id: 'human', label: 'Humano', icon: Users, desc: 'Para atendente', color: 'bg-rose-50 border-rose-200 text-rose-700' },
        { id: 'campaign', label: 'Campanha', icon: GitBranch, desc: 'Outro fluxo', color: 'bg-indigo-50 border-indigo-200 text-indigo-700' },
    ];

    return (
        <div className="space-y-6 pt-2">
            <div className="p-4 rounded-xl bg-orange-50 border border-orange-200 space-y-3">
                <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-orange-600" />
                    <Label className="text-sm font-semibold text-orange-900">Transbordo (Handoff)</Label>
                </div>
                <p className="text-[11px] text-orange-800/70">Transfere o atendimento quando a IA não pode resolver.</p>
            </div>

            <div className="space-y-3">
                <Label className="text-xs text-gray-500 pl-1">Destino</Label>
                <div className="grid grid-cols-2 gap-3">
                    {targets.map(t => {
                        const Icon = t.icon;
                        const isSelected = (formData.target || 'human') === t.id;
                        return (
                            <button
                                key={t.id}
                                onClick={() => onChange('target', t.id)}
                                className={cn(
                                    "flex items-center gap-3 p-3 rounded-xl border text-left transition-all",
                                    isSelected ? `border-2 ${t.color.replace('bg-', 'bg-opacity-50 ')} border-opacity-100` : "bg-white border-gray-100 hover:bg-gray-50"
                                )}
                            >
                                <div className={cn("p-2 rounded-lg", t.color)}><Icon size={16} /></div>
                                <div>
                                    <div className="text-xs font-bold text-gray-900">{t.label}</div>
                                    <div className="text-[10px] text-gray-500">{t.desc}</div>
                                </div>
                            </button>
                        )
                    })}
                </div>
            </div>

            {formData.target === 'campaign' && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
                    <Label className="text-xs text-gray-500 pl-1">Selecione a Campanha</Label>
                    <Select value={formData.targetCampaignId || ''} onValueChange={(v) => onChange('targetCampaignId', v)}>
                        <SelectTrigger className="h-11 rounded-xl bg-white border-gray-200"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                        <SelectContent>{campaigns.map(c => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}</SelectContent>
                    </Select>
                </div>
            )}

            <div className="space-y-2">
                <Label className="text-xs text-gray-500 pl-1">Motivo (Contexto)</Label>
                <Input value={formData.reason || ''} onChange={(e) => onChange('reason', e.target.value)}
                    placeholder="ex: Cliente pediu falar com humano" className="h-11 rounded-xl bg-white border-gray-200" />
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-100">
                <div className="space-y-0.5">
                    <Label className="text-sm font-medium text-gray-900">Gerar Resumo IA</Label>
                    <p className="text-[10px] text-gray-500">Envia resumo da conversa para o destino</p>
                </div>
                <Switch checked={formData.enableSummary || false} onCheckedChange={(c) => onChange('enableSummary', c)} />
            </div>
        </div>
    );
}

// ============= CLOSING CONFIG =============
export function ClosingConfig({ formData, onChange }: { formData: any; onChange: (k: string, v: any) => void }) {
    return (
        <div className="space-y-6">
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 space-y-3">
                <div className="flex items-center gap-2">
                    <Flag className="w-4 h-4 text-red-600" />
                    <Label className="text-sm font-semibold text-red-900">Fechamento</Label>
                </div>
                <p className="text-[11px] text-gray-500">Define o status final do lead e encerra o fluxo.</p>
            </div>
            <div className="space-y-3">
                <Label className="text-xs text-gray-500 pl-1">Status Final</Label>
                <div className="grid grid-cols-2 gap-2">
                    {[
                        { value: 'completed', label: 'Concluído', icon: CheckCircle2, color: 'bg-gray-100 text-gray-700 border-gray-300' },
                        { value: 'won', label: 'Ganho', icon: CheckCircle2, color: 'bg-green-100 text-green-700 border-green-300' },
                        { value: 'lost', label: 'Perdido', icon: XCircle, color: 'bg-red-100 text-red-700 border-red-300' },
                        { value: 'archived', label: 'Arquivado', icon: Archive, color: 'bg-slate-100 text-slate-700 border-slate-300' },
                    ].map(status => {
                        const Icon = status.icon;
                        const isSelected = formData.finalStatus === status.value;
                        return (
                            <button key={status.value} onClick={() => onChange('finalStatus', status.value)}
                                className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${isSelected
                                    ? `${status.color} ring-2 ring-offset-2 ring-gray-300`
                                    : 'bg-white border-gray-200 hover:border-gray-300'}`}>
                                <Icon className="w-4 h-4" />
                                <span className="text-sm font-medium">{status.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-100">
                <div>
                    <Label className="text-sm font-medium text-gray-900">Limpar Variáveis</Label>
                    <p className="text-[10px] text-gray-500">Remove dados temporários do lead</p>
                </div>
                <Switch checked={formData.clearVariables ?? true} onCheckedChange={(c) => onChange('clearVariables', c)} />
            </div>
        </div>
    );
}
