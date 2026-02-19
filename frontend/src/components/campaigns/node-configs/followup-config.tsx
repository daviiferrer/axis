'use client'

import React, { useEffect, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bot, MessageSquare, RefreshCw, Clock, Target, Shield, Zap } from 'lucide-react';
import { agentService, Agent } from '@/services/agentService';

interface FollowUpConfigProps {
    formData: any;
    onChange: (key: string, value: any) => void;
}

const FOLLOW_UP_GOALS = [
    { id: 'RECOVER_COLD', label: 'Recuperar Lead Frio', icon: '🔥', desc: 'Reengajar lead que parou de responder' },
    { id: 'CROSS_SELL', label: 'Cross-Sell', icon: '💎', desc: 'Oferecer produto/serviço complementar' },
    { id: 'CHECK_IN', label: 'Check-in', icon: '👋', desc: 'Verificar se ainda precisa de ajuda' },
    { id: 'APPOINTMENT_REMINDER', label: 'Lembrete', icon: '📅', desc: 'Lembrar sobre reunião agendada' },
    { id: 'CUSTOM', label: 'Personalizado', icon: '✏️', desc: 'Objetivo livre' },
];

const VARIABLE_HELPERS = [
    { label: 'Nome', value: '{{name}}' },
    { label: 'Telefone', value: '{{phone}}' },
    { label: 'Email', value: '{{email}}' },
    { label: 'Empresa', value: '{{company}}' },
    { label: 'Tentativa', value: '{{attempt}}' },
];

export function FollowUpConfig({ formData, onChange }: FollowUpConfigProps) {
    const [agents, setAgents] = useState<Agent[]>([]);

    useEffect(() => {
        agentService.list().then(setAgents).catch(() => { });
    }, []);

    const mode = formData.mode || 'template';
    const followUpGoal = formData.followUpGoal || 'RECOVER_COLD';

    const insertVariable = (variable: string) => {
        const current = formData.messageTemplate || '';
        onChange('messageTemplate', current + variable);
    };

    return (
        <div className="space-y-6">
            {/* ─── Mode Selector ─── */}
            <div className="space-y-3">
                <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Modo de Follow-Up
                </Label>
                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={() => onChange('mode', 'template')}
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${mode === 'template'
                            ? 'border-blue-400 bg-blue-50/50 shadow-md shadow-blue-100'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                            }`}
                    >
                        <MessageSquare size={24} className={mode === 'template' ? 'text-blue-600' : 'text-gray-400'} />
                        <span className={`text-sm font-semibold ${mode === 'template' ? 'text-blue-700' : 'text-gray-500'}`}>
                            Mensagem
                        </span>
                        <span className="text-[10px] text-gray-400">Template com variáveis</span>
                    </button>
                    <button
                        onClick={() => onChange('mode', 'agent')}
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${mode === 'agent'
                            ? 'border-purple-400 bg-purple-50/50 shadow-md shadow-purple-100'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                            }`}
                    >
                        <Bot size={24} className={mode === 'agent' ? 'text-purple-600' : 'text-gray-400'} />
                        <span className={`text-sm font-semibold ${mode === 'agent' ? 'text-purple-700' : 'text-gray-500'}`}>
                            Agente IA
                        </span>
                        <span className="text-[10px] text-gray-400">Resposta inteligente</span>
                    </button>
                </div>
            </div>

            {/* ─── Template Mode: Message Editor ─── */}
            {mode === 'template' && (
                <div className="space-y-3">
                    <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Mensagem de Follow-Up
                    </Label>
                    <Textarea
                        value={formData.messageTemplate || ''}
                        onChange={(e) => onChange('messageTemplate', e.target.value)}
                        placeholder="Oi {{name}}, tudo bem? Vi que não conseguimos continuar nossa conversa..."
                        rows={4}
                        className="resize-none text-sm"
                    />
                    <div className="flex flex-wrap gap-1.5">
                        {VARIABLE_HELPERS.map((v) => (
                            <button
                                key={v.value}
                                onClick={() => insertVariable(v.value)}
                                className="px-2 py-1 text-[11px] font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 hover:text-blue-700 transition-colors border border-blue-100"
                            >
                                {v.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* ─── Agent Mode: Agent Selector + Goal ─── */}
            {mode === 'agent' && (
                <>
                    <div className="space-y-3">
                        <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                            <Bot size={14} /> Agente Responsável
                        </Label>
                        <Select
                            value={formData.agentId || ''}
                            onValueChange={(v) => onChange('agentId', v)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione o agente..." />
                            </SelectTrigger>
                            <SelectContent>
                                {agents.map((agent) => (
                                    <SelectItem key={agent.id} value={agent.id}>
                                        <div className="flex items-center gap-2">
                                            <Bot size={14} className="text-purple-500" />
                                            <span>{agent.name}</span>
                                            {agent.dna_config?.identity?.role && (
                                                <Badge variant="secondary" className="text-[10px] ml-1">
                                                    {agent.dna_config?.identity?.role}
                                                </Badge>
                                            )}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-3">
                        <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                            <Target size={14} /> Objetivo do Follow-Up
                        </Label>
                        <div className="grid grid-cols-1 gap-2">
                            {FOLLOW_UP_GOALS.map((goal) => (
                                <button
                                    key={goal.id}
                                    onClick={() => onChange('followUpGoal', goal.id)}
                                    className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${followUpGoal === goal.id
                                        ? 'border-teal-400 bg-teal-50/50 shadow-sm'
                                        : 'border-gray-100 bg-white hover:border-gray-200'
                                        }`}
                                >
                                    <span className="text-lg">{goal.icon}</span>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm font-semibold ${followUpGoal === goal.id ? 'text-teal-700' : 'text-gray-700'}`}>
                                            {goal.label}
                                        </p>
                                        <p className="text-[11px] text-gray-400 truncate">{goal.desc}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {followUpGoal === 'CUSTOM' && (
                        <div className="space-y-2">
                            <Label className="text-xs text-gray-500">Objetivo Personalizado</Label>
                            <Textarea
                                value={formData.customObjective || ''}
                                onChange={(e) => onChange('customObjective', e.target.value)}
                                placeholder="Descreva o objetivo do agente neste follow-up..."
                                rows={3}
                                className="resize-none text-sm"
                            />
                        </div>
                    )}
                </>
            )}

            {/* ─── Timing Configuration ─── */}
            <div className="space-y-3">
                <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock size={14} /> Esperar Antes de Enviar
                </Label>
                <div className="flex items-center gap-3">
                    <Input
                        type="number"
                        min={1}
                        max={168}
                        value={formData.timeout || 24}
                        onChange={(e) => onChange('timeout', parseInt(e.target.value) || 24)}
                        className="w-24 text-center font-bold text-lg"
                    />
                    <Select
                        value={formData.timeoutUnit || 'h'}
                        onValueChange={(v) => onChange('timeoutUnit', v)}
                    >
                        <SelectTrigger className="w-32">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="m">Minutos</SelectItem>
                            <SelectItem value="h">Horas</SelectItem>
                            <SelectItem value="d">Dias</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* ─── Limits ─── */}
            <div className="space-y-3">
                <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                    <RefreshCw size={14} /> Máximo de Tentativas
                </Label>
                <Input
                    type="number"
                    min={1}
                    max={10}
                    value={formData.maxAttempts || 3}
                    onChange={(e) => onChange('maxAttempts', parseInt(e.target.value) || 3)}
                    className="w-24 text-center font-bold text-lg"
                />
                <p className="text-[11px] text-gray-400">
                    Após {formData.maxAttempts || 3} tentativas sem resposta, o lead sai pela saída vermelha "esgotou"
                </p>
            </div>

            {/* ─── Toggles ─── */}
            <div className="space-y-4 pt-2 border-t border-gray-100">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Shield size={14} className="text-amber-500" />
                        <div>
                            <Label className="text-sm font-medium">Horário Comercial</Label>
                            <p className="text-[11px] text-gray-400">Enviar apenas 8h-20h (seg-sex)</p>
                        </div>
                    </div>
                    <Switch
                        checked={formData.businessHoursOnly ?? true}
                        onCheckedChange={(v) => onChange('businessHoursOnly', v)}
                    />
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Zap size={14} className="text-emerald-500" />
                        <div>
                            <Label className="text-sm font-medium">Cancelar se Respondeu</Label>
                            <p className="text-[11px] text-gray-400">Parar follow-up se o lead responder</p>
                        </div>
                    </div>
                    <Switch
                        checked={formData.cancelOnReply ?? true}
                        onCheckedChange={(v) => onChange('cancelOnReply', v)}
                    />
                </div>
            </div>

            {/* ─── Info Box ─── */}
            <div className="p-3 rounded-xl bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-100">
                <p className="text-[11px] text-teal-700 leading-relaxed">
                    <strong>💡 Como funciona:</strong> Após o timeout, o nó envia o follow-up
                    {mode === 'agent' ? ' usando o agente IA selecionado' : ' com a mensagem configurada'}.
                    Se o lead responder, sai pela saída verde. Se esgotar as tentativas, sai pela vermelha.
                </p>
            </div>
        </div>
    );
}
