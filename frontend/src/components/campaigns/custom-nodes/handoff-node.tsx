'use client'

import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Users } from 'lucide-react';

export const HandoffNode = memo(({ data, isConnectable }: any) => {
    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm min-w-[200px] hover:ring-2 hover:ring-gray-900/10 transition-all group">
            <Handle
                type="target"
                position={Position.Left}
                isConnectable={isConnectable}
                className="w-2 h-2 bg-gray-400 border-2 border-white transition-all group-hover:w-3 group-hover:h-3 group-hover:bg-gray-900"
            />

            <div className="p-4 flex flex-col items-center text-center">
                <div className="bg-gray-50 p-2 rounded-lg mb-2 border border-gray-100">
                    <Users size={18} className="text-gray-900" strokeWidth={1.5} />
                </div>
                <h3 className="font-semibold text-sm text-gray-900">Transbordo Humano</h3>
                <p className="text-[10px] text-gray-500 mt-1 max-w-[150px] leading-tight">
                    {data.reason || 'Encaminhar para atendimento'}
                </p>
            </div>
        </div>
    );
});
