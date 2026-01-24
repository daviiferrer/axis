'use client'

import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Zap } from 'lucide-react';

export const TriggerNode = memo(({ data, isConnectable }: any) => {
    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm min-w-[200px] hover:ring-2 hover:ring-gray-900/10 transition-all group">
            {/* Header */}
            <div className="p-4 border-b border-gray-100 flex items-center gap-2">
                <div className="p-1.5 bg-gray-50 rounded-md border border-gray-100">
                    <Zap size={14} className="text-gray-900" strokeWidth={1.5} />
                </div>
                <div className="flex-1">
                    <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider">Início</h3>
                </div>
            </div>

            {/* Body */}
            <div className="p-4">
                <div className="flex flex-col gap-2">
                    {data.isTriage && (
                        <div className="flex items-center gap-1.5 bg-gray-50 text-gray-900 px-2 py-1 rounded border border-gray-100 w-fit mb-1">
                            <span className="relative flex h-1.5 w-1.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gray-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-gray-900"></span>
                            </span>
                            <span className="text-[9px] font-bold uppercase tracking-wider">Modo Triagem</span>
                        </div>
                    )}

                    <p className="text-sm font-medium text-gray-600">
                        {data.label || 'Novo Lead'}
                    </p>

                    {data.sessionName && (
                        <div className="flex items-center gap-1 text-[10px] text-gray-400 font-mono bg-gray-50 px-2 py-1 rounded-md border border-gray-100 w-fit">
                            <span>📱</span> {data.sessionName}
                        </div>
                    )}

                    {data.allowedSources && data.allowedSources.length > 0 && (
                        <div className="flex gap-1 flex-wrap mt-1">
                            {data.allowedSources.map((s: string) => (
                                <span key={s} className="px-1.5 py-0.5 bg-white rounded text-[9px] uppercase tracking-tighter text-gray-400 border border-gray-100">
                                    {s}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Handles */}
            <Handle
                type="source"
                position={Position.Right}
                isConnectable={isConnectable}
                className="w-2 h-2 bg-gray-400 border-2 border-white -mr-1 transition-all group-hover:w-3 group-hover:h-3 group-hover:bg-gray-900"
            />
        </div>
    );
});
