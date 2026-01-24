'use client'

import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { GitBranch } from 'lucide-react';

export const LogicNode = memo(({ data, isConnectable }: any) => {
    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm min-w-[200px] hover:ring-2 hover:ring-gray-900/10 transition-all group">
            <Handle
                type="target"
                position={Position.Left}
                isConnectable={isConnectable}
                className="w-2 h-2 bg-gray-400 border-2 border-white -ml-1 transition-all group-hover:w-3 group-hover:h-3 group-hover:bg-gray-900"
            />

            {/* Header */}
            <div className="p-3 border-b border-gray-100 flex items-center gap-2">
                <div className="p-1 bg-gray-50 rounded border border-gray-100">
                    <GitBranch size={14} className="text-gray-900" strokeWidth={1.5} />
                </div>
                <div className="flex-1">
                    <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider">Lógica</h3>
                </div>
            </div>

            {/* Body */}
            <div className="p-3">
                <div className="text-xs font-mono text-gray-600 bg-gray-50 p-2 rounded border border-gray-100 flex flex-col gap-1">
                    <div className="flex justify-between">
                        <span className="font-bold text-gray-400 uppercase tracking-wider">SE</span>
                        <span className="text-gray-900 font-medium">{data.condition || 'Verdadeiro'}</span>
                    </div>
                </div>
                <div className="flex justify-between mt-2 px-1 text-[10px] text-gray-400 uppercase tracking-widest font-medium">
                    <span>Sim</span>
                    <span>Não</span>
                </div>
            </div>

            {/* Handles - Two outputs */}
            <Handle
                type="source"
                position={Position.Right}
                id="true"
                isConnectable={isConnectable}
                className="w-2 h-2 bg-gray-400 border-2 border-white -mr-1 transition-all top-[60%] group-hover:bg-green-500"
            />
            <Handle
                type="source"
                position={Position.Right}
                id="false"
                isConnectable={isConnectable}
                className="w-2 h-2 bg-gray-400 border-2 border-white -mr-1 transition-all top-[80%] group-hover:bg-red-500"
            />
        </div>
    );
});
