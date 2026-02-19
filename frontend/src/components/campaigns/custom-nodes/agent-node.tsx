'use client'

import React, { memo, useMemo } from 'react';
import { NodeProps } from '@xyflow/react';
import { Bot, Sparkles, BrainCircuit, AlertTriangle, CircleAlert, Target, Briefcase, Calendar, Shield, MessageSquare, Zap, Rocket, LifeBuoy, Settings, Building2 } from 'lucide-react';
import { BaseNode, NODE_PRESETS } from './base-node';
import { Badge } from '@/components/ui/badge';

interface AgentNodeData {
    label?: string;
    model?: string;
    agentName?: string;
    agentId?: string;
    role?: string;
    goal?: string;
    custom_objective?: string;
    systemPrompt?: string;
    criticalSlots?: string[];
    company_context?: { company_name?: string; industry?: string; name?: string };
    // error fields injected by canvas validation
    configErrors?: string[];
    [key: string]: unknown;
}

// ============================================================================
// ROLE BADGES: Map role identifiers to visual labels & colors
// ============================================================================
const ROLE_MAP: Record<string, { label: string; color: string }> = {
    'SDR': { label: 'SDR', color: 'bg-blue-100 text-blue-700' },
    'CLOSER': { label: 'Closer', color: 'bg-emerald-100 text-emerald-700' },
    'CS': { label: 'CS', color: 'bg-amber-100 text-amber-700' },
    'SUPPORT': { label: 'Suporte', color: 'bg-indigo-100 text-indigo-700' },
    'ONBOARDING': { label: 'Onboard', color: 'bg-pink-100 text-pink-700' },
    'CUSTOM': { label: 'Custom', color: 'bg-gray-100 text-gray-600' },
};

// ============================================================================
// GOAL VISUALS: Map goal IDs to labels & icons
// ============================================================================
const GOAL_MAP: Record<string, { label: string; icon: React.ElementType; color: string }> = {
    'QUALIFY_LEAD': { label: 'Qualificar', icon: Target, color: 'text-blue-600' },
    'CLOSE_SALE': { label: 'Vender', icon: Briefcase, color: 'text-emerald-600' },
    'SCHEDULE_MEETING': { label: 'Agendar', icon: Calendar, color: 'text-purple-600' },
    'HANDLE_OBJECTION': { label: 'Objeções', icon: Shield, color: 'text-orange-600' },
    'PROVIDE_INFO': { label: 'Info/FAQ', icon: MessageSquare, color: 'text-sky-600' },
    'RECOVER_COLD': { label: 'Recuperar', icon: Zap, color: 'text-amber-600' },
    'ONBOARD_USER': { label: 'Onboard', icon: Rocket, color: 'text-pink-600' },
    'SUPPORT_TICKET': { label: 'Suporte', icon: LifeBuoy, color: 'text-indigo-600' },
    'CUSTOM': { label: 'Custom', icon: Settings, color: 'text-gray-600' },
};

// ============================================================================
// CONFIG VALIDATION: Checks node config for errors to display on canvas
// ============================================================================
function useNodeErrors(data: AgentNodeData): string[] {
    return useMemo(() => {
        const errors: string[] = [];
        // No agent selected
        if (!data.agentId && !data.agentName) {
            errors.push('Nenhum agente selecionado');
        }
        // Check for externally-injected errors
        if (data.configErrors && data.configErrors.length > 0) {
            errors.push(...data.configErrors);
        }
        return errors;
    }, [data.agentId, data.agentName, data.configErrors]);
}

// ============================================================================
// AGENT NODE: AI-powered conversational agent (Premium Version)
// ============================================================================

export const AgentNode = memo(({ data: rawData, isConnectable, selected }: NodeProps) => {
    const data = rawData as AgentNodeData;
    const errors = useNodeErrors(data);
    const hasErrors = errors.length > 0;

    // Derived visuals
    const roleInfo = ROLE_MAP[data.role?.toUpperCase() || ''] || null;
    const goalInfo = GOAL_MAP[data.goal || ''] || null;
    const GoalIcon = goalInfo?.icon;
    const companyName = data.company_context?.company_name || data.company_context?.name || null;

    // Override presets to red when there are config errors
    const nodePreset = hasErrors
        ? {
            gradientFrom: 'from-red-50',
            gradientTo: 'to-red-100/60',
            iconColor: 'text-red-600',
            accentColor: '!bg-red-500',
        }
        : NODE_PRESETS.agent;

    return (
        <BaseNode
            {...nodePreset}
            icon={hasErrors ? CircleAlert : Bot}
            title={data.label || 'Agente IA'}
            subtitle={hasErrors ? 'Erro de Config' : 'Inteligência'}
            showInputHandle={true}
            showOutputHandle={true}
            selected={selected}
            isConnectable={isConnectable}
            data={data}
        >
            <div className="space-y-2.5">
                {/* ── Config Error Banner ── */}
                {hasErrors && (
                    <div className="rounded-xl bg-red-50 border border-red-200 p-3 space-y-1.5 animate-in fade-in duration-300">
                        <div className="flex items-center gap-2">
                            <AlertTriangle size={14} className="text-red-500 shrink-0" />
                            <span className="text-[11px] font-bold text-red-700 uppercase tracking-wider">
                                Configuração Incompleta
                            </span>
                        </div>
                        <ul className="space-y-1 pl-5">
                            {errors.map((err, i) => (
                                <li key={i} className="text-[11px] text-red-600 list-disc leading-snug">
                                    {err}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* ── Badges Row: Model + Role ── */}
                <div className="flex items-center gap-1.5 flex-wrap">
                    {data.model && (
                        <Badge className="bg-purple-100 text-purple-700 border-0 text-[10px] font-mono h-5">
                            <Sparkles size={10} className="mr-1" />
                            {data.model}
                        </Badge>
                    )}
                    {roleInfo && (
                        <Badge className={`${roleInfo.color} border-0 text-[10px] font-semibold h-5`}>
                            {roleInfo.label}
                        </Badge>
                    )}
                </div>

                {/* ── Agent Name / Brain Selected ── */}
                {data.agentName && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-100">
                        <BrainCircuit size={14} className="text-purple-500 shrink-0" />
                        <span className="text-sm font-medium text-purple-900 truncate">{data.agentName}</span>
                    </div>
                )}

                {/* ── Goal Indicator ── */}
                {goalInfo && GoalIcon && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-100">
                        <GoalIcon size={13} className={`${goalInfo.color} shrink-0`} />
                        <span className="text-[11px] font-medium text-gray-700">
                            Objetivo: <span className="font-semibold">{goalInfo.label}</span>
                        </span>
                    </div>
                )}

                {/* ── Company Context ── */}
                {companyName && (
                    <div className="flex items-center gap-1.5 px-2 py-1">
                        <Building2 size={11} className="text-gray-400 shrink-0" />
                        <span className="text-[10px] text-gray-500 truncate">@ {companyName}</span>
                    </div>
                )}

                {/* ── Configured Slots Preview ── */}
                {data.criticalSlots && data.criticalSlots.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                        {data.criticalSlots.slice(0, 5).map((slot) => (
                            <span
                                key={slot}
                                className="px-2 py-0.5 rounded-md bg-green-50 text-green-700 text-[10px] font-medium border border-green-100 capitalize"
                            >
                                {slot}
                            </span>
                        ))}
                        {data.criticalSlots.length > 5 && (
                            <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-500 text-[10px] font-medium">
                                +{data.criticalSlots.length - 5}
                            </span>
                        )}
                    </div>
                )}

                {/* ── System Prompt Preview ── */}
                {data.systemPrompt && (
                    <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Prompt</p>
                        <p className="text-xs text-gray-600 line-clamp-2 font-mono leading-relaxed">
                            {data.systemPrompt}
                        </p>
                    </div>
                )}

                {/* ── Empty State ── */}
                {!data.agentName && !data.systemPrompt && !hasErrors && (
                    <div className="text-center py-3">
                        <BrainCircuit size={24} className="mx-auto text-gray-300 mb-2" />
                        <p className="text-xs text-gray-400">Selecione um cérebro</p>
                        <p className="text-[10px] text-gray-300 mt-0.5">Clique duplo para configurar</p>
                    </div>
                )}
            </div>
        </BaseNode>
    );
});

AgentNode.displayName = 'AgentNode';
