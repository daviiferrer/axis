'use client'

import React, { memo } from 'react';
import { NodeProps } from '@xyflow/react';
import { GitBranch, ArrowRightCircle } from 'lucide-react';
import { BaseNode, NODE_PRESETS } from './base-node';

// ============================================================================
// LOGIC NODE: Conditional branching (Premium Version)
// ============================================================================

export const LogicNode = memo(({ data, isConnectable, selected }: NodeProps) => {
    const conditions = data.conditions || [];

    return (
        <BaseNode
            {...NODE_PRESETS.logic}
            icon={GitBranch}
            title={data.label || 'Roteador'}
            subtitle="Lógica"
            showInputHandle={true}
            showOutputHandle={true}
            outputHandleCount={Math.max(conditions.length + 1, 2)} // +1 for default/else
            selected={selected}
            isConnectable={isConnectable}
            data={data}
        >
            <div className="space-y-2">
                {conditions.length > 0 ? (
                    conditions.map((cond: any, idx: number) => (
                        <div
                            key={idx}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 border border-slate-100"
                        >
                            <ArrowRightCircle size={12} className="text-slate-400" />
                            <span className="text-xs text-slate-600 font-medium truncate">
                                {cond.variable} {cond.operator} {cond.value}
                            </span>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-4">
                        <GitBranch size={28} className="mx-auto text-gray-200 mb-2" />
                        <p className="text-xs text-gray-400">Adicione condições</p>
                        <p className="text-[10px] text-gray-300 mt-1">para criar ramificações</p>
                    </div>
                )}

                {/* Default/Else path indicator */}
                {conditions.length > 0 && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 border border-dashed border-gray-200">
                        <span className="text-[10px] text-gray-400 italic">Caso contrário (else)</span>
                    </div>
                )}
            </div>
        </BaseNode>
    );
});

LogicNode.displayName = 'LogicNode';
