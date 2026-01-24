'use client'

import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Split } from 'lucide-react';

export const SplitNode = memo(({ data, isConnectable }: any) => {
    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm min-w-[160px] hover:ring-2 hover:ring-gray-900/10 transition-all group">
            <Handle
                type="target"
                position={Position.Left}
                isConnectable={isConnectable}
                className="w-2 h-2 bg-gray-400 border-2 border-white -ml-1 transition-all group-hover:w-3 group-hover:h-3 group-hover:bg-gray-900"
            />

            {/* Header */}
            <div className="p-3 border-b border-gray-100 flex items-center gap-2">
                <div className="p-1 bg-gray-50 rounded border border-gray-100">
                    <Split size={14} className="text-gray-900" strokeWidth={1.5} />
                </div>
                <div className="flex-1">
                    <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider">Split A/B</h3>
                </div>
            </div>

            {/* Body */}
            <div className="p-0">
                <div className="flex flex-col">
                    <div className="relative p-2 flex justify-between items-center bg-gray-50/30 border-b border-gray-50">
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider pl-1">Caminho A</span>
                        <span className="text-[10px] font-mono text-gray-700 bg-white px-1.5 py-0.5 rounded border border-gray-200">
                            {data.variantA_percent || 50}%
                        </span>
                        <Handle
                            type="source"
                            position={Position.Right}
                            id="a"
                            isConnectable={isConnectable}
                            className="w-2 h-2 bg-gray-400 border-2 border-white -mr-3 transition-all group-hover:bg-gray-900"
                            style={{ right: '-11px' }}
                        />
                    </div>
                    <div className="relative p-2 flex justify-between items-center bg-white">
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider pl-1">Caminho B</span>
                        <span className="text-[10px] font-mono text-gray-700 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-200">
                            {100 - (data.variantA_percent || 50)}%
                        </span>
                        <Handle
                            type="source"
                            position={Position.Right}
                            id="b"
                            isConnectable={isConnectable}
                            className="w-2 h-2 bg-gray-400 border-2 border-white -mr-3 transition-all group-hover:bg-gray-900"
                            style={{ right: '-11px' }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
});
