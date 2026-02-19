'use client'

import React, { memo } from 'react';
import { NodeProps, Position } from '@xyflow/react';
import { Split } from 'lucide-react';
import { BaseNode, NODE_PRESETS, ConnectorPort } from './base-node';

interface SplitNodeData {
    label?: string;
    variantA_percent?: number;
    [key: string]: unknown;
}

// ============================================================================
// SPLIT NODE: A/B Test branching with aligned output ports
// ============================================================================

export const SplitNode = memo(({ data: rawData, isConnectable, selected }: NodeProps) => {
    const data = rawData as SplitNodeData;
    const percentA = data.variantA_percent ?? 50;
    const percentB = 100 - percentA;

    return (
        <BaseNode
            {...NODE_PRESETS.split}
            icon={Split}
            title={data.label || 'Teste A/B'}
            subtitle="Divisão"
            showInputHandle={true}
            showOutputHandle={false}
            selected={selected}
            isConnectable={isConnectable}
            data={data}
        >
            <div className="space-y-3">
                {/* Visual Bar */}
                <div className="relative h-8 rounded-full overflow-hidden bg-gray-100 flex">
                    <div
                        className="h-full bg-gradient-to-r from-blue-500 to-blue-400 flex items-center justify-center"
                        style={{ width: `${percentA}%` }}
                    >
                        <span className="text-[10px] font-bold text-white">A</span>
                    </div>
                    <div
                        className="h-full bg-gradient-to-r from-pink-400 to-pink-500 flex items-center justify-center"
                        style={{ width: `${percentB}%` }}
                    >
                        <span className="text-[10px] font-bold text-white">B</span>
                    </div>
                </div>

                {/* Labels with inline ports */}
                <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-100 relative">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                        <span className="text-xs font-bold text-blue-600">Variante A — {percentA}%</span>
                        <ConnectorPort
                            type="source"
                            position={Position.Right}
                            id="output-0"
                            isConnectable={isConnectable}
                            color="bg-blue-500"
                        />
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-pink-50 border border-pink-100 relative">
                        <div className="w-2 h-2 rounded-full bg-pink-500" />
                        <span className="text-xs font-bold text-pink-600">Variante B — {percentB}%</span>
                        <ConnectorPort
                            type="source"
                            position={Position.Right}
                            id="output-1"
                            isConnectable={isConnectable}
                            color="bg-pink-500"
                        />
                    </div>
                </div>
            </div>
        </BaseNode>
    );
});

SplitNode.displayName = 'SplitNode';
