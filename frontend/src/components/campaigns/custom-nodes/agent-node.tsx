'use client'

import React, { memo, useMemo } from 'react';
import { NodeProps } from '@xyflow/react';
import { Bot, Sparkles, CircleAlert, BrainCircuit, Mic, ClipboardList } from 'lucide-react';
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
    voice_enabled?: boolean;
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
// CONFIG VALIDATION: Checks node config for errors to display on canvas
// ============================================================================
function useNodeErrors(data: AgentNodeData): string[] {
    return useMemo(() => {
        const errors: string[] = [];
        if (!data.agentId && !data.agentName) {
            errors.push('Nenhum agente selecionado');
        }
        if (data.configErrors && data.configErrors.length > 0) {
            errors.push(...data.configErrors);
        }
        return errors;
    }, [data.agentId, data.agentName, data.configErrors]);
}

// ============================================================================
// AGENT NODE: Compact version — badges only, details in sidebar Sheet
// ============================================================================

export const AgentNode = memo(({ data: rawData, isConnectable, selected }: NodeProps) => {
    const data = rawData as AgentNodeData;
    const errors = useNodeErrors(data);
    const hasErrors = errors.length > 0;

    // Derived visuals
    const roleInfo = ROLE_MAP[data.role?.toUpperCase() || ''] || null;
    const slotCount = data.criticalSlots?.length || 0;
    const hasVoice = !!data.voice_enabled;

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
            title={data.label || data.agentName || 'Agente IA'}
            subtitle={hasErrors ? 'Erro' : 'Agente IA'}
            showInputHandle={true}
            showOutputHandle={true}
            hasError={hasErrors}
            selected={selected}
            isConnectable={isConnectable}
            data={data}
        >
            {/* ── Compact badges row ── */}
            <div className="flex items-center gap-1 flex-wrap">
                {/* Model badge */}
                {data.model && (
                    <Badge className="bg-purple-50 text-purple-700 border-0 text-[9px] font-mono h-[18px] px-1.5">
                        <Sparkles size={9} className="mr-0.5" />
                        {data.model.replace('gemini-', '').replace('gpt-', '')}
                    </Badge>
                )}

                {/* Role badge */}
                {roleInfo && (
                    <Badge className={`${roleInfo.color} border-0 text-[9px] font-semibold h-[18px] px-1.5`}>
                        {roleInfo.label}
                    </Badge>
                )}

                {/* Voice badge */}
                {hasVoice && (
                    <Badge className="bg-sky-50 text-sky-700 border-0 text-[9px] h-[18px] px-1.5">
                        <Mic size={9} />
                    </Badge>
                )}

                {/* Slots count badge */}
                {slotCount > 0 && (
                    <Badge className="bg-green-50 text-green-700 border-0 text-[9px] h-[18px] px-1.5">
                        <ClipboardList size={9} className="mr-0.5" />
                        {slotCount}
                    </Badge>
                )}
            </div>

            {/* ── Status line ── */}
            <div className="mt-1.5">
                {hasErrors ? (
                    <p className="text-[10px] text-red-600 font-medium truncate">
                        ⚠ {errors[0]}
                    </p>
                ) : data.agentName ? (
                    <div className="flex items-center gap-1.5">
                        <span className="flex h-1.5 w-1.5 rounded-full bg-green-500 shrink-0" />
                        <p className="text-[10px] text-gray-500 truncate">
                            {data.agentName}
                        </p>
                    </div>
                ) : (
                    <p className="text-[10px] text-gray-400">
                        Clique para configurar
                    </p>
                )}
            </div>
        </BaseNode>
    );
});

AgentNode.displayName = 'AgentNode';
