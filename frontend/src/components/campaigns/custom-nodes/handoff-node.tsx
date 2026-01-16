'use client'

import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Users } from 'lucide-react';

export const HandoffNode = memo(({ data, isConnectable }: any) => {
    return (
        <div className="shadow-lg rounded-xl border-2 border-pink-500 bg-white min-w-[200px]">
            <Handle
                type="target"
                position={Position.Left}
                isConnectable={isConnectable}
                className="w-3 h-3 bg-pink-500 border-2 border-white"
            />

            <div className="p-4 flex flex-col items-center text-center">
                <div className="bg-pink-100 p-3 rounded-full mb-3 text-pink-600">
                    <Users size={24} />
                </div>
                <h3 className="font-bold text-gray-900">Transbordo Humano</h3>
                <p className="text-xs text-gray-500 mt-1">
                    {data.reason || 'Encaminhar para atendimento'}
                </p>
            </div>
        </div>
    );
});
