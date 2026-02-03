'use client'

import React, { memo } from 'react';
import { NodeProps } from '@xyflow/react';
import { Users, MessageCircle, Headphones, ExternalLink } from 'lucide-react';
import { BaseNode, NODE_PRESETS } from './base-node';
import { Badge } from '@/components/ui/badge';

interface HandoffNodeData {
    label?: string;
    target?: 'human' | 'campaign';
    targetCampaignId?: string;
    reason?: string;
    enableSummary?: boolean;
    [key: string]: unknown;
}

// ============================================================================
// HANDOFF NODE: Transfer to human agent (Premium Version)
// ============================================================================

export const HandoffNode = memo(({ data: rawData, isConnectable, selected }: NodeProps) => {
    const data = rawData as HandoffNodeData;
    const targetType = data.target || 'human';

    return (
        <BaseNode
            {...NODE_PRESETS.handoff}
            icon={Users}
            title={data.label || 'Transbordo'}
            subtitle={targetType === 'campaign' ? 'Para Campanha' : 'Para Humano'}
            showInputHandle={true}
            showOutputHandle={true}
            selected={selected}
            isConnectable={isConnectable}
            data={data}
        >
            <div className="space-y-3">
                {/* Target Type Indicator */}
                <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl ${targetType === 'campaign'
                    ? 'bg-indigo-50 border border-indigo-100'
                    : 'bg-rose-50 border border-rose-100'
                    }`}>
                    {targetType === 'campaign' ? (
                        <>
                            <ExternalLink size={14} className="text-indigo-500" />
                            <span className="text-sm font-medium text-indigo-900">
                                {data.targetCampaignId ? `Campanha: ${data.targetCampaignId.slice(0, 8)}...` : 'Selecionar Campanha'}
                            </span>
                        </>
                    ) : (
                        <>
                            <Headphones size={14} className="text-rose-500" />
                            <span className="text-sm font-medium text-rose-900">Atendente Humano</span>
                        </>
                    )}
                </div>

                {/* Reason */}
                {data.reason && (
                    <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                            Motivo
                        </p>
                        <p className="text-xs text-gray-600 line-clamp-2">
                            {data.reason}
                        </p>
                    </div>
                )}

                {/* AI Summary Indicator */}
                {data.enableSummary && (
                    <Badge className="bg-purple-100 text-purple-700 border-0 text-[10px]">
                        ✨ Resumo AI ativo
                    </Badge>
                )}
            </div>
        </BaseNode>
    );
});

HandoffNode.displayName = 'HandoffNode';
