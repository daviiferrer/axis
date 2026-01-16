'use client'

import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Clock } from 'lucide-react';

export const DelayNode = memo(({ data, isConnectable }: any) => {
    return (
        <div className="shadow-sm rounded-full border border-gray-300 bg-gray-50 min-w-[120px] flex items-center justify-between px-3 py-2">
            <Handle
                type="target"
                position={Position.Left}
                isConnectable={isConnectable}
                className="w-2 h-2 bg-gray-400"
            />

            <div className="flex items-center gap-2">
                <Clock size={14} className="text-gray-500" />
                <span className="text-sm font-medium text-gray-700">
                    {data.time || '0'} {data.unit || 'min'}
                </span>
            </div>

            <Handle
                type="source"
                position={Position.Right}
                isConnectable={isConnectable}
                className="w-2 h-2 bg-gray-400"
            />
        </div>
    );
});
