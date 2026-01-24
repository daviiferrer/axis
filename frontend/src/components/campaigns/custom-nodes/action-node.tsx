'use client'

import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { MessageSquare, Image, Mic } from 'lucide-react';

export const ActionNode = memo(({ data, isConnectable }: any) => {
    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm min-w-[220px] hover:ring-2 hover:ring-gray-900/10 transition-all group">
            <Handle
                type="target"
                position={Position.Left}
                isConnectable={isConnectable}
                className="w-2 h-2 bg-gray-400 border-2 border-white -ml-1 transition-all group-hover:w-3 group-hover:h-3 group-hover:bg-gray-900"
            />

            {/* Header */}
            <div className="p-4 border-b border-gray-100 flex items-center gap-2">
                <div className="p-1.5 bg-gray-50 rounded-md border border-gray-100">
                    <MessageSquare size={14} className="text-gray-900" strokeWidth={1.5} />
                </div>
                <div className="flex-1">
                    <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider">Ação do Sistema</h3>
                </div>
            </div>

            {/* Body */}
            <div className="p-4">
                <p className="text-sm font-medium text-gray-700 line-clamp-2">
                    {data.label || 'Configurar Ação'}
                </p>
                <div className="mt-2 flex flex-wrap gap-1">
                    {data.actionType === 'update_tag' && (
                        <div className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium bg-gray-100 text-gray-600 border border-gray-200 uppercase tracking-wider">
                            🏷️ {data.tagPayload || 'Tag'}
                        </div>
                    )}
                    {data.actionType === 'update_status' && (
                        <div className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium bg-gray-100 text-gray-600 border border-gray-200 uppercase tracking-wider">
                            🔄 Status
                        </div>
                    )}
                    {data.actionType === 'webhook' && (
                        <div className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium bg-gray-100 text-gray-600 border border-gray-200 uppercase tracking-wider">
                            🔗 Webhook
                        </div>
                    )}
                </div>
            </div>

            {/* Handles */}
            <Handle
                type="source"
                position={Position.Right}
                isConnectable={isConnectable}
                className="w-2 h-2 bg-gray-400 border-2 border-white -mr-1 transition-all group-hover:w-3 group-hover:h-3 group-hover:bg-gray-900"
            />
        </div>
    );
});
