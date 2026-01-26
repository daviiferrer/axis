'use client'

import React, { memo } from 'react';
import { NodeProps } from '@xyflow/react';
import { Bot, Sparkles, BrainCircuit } from 'lucide-react';
import { BaseNode, NODE_PRESETS } from './base-node';
import { Badge } from '@/components/ui/badge';

// ============================================================================
// AGENT NODE: AI-powered conversational agent (Premium Version)
// ============================================================================

export const AgentNode = memo(({ data, isConnectable, selected }: NodeProps) => {
    return (
        <BaseNode
            {...NODE_PRESETS.agent}
            icon={Bot}
            title={data.label || 'Agente IA'}
            subtitle="Inteligência"
            showInputHandle={true}
            showOutputHandle={true}
            selected={selected}
            isConnectable={isConnectable}
            data={data}
        >
            <div className="space-y-3">
                {/* Model Badge */}
                {data.model && (
                    <Badge className="bg-purple-100 text-purple-700 border-0 text-[10px] font-mono">
                        <Sparkles size={10} className="mr-1" />
                        {data.model}
                    </Badge>
                )}

                {/* Agent Name / Brain Selected */}
                {data.agentName && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-100">
                        <BrainCircuit size={14} className="text-purple-500" />
                        <span className="text-sm font-medium text-purple-900">{data.agentName}</span>
                    </div>
                )}

                {/* System Prompt Preview */}
                {data.systemPrompt && (
                    <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Prompt</p>
                        <p className="text-xs text-gray-600 line-clamp-2 font-mono leading-relaxed">
                            {data.systemPrompt}
                        </p>
                    </div>
                )}

                {/* Empty State */}
                {!data.agentName && !data.systemPrompt && (
                    <div className="text-center py-3">
                        <BrainCircuit size={24} className="mx-auto text-gray-300 mb-2" />
                        <p className="text-xs text-gray-400">Selecione um cérebro</p>
                    </div>
                )}
            </div>
        </BaseNode>
    );
});

AgentNode.displayName = 'AgentNode';
