'use client'

import React, { memo } from 'react';
import { NodeProps } from '@xyflow/react';
import { Clock, Timer } from 'lucide-react';
import { BaseNode, NODE_PRESETS } from './base-node';

interface DelayNodeData {
    label?: string;
    delayValue?: number;
    delayUnit?: string;
    duration?: number;
    unit?: string;
    [key: string]: unknown;
}

// ============================================================================
// DELAY NODE: Wait/Timer step (Premium Version)
// ============================================================================

export const DelayNode = memo(({ data: rawData, isConnectable, selected }: NodeProps) => {
    const data = rawData as DelayNodeData;

    const getUnitLabel = (unit: string) => {
        switch (unit) {
            case 's': return 'segundos';
            case 'm': return 'minutos';
            case 'h': return 'horas';
            case 'd': return 'dias';
            default: return 'minutos';
        }
    };

    const value = data.delayValue || data.duration || 0;
    const unit = data.delayUnit || data.unit || 'm';

    return (
        <BaseNode
            {...NODE_PRESETS.delay}
            icon={Clock}
            title={data.label || 'Aguardar'}
            subtitle="Temporizador"
            showInputHandle={true}
            showOutputHandle={true}
            selected={selected}
            isConnectable={isConnectable}
            data={data}
        >
            <div className="flex items-center justify-center py-4">
                <div className="flex items-baseline gap-2 px-6 py-4 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100">
                    <span className="text-4xl font-bold text-amber-600 tabular-nums">
                        {value || '?'}
                    </span>
                    <span className="text-sm font-medium text-amber-500">
                        {getUnitLabel(unit)}
                    </span>
                </div>
            </div>
        </BaseNode>
    );
});

DelayNode.displayName = 'DelayNode';
