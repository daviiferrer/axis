'use client'

import React from 'react';
import { Clock, Split, GitBranch, CornerUpRight, ExternalLink, Users, Flag, CheckCircle2, XCircle, Archive, AlertTriangle } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/forms/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/forms/radio-group';

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
        <div className="space-y-8">
            <div className="space-y-4">
                <div className="flex justify-between items-center px-1">
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">Caminho A: {formData.variantA_percent ?? 50}%</span>
                    <span className="text-xs font-bold text-pink-600 bg-pink-50 px-2 py-1 rounded">Caminho B: {100 - (formData.variantA_percent ?? 50)}%</span>
                </div>
                <Slider defaultValue={[formData.variantA_percent ?? 50]} max={100} step={1}
                    onValueChange={(vals) => onChange('variantA_percent', vals[0])} className="py-4" />
                <p className="text-xs text-center text-gray-400">Distribui o tráfego aleatoriamente por porcentagem</p>
            </div>
        </div>
    );
}

// ============= ACTION CONFIG =============
export function ActionConfig({ formData, onChange }: { formData: any; onChange: (k: string, v: any) => void }) {
    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <Label className="text-xs text-gray-500 pl-1">Tipo de Ação</Label>
                <Select value={formData.actionType || 'message'} onValueChange={(v) => onChange('actionType', v)}>
                    <SelectTrigger className="h-11 rounded-xl bg-white/50"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="message">Enviar Mensagem</SelectItem>
                        <SelectItem value="update_tag">Adicionar Tag</SelectItem>
                        <SelectItem value="remove_tag">Remover Tag</SelectItem>
                        <SelectItem value="update_status">Atualizar Status</SelectItem>
                        <SelectItem value="webhook">Chamar Webhook</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {(formData.actionType === 'message' || !formData.actionType) && (
                <div className="space-y-3 animate-in fade-in">
                    <Label className="text-xs text-gray-500 pl-1">Conteúdo da Mensagem</Label>
                    <Textarea rows={4} value={formData.messageTemplate || formData.messageContent || ''}
                        onChange={(e) => onChange('messageTemplate', e.target.value)}
                        placeholder="Olá {{name}}, tudo bem?"
                        className="bg-white/50 border-gray-200 text-sm resize-none rounded-xl" />
                    <div className="flex items-center justify-between">
                        <p className="text-[10px] text-gray-400">Use {"{{name}}"} e {"{{company}}"} para variáveis</p>
                        <div className="flex items-center gap-2">
                            <Switch id="spintax" checked={formData.spintaxEnabled || false}
                                onCheckedChange={(c) => onChange('spintaxEnabled', c)} />
                            <Label htmlFor="spintax" className="text-xs text-gray-500">Spintax</Label>
                        </div>
                    </div>
                </div>
            )}

            {formData.actionType?.includes('tag') && (
                <div className="space-y-2 animate-in fade-in">
                    <Label className="text-xs text-gray-500 pl-1">Nome da Tag</Label>
                    <Input value={formData.tagPayload || ''} onChange={(e) => onChange('tagPayload', e.target.value)}
                        placeholder="ex: 'Interessado', 'VIP'" className="h-11 rounded-xl" />
                </div>
            )}

            {formData.actionType === 'update_status' && (
                <div className="space-y-2 animate-in fade-in">
                    <Label className="text-xs text-gray-500 pl-1">Novo Status</Label>
                    <Select value={formData.statusPayload || ''} onValueChange={(v) => onChange('statusPayload', v)}>
                        <SelectTrigger className="h-11 rounded-xl bg-white/50"><SelectValue placeholder="Selecione..." /></SelectTrigger>
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

            {formData.actionType === 'webhook' && (
                <div className="space-y-2 animate-in fade-in">
                    <Label className="text-xs text-gray-500 pl-1">URL do Webhook</Label>
                    <Input value={formData.webhookUrl || ''} onChange={(e) => onChange('webhookUrl', e.target.value)}
                        placeholder="https://api.exemplo.com/webhook" className="h-11 rounded-xl font-mono text-sm" />
                    <p className="text-[10px] text-gray-400">POST request com dados do lead</p>
                </div>
            )}
        </div>
    );
}

// ============= LOGIC CONFIG =============
export function LogicConfig() {
    return (
        <div className="space-y-6">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
                <div className="flex items-center gap-2">
                    <GitBranch className="w-4 h-4 text-slate-600" />
                    <Label className="text-sm font-semibold text-slate-900">Roteador Inteligente</Label>
                </div>
                <p className="text-[11px] text-gray-500 leading-tight">
                    O LogicNode lê a intenção detectada pelo AgentNode anterior e roteia automaticamente.
                </p>
            </div>
            <div className="space-y-3">
                <Label className="text-xs text-gray-500 pl-1">Saídas Disponíveis</Label>
                <div className="space-y-2">
                    {[
                        { edge: 'interested', label: 'Interessado', color: 'bg-green-100 text-green-700 border-green-200' },
                        { edge: 'not_interested', label: 'Não Interessado', color: 'bg-red-100 text-red-700 border-red-200' },
                        { edge: 'question', label: 'Pergunta', color: 'bg-blue-100 text-blue-700 border-blue-200' },
                        { edge: 'handoff', label: 'Transbordo', color: 'bg-orange-100 text-orange-700 border-orange-200' },
                        { edge: 'default', label: 'Padrão (Else)', color: 'bg-gray-100 text-gray-700 border-gray-200' },
                    ].map(item => (
                        <div key={item.edge} className={`flex items-center justify-between px-3 py-2 rounded-lg border ${item.color}`}>
                            <span className="text-xs font-medium">{item.label}</span>
                            <span className="text-[10px] font-mono opacity-60">{item.edge}</span>
                        </div>
                    ))}
                </div>
                <p className="text-[10px] text-gray-400 text-center pt-2">Conecte cada saída ao node correspondente no canvas</p>
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
    return (
        <div className="space-y-6">
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 space-y-3">
                <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-rose-600" />
                    <Label className="text-sm font-semibold text-rose-900">Transbordo</Label>
                </div>
            </div>
            <div className="space-y-3">
                <Label className="text-xs text-gray-500 pl-1">Destino do Transbordo</Label>
                <RadioGroup value={formData.target || 'human'} onValueChange={(v) => onChange('target', v)} className="space-y-2">
                    <div className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                        <RadioGroupItem value="human" id="human" />
                        <Label htmlFor="human" className="flex-1 cursor-pointer">
                            <span className="font-medium text-sm">Humano</span>
                            <span className="block text-[10px] text-gray-400">Transferir para atendente</span>
                        </Label>
                    </div>
                    <div className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                        <RadioGroupItem value="campaign" id="campaign" />
                        <Label htmlFor="campaign" className="flex-1 cursor-pointer">
                            <span className="font-medium text-sm">Campanha</span>
                            <span className="block text-[10px] text-gray-400">Mover para outra campanha</span>
                        </Label>
                    </div>
                </RadioGroup>
            </div>
            {formData.target === 'campaign' && (
                <div className="space-y-2 animate-in fade-in">
                    <Label className="text-xs text-gray-500 pl-1">Campanha Destino</Label>
                    <Select value={formData.targetCampaignId || ''} onValueChange={(v) => onChange('targetCampaignId', v)}>
                        <SelectTrigger className="h-11 rounded-xl bg-white/50"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                        <SelectContent>{campaigns.map(c => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}</SelectContent>
                    </Select>
                </div>
            )}
            <div className="space-y-2">
                <Label className="text-xs text-gray-500 pl-1">Motivo do Transbordo</Label>
                <Input value={formData.reason || ''} onChange={(e) => onChange('reason', e.target.value)}
                    placeholder="ex: Solicitou falar com humano" className="h-11 rounded-xl" />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-100">
                <div>
                    <Label className="text-sm font-medium text-gray-900">Resumo AI</Label>
                    <p className="text-[10px] text-gray-500">Gerar resumo da conversa para o atendente</p>
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
