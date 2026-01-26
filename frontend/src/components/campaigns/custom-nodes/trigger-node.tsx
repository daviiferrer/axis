'use client'

import React, { memo } from 'react';
import { NodeProps } from '@xyflow/react';
import { Zap, Smartphone, Globe, Radio, Mail } from 'lucide-react';
import { BaseNode, NODE_PRESETS } from './base-node';
import { Badge } from '@/components/ui/badge';

// ============================================================================
// TRIGGER NODE: Entry point of the flow (Premium Version)
// ============================================================================

export const TriggerNode = memo(({ data, isConnectable, selected }: NodeProps) => {

    // Map source to icon
    const getSourceIcon = (source: string) => {
        switch (source) {
            case 'whatsapp': return <Smartphone size={10} />;
            case 'api': return <Globe size={10} />;
            case 'email': return <Mail size={10} />;
            default: return <Radio size={10} />;
        }
    };

    return (
        <BaseNode
            {...NODE_PRESETS.trigger}
            icon={Zap}
            title={data.label || 'Novo Lead'}
            subtitle="Gatilho"
            showInputHandle={false}
            showOutputHandle={true}
            selected={selected}
            isConnectable={isConnectable}
            data={data}
        >
            <div className="space-y-3">
                {/* Triage Mode Indicator */}
                {data.isTriage && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-900 text-white">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                        </span>
                        <span className="text-xs font-bold">Modo Triagem</span>
                        <span className="ml-auto text-[10px] opacity-60">24/7</span>
                    </div>
                )}

                {/* Sources */}
                <div className="space-y-1.5">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Fontes</p>
                    <div className="flex flex-wrap gap-1.5">
                        {data.allowedSources && data.allowedSources.length > 0 ? (
                            data.allowedSources.map((s: string) => (
                                <Badge
                                    key={s}
                                    variant="secondary"
                                    className="bg-white border border-gray-200 text-gray-600 gap-1 h-6 text-[10px]"
                                >
                                    {getSourceIcon(s)}
                                    {s}
                                </Badge>
                            ))
                        ) : (
                            <Badge variant="outline" className="border-dashed text-gray-400 text-[10px]">
                                Todas as redes
                            </Badge>
                        )}
                    </div>
                </div>

                {/* Session */}
                {data.sessionName && (
                    <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-gray-50 border border-gray-100">
                        <Smartphone size={12} className="text-gray-400" />
                        <span className="text-xs font-mono text-gray-600 truncate">{data.sessionName}</span>
                    </div>
                )}
            </div>
        </BaseNode>
    );
});

TriggerNode.displayName = 'TriggerNode';
