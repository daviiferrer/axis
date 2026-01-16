'use client'

import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Split } from 'lucide-react';

export const SplitNode = memo(({ data, isConnectable }: any) => {
    return (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm min-w-[160px] hover:ring-1 hover:ring-indigo-500/50 transition-all group">
            <Handle
                type="target"
                position={Position.Left}
                isConnectable={isConnectable}
                className="w-2.5 h-2.5 bg-indigo-500 border-2 border-white -ml-1 transition-all group-hover:w-3 group-hover:h-3 group-hover:shadow-sm"
            />

            {/* Header */}
            <div className="p-3 border-b border-gray-100 flex items-center gap-2.5">
                <Split size={16} className="text-indigo-600" />
                <div className="flex-1">
                    <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wide">Split A/B</h3>
                </div>
            </div>

            {/* Body */}
            <div className="p-0">
                <div className="flex flex-col">
                    <div className="relative p-2 flex justify-between items-center bg-gray-50/50 border-b border-gray-50">
                        <span className="text-xs font-medium text-gray-600 pl-1">Caminho A</span>
                        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                            {data.percentA || 50}%
                        </span>
                        <Handle
                            type="source"
                            position={Position.Right}
                            id="a"
                            isConnectable={isConnectable}
                            className="w-2.5 h-2.5 bg-blue-500 border-2 border-white -mr-3 transition-all"
                            style={{ right: '-11px' }}
                        />
                    </div>
                    <div className="relative p-2 flex justify-between items-center">
                        <span className="text-xs font-medium text-gray-600 pl-1">Caminho B</span>
                        <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-100">
                            {data.percentB || 50}%
                        </span>
                        <Handle
                            type="source"
                            position={Position.Right}
                            id="b"
                            isConnectable={isConnectable}
                            className="w-2.5 h-2.5 bg-purple-500 border-2 border-white -mr-3 transition-all"
                            style={{ right: '-11px' }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
});
