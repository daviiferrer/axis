'use client'

import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { MessageSquare, Image, Mic } from 'lucide-react';

export const ActionNode = memo(({ data, isConnectable }: any) => {
    return (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm min-w-[220px] hover:ring-1 hover:ring-green-500/50 transition-all group">
            <Handle
                type="target"
                position={Position.Left}
                isConnectable={isConnectable}
                className="w-2.5 h-2.5 bg-green-500 border-2 border-white -ml-1 transition-all group-hover:w-3 group-hover:h-3 group-hover:shadow-sm"
            />

            {/* Header */}
            <div className="p-3 border-b border-gray-100 flex items-center gap-2.5">
                <MessageSquare size={16} className="text-green-600" />
                <div className="flex-1">
                    <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wide">Enviar Mensagem</h3>
                </div>
            </div>

            {/* Body */}
            <div className="p-3">
                <p className="text-sm text-gray-600 whitespace-pre-wrap line-clamp-3 font-medium">
                    {data.message || data.label || 'Sem conteúdo...'}
                </p>

                {(data.hasMedia || data.hasAudio) && (
                    <div className="flex gap-2 mt-3 pt-2 border-t border-gray-50">
                        {data.hasMedia && (
                            <div className="flex items-center gap-1 text-[10px] text-gray-400 font-medium bg-gray-50 px-1.5 py-0.5 rounded-full border border-gray-100">
                                <Image size={10} />
                                <span>Mídia</span>
                            </div>
                        )}
                        {data.hasAudio && (
                            <div className="flex items-center gap-1 text-[10px] text-gray-400 font-medium bg-gray-50 px-1.5 py-0.5 rounded-full border border-gray-100">
                                <Mic size={10} />
                                <span>Áudio</span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Handles */}
            <Handle
                type="source"
                position={Position.Right}
                isConnectable={isConnectable}
                className="w-2.5 h-2.5 bg-green-500 border-2 border-white -mr-1 transition-all group-hover:w-3 group-hover:h-3 group-hover:shadow-sm"
            />
        </div>
    );
});
