'use client'

import React, { memo } from 'react';
import { NodeProps } from '@xyflow/react';
import { CheckCircle2, XCircle, Archive, Flag } from 'lucide-react';
import { BaseNode, NODE_PRESETS } from './base-node';
import { Badge } from '@/components/ui/badge';

interface ClosingNodeData {
    label?: string;
    finalStatus?: string;
    closingStatus?: string;
    [key: string]: unknown;
}

// ============================================================================
// CLOSING NODE: End state / Final outcome (Premium Version)
// ============================================================================

export const ClosingNode = memo(({ data: rawData, isConnectable, selected }: NodeProps) => {
    const data = rawData as ClosingNodeData;

    const getStatusConfig = () => {
        // Support both finalStatus (backend) and closingStatus (legacy)
        const status = data.finalStatus || data.closingStatus;

        switch (status) {
            case 'completed':
                return {
                    icon: CheckCircle2,
                    bg: 'bg-gray-50',
                    border: 'border-gray-200',
                    iconColor: 'text-gray-500',
                    label: 'Concluído',
                    badgeClass: 'bg-gray-100 text-gray-700',
                };
            case 'won':
            case 'closed_resolved':
                return {
                    icon: CheckCircle2,
                    bg: 'bg-green-50',
                    border: 'border-green-100',
                    iconColor: 'text-green-500',
                    label: 'Ganho',
                    badgeClass: 'bg-green-100 text-green-700',
                };
            case 'lost':
            case 'closed_lost':
                return {
                    icon: XCircle,
                    bg: 'bg-red-50',
                    border: 'border-red-100',
                    iconColor: 'text-red-500',
                    label: 'Perdido',
                    badgeClass: 'bg-red-100 text-red-700',
                };
            case 'archived':
                return {
                    icon: Archive,
                    bg: 'bg-slate-50',
                    border: 'border-slate-100',
                    iconColor: 'text-slate-500',
                    label: 'Arquivado',
                    badgeClass: 'bg-slate-100 text-slate-700',
                };
            default:
                return {
                    icon: Flag,
                    bg: 'bg-gray-50',
                    border: 'border-dashed border-gray-200',
                    iconColor: 'text-gray-300',
                    label: 'Configurar Status',
                    badgeClass: 'bg-gray-100 text-gray-400',
                };
        }
    };

    const config = getStatusConfig();
    const StatusIcon = config.icon;

    return (
        <BaseNode
            {...NODE_PRESETS.closing}
            icon={Flag}
            title={data.label || 'Fim'}
            subtitle="Fechamento"
            showInputHandle={true}
            showOutputHandle={false}
            selected={selected}
            isConnectable={isConnectable}
            data={data}
        >
            <div className="flex flex-col items-center justify-center py-4">
                <div className={`w-16 h-16 rounded-2xl ${config.bg} ${config.border} border flex items-center justify-center mb-3`}>
                    <StatusIcon size={32} className={config.iconColor} />
                </div>
                <Badge className={`${config.badgeClass} border-0 text-xs`}>
                    {config.label}
                </Badge>
            </div>
        </BaseNode>
    );
});

ClosingNode.displayName = 'ClosingNode';
