'use client'

import React, { memo } from 'react';
import { NodeProps } from '@xyflow/react';
import { ArrowUpRight, ExternalLink, CornerUpRight } from 'lucide-react';
import { BaseNode } from './base-node';

// ============================================================================
// GOTO NODE: Jump to another point or campaign (Premium Version)
// ============================================================================

export const GotoNode = memo(({ data, isConnectable, selected }: NodeProps) => {
    return (
        <BaseNode
            gradientFrom="from-cyan-50"
            gradientTo="to-blue-50/50"
            iconColor="text-cyan-600"
            accentColor="!bg-cyan-500"
            icon={CornerUpRight}
            title={data.label || 'Pular Para'}
            subtitle="Navegação"
            showInputHandle={true}
            showOutputHandle={false}
            selected={selected}
            isConnectable={isConnectable}
            data={data}
        >
            <div className="space-y-3">
                {data.target_campaign_id ? (
                    <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-indigo-50 border border-indigo-100">
                        <ExternalLink size={14} className="text-indigo-500" />
                        <span className="text-sm font-medium text-indigo-900 truncate">
                            Campanha: {data.target_campaign_id.slice(0, 8)}...
                        </span>
                    </div>
                ) : data.targetNodeId ? (
                    <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-cyan-50 border border-cyan-100">
                        <ArrowUpRight size={14} className="text-cyan-500" />
                        <span className="text-xs font-mono text-cyan-700">
                            → {data.targetNodeId}
                        </span>
                    </div>
                ) : (
                    <div className="text-center py-4">
                        <CornerUpRight size={28} className="mx-auto text-gray-200 mb-2" />
                        <p className="text-xs text-gray-400">Selecione destino</p>
                    </div>
                )}
            </div>
        </BaseNode>
    );
});

GotoNode.displayName = 'GotoNode';
