'use client'

import React, { memo } from 'react';
import { NodeProps } from '@xyflow/react';
import { Split, Percent } from 'lucide-react';
import { BaseNode, NODE_PRESETS } from './base-node';

// ============================================================================
// SPLIT NODE: A/B Test branching (Premium Version)
// ============================================================================

export const SplitNode = memo(({ data, isConnectable, selected }: NodeProps) => {
    const percentA = data.variantA_percent ?? 50;
    const percentB = 100 - percentA;

    return (
        <BaseNode
            {...NODE_PRESETS.split}
            icon={Split}
            title={data.label || 'Teste A/B'}
            subtitle="Divisão"
            showInputHandle={true}
            showOutputHandle={true}
            outputHandleCount={2}
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

                {/* Labels */}
                <div className="flex justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                        <span className="font-bold text-blue-600">{percentA}%</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="font-bold text-pink-600">{percentB}%</span>
                        <div className="w-2.5 h-2.5 rounded-full bg-pink-500" />
                    </div>
                </div>
            </div>
        </BaseNode>
    );
});

SplitNode.displayName = 'SplitNode';
