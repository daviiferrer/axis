'use client'

import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Clock } from 'lucide-react';

export const DelayNode = memo(({ data, isConnectable }: any) => {
    return (
        <div className="shadow-sm rounded-full border border-gray-200 bg-white min-w-[120px] flex items-center justify-between px-3 py-2 hover:ring-2 hover:ring-gray-900/10 transition-all group">
            <Handle
                type="target"
                position={Position.Left}
                isConnectable={isConnectable}
                className="w-2 h-2 bg-gray-400 border-2 border-white transition-all group-hover:bg-gray-900"
            />

            <div className="flex items-center gap-2">
                <Clock size={14} className="text-gray-900" strokeWidth={1.5} />
                <span className="text-xs font-mono font-medium text-gray-600">
                    {data.time || data.delayValue || data.duration || '0'} {data.unit || data.delayUnit || 'min'}
                </span>
            </div>

            <Handle
                type="source"
                position={Position.Right}
                isConnectable={isConnectable}
                className="w-2 h-2 bg-gray-400 border-2 border-white transition-all group-hover:bg-gray-900"
            />
        </div>
    );
});
