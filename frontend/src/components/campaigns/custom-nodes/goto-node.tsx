'use client'

import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { ArrowRight } from 'lucide-react';

export const GotoNode = memo(({ data, isConnectable }: any) => {
    return (
        <div className="shadow-sm rounded-full border border-gray-200 bg-white min-w-[140px] flex items-center justify-between px-3 py-2 hover:ring-2 hover:ring-gray-900/10 transition-all group">
            <Handle
                type="target"
                position={Position.Left}
                isConnectable={isConnectable}
                className="w-2 h-2 bg-gray-400 border-2 border-white transition-all group-hover:bg-gray-900"
            />

            <div className="flex items-center gap-2 text-gray-700">
                <ArrowRight size={14} strokeWidth={1.5} />
                <span className="text-xs font-medium">
                    Ir para: <span className="font-bold text-gray-900">{data.targetLabel || 'Passo X'}</span>
                </span>
            </div>
        </div>
    );
});
