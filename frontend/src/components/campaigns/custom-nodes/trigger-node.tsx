'use client'

import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Zap } from 'lucide-react';

export const TriggerNode = memo(({ data, isConnectable }: any) => {
    return (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm min-w-[200px] hover:ring-1 hover:ring-blue-500/50 transition-all group">
            {/* Header */}
            <div className="p-3 border-b border-gray-100 flex items-center gap-2.5">
                <Zap size={16} className="text-blue-600" />
                <div className="flex-1">
                    <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wide">Início</h3>
                </div>
            </div>

            {/* Body */}
            <div className="p-3">
                <p className="text-sm font-medium text-gray-800">{data.label || 'Gatilho Inicial'}</p>
                <p className="text-xs text-gray-500 mt-0.5 font-medium">Quando um lead entra</p>
            </div>

            {/* Handles */}
            <Handle
                type="source"
                position={Position.Right}
                isConnectable={isConnectable}
                className="w-2.5 h-2.5 bg-blue-500 border-2 border-white -mr-1 transition-all group-hover:w-3 group-hover:h-3 group-hover:shadow-sm"
            />
        </div>
    );
});
