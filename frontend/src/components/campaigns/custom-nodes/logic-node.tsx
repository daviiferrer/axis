'use client'

import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { GitBranch } from 'lucide-react';

export const LogicNode = memo(({ data, isConnectable }: any) => {
    return (
        <div className="shadow-md rounded-lg border border-orange-300 bg-white min-w-[180px]">
            <Handle
                type="target"
                position={Position.Left}
                isConnectable={isConnectable}
                className="w-3 h-3 bg-orange-500 border-2 border-white"
            />

            {/* Header */}
            <div className="bg-orange-50 p-2 rounded-t-lg border-b border-orange-100 flex items-center gap-2">
                <div className="bg-orange-500 p-1 rounded text-white">
                    <GitBranch size={14} />
                </div>
                <div className="flex-1">
                    <h3 className="text-xs font-bold text-orange-900 uppercase tracking-wide">Condição</h3>
                </div>
            </div>

            {/* Body */}
            <div className="p-3 text-center">
                <p className="text-sm font-medium text-gray-900 mb-2">
                    {data.condition || 'Se...'}
                </p>

                <div className="flex justify-between items-center text-xs text-gray-500 px-2">
                    <span>Verdadeiro</span>
                    <span>Falso</span>
                </div>
            </div>

            {/* Handles - Two outputs */}
            <Handle
                type="source"
                position={Position.Right}
                id="true"
                isConnectable={isConnectable}
                className="w-3 h-3 bg-green-500 border-2 border-white top-[60%]"
            />
            <Handle
                type="source"
                position={Position.Right}
                id="false"
                isConnectable={isConnectable}
                className="w-3 h-3 bg-red-500 border-2 border-white top-[80%]"
            />
        </div>
    );
});
