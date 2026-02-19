'use client'

import React, { memo } from 'react';
import { NodeProps, Position } from '@xyflow/react';
import { RefreshCw, Bot, MessageSquare } from 'lucide-react';
import { BaseNode, ConnectorPort } from './base-node';
import { Badge } from '@/components/ui/badge';

interface FollowUpNodeData {
    label?: string;
    mode?: 'template' | 'agent';
    timeout?: number;
    timeoutUnit?: string;
    maxAttempts?: number;
    messageTemplate?: string;
    followUpGoal?: string;
    [key: string]: unknown;
}

// ============================================================================
// FOLLOW-UP NODE: Automated Lead Re-engagement with aligned ports
// ============================================================================

export const FollowUpNode = memo(({ data: rawData, isConnectable, selected }: NodeProps) => {
    const data = rawData as FollowUpNodeData;

    const getUnitLabel = (unit: string) => {
        switch (unit) {
            case 's': return 'seg';
            case 'm': return 'min';
            case 'h': return 'h';
            case 'd': return 'dias';
            default: return 'h';
        }
    };

    const getGoalLabel = (goal: string) => {
        switch (goal) {
            case 'RECOVER_COLD': return 'Recuperar';
            case 'CROSS_SELL': return 'Cross-sell';
            case 'CHECK_IN': return 'Check-in';
            case 'APPOINTMENT_REMINDER': return 'Lembrete';
            case 'CUSTOM': return 'Custom';
            default: return 'Recuperar';
        }
    };

    const timeout = data.timeout || 24;
    const unit = data.timeoutUnit || 'h';
    const mode = data.mode || 'template';
    const maxAttempts = data.maxAttempts || 3;

    return (
        <BaseNode
            gradientFrom="from-teal-50"
            gradientTo="to-cyan-50/50"
            iconColor="text-teal-600"
            accentColor="!bg-teal-500"
            icon={RefreshCw}
            title={data.label || 'Follow-Up'}
            subtitle="Reengajamento"
            showInputHandle={true}
            showOutputHandle={false}
            selected={selected}
            isConnectable={isConnectable}
            data={data}
        >
            <div className="space-y-3">
                {/* Timer + Mode Display */}
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-baseline gap-1.5 px-4 py-3 rounded-xl bg-gradient-to-br from-teal-50 to-cyan-50 border border-teal-100 flex-1">
                        <span className="text-3xl font-bold text-teal-600 tabular-nums">
                            {timeout}
                        </span>
                        <span className="text-sm font-medium text-teal-500">
                            {getUnitLabel(unit)}
                        </span>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Badge
                            className={`text-[10px] gap-1 border-0 ${mode === 'agent'
                                ? 'bg-purple-100 text-purple-700'
                                : 'bg-blue-100 text-blue-700'
                                }`}
                        >
                            {mode === 'agent' ? <Bot size={10} /> : <MessageSquare size={10} />}
                            {mode === 'agent' ? 'IA' : 'Msg'}
                        </Badge>
                        <Badge className="text-[10px] bg-gray-100 text-gray-600 border-0">
                            {maxAttempts}x máx
                        </Badge>
                    </div>
                </div>

                {/* Goal indicator (agent mode) */}
                {mode === 'agent' && data.followUpGoal && (
                    <div className="text-center">
                        <span className="text-[11px] text-teal-500 font-medium">
                            🎯 {getGoalLabel(data.followUpGoal)}
                        </span>
                    </div>
                )}

                {/* Message preview (template mode) */}
                {mode === 'template' && data.messageTemplate && (
                    <div className="p-2.5 rounded-lg bg-white/60 border border-teal-100">
                        <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
                            {data.messageTemplate}
                        </p>
                    </div>
                )}

                {/* Output paths with inline ports */}
                <div className="space-y-1.5 border-t border-gray-100 pt-3">
                    <div className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-emerald-50 border border-emerald-100 relative">
                        <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                            ✓ Respondeu
                        </span>
                        <ConnectorPort
                            type="source"
                            position={Position.Right}
                            id="user_replied"
                            isConnectable={isConnectable}
                            color="bg-emerald-500"
                        />
                    </div>
                    <div className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-red-50 border border-red-100 relative">
                        <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider">
                            ✗ Esgotou
                        </span>
                        <ConnectorPort
                            type="source"
                            position={Position.Right}
                            id="max_attempts"
                            isConnectable={isConnectable}
                            color="bg-red-500"
                        />
                    </div>
                </div>
            </div>
        </BaseNode>
    );
});

FollowUpNode.displayName = 'FollowUpNode';
