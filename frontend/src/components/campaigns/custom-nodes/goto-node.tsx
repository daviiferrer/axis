'use client'

import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { ArrowRight } from 'lucide-react';

export const GotoNode = memo(({ data, isConnectable }: any) => {
    return (
        <div className="shadow-sm rounded-md border border-gray-300 bg-gray-50 flex items-center p-2 min-w-[100px]">
            <Handle
                type="target"
                position={Position.Left}
                isConnectable={isConnectable}
                className="w-2 h-2 bg-gray-400"
            />

            <div className="flex items-center gap-2 text-gray-600">
                <ArrowRight size={14} />
                <span className="text-xs font-mono">GOTO {data.targetId || '?'}</span>
            </div>
        </div>
    );
});
