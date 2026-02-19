'use client'

import React, { memo } from 'react';
import { NodeProps } from '@xyflow/react';
import { GitBranch, ArrowRightCircle } from 'lucide-react';
import { BaseNode, NODE_PRESETS, ConnectorPort } from './base-node';
import { Position } from '@xyflow/react';

interface LogicNodeData {
    label?: string;
    conditions?: Array<{ variable: string; operator: string; value: string }>;
    [key: string]: unknown;
}

// ============================================================================
// LOGIC NODE: Conditional branching with aligned output ports
// ============================================================================

export const LogicNode = memo(({ data: rawData, isConnectable, selected }: NodeProps) => {
    const data = rawData as LogicNodeData;
    const conditions = data.conditions || [];

    return (
        <BaseNode
            {...NODE_PRESETS.logic}
            icon={GitBranch}
            title={data.label || 'Condição IF/ELSE'}
            subtitle="Lógica"
            showInputHandle={true}
            showOutputHandle={false}
            selected={selected}
            isConnectable={isConnectable}
            data={data}
        >
            <div className="space-y-2">
                {conditions.length > 0 ? (
                    conditions.map((cond: any, idx: number) => (
                        <div
                            key={idx}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 border border-slate-100 relative"
                        >
                            <ArrowRightCircle size={12} className="text-slate-400" />
                            <span className="text-xs text-slate-600 font-medium truncate">
                                {cond.variable} {cond.operator} {cond.value}
                            </span>
                            {/* Port aligned to this row */}
                            <ConnectorPort
                                type="source"
                                position={Position.Right}
                                id={`output-${idx}`}
                                isConnectable={isConnectable}
                                color="bg-slate-400"
                            />
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
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 border border-dashed border-gray-200 relative">
                        <span className="text-[10px] text-gray-400 italic">Caso contrário (else)</span>
                        <ConnectorPort
                            type="source"
                            position={Position.Right}
                            id={`output-${conditions.length}`}
                            isConnectable={isConnectable}
                            color="bg-gray-400"
                        />
                    </div>
                )}

                {/* Fallback ports when no conditions */}
                {conditions.length === 0 && (
                    <>
                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 border border-slate-100 relative">
                            <ArrowRightCircle size={12} className="text-slate-400" />
                            <span className="text-xs text-slate-500">Saída 1</span>
                            <ConnectorPort
                                type="source"
                                position={Position.Right}
                                id="output-0"
                                isConnectable={isConnectable}
                                color="bg-slate-400"
                            />
                        </div>
                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 border border-dashed border-gray-200 relative">
                            <span className="text-[10px] text-gray-400 italic">Caso contrário (else)</span>
                            <ConnectorPort
                                type="source"
                                position={Position.Right}
                                id="output-1"
                                isConnectable={isConnectable}
                                color="bg-gray-400"
                            />
                        </div>
                    </>
                )}
            </div>
        </BaseNode>
    );
});

LogicNode.displayName = 'LogicNode';
