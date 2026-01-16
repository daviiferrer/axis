'use client'

import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Bot, Sparkles, BrainCircuit } from 'lucide-react';

export const AgentNode = memo(({ data, isConnectable }: any) => {
    return (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm min-w-[240px] hover:ring-1 hover:ring-purple-500/50 transition-all group">
            <Handle
                type="target"
                position={Position.Left}
                isConnectable={isConnectable}
                className="w-2.5 h-2.5 bg-purple-500 border-2 border-white -ml-1 transition-all group-hover:w-3 group-hover:h-3 group-hover:shadow-sm"
            />

            {/* Header */}
            <div className="p-3 border-b border-gray-100 flex items-center gap-2.5">
                <Bot size={16} className="text-purple-600" />
                <div className="flex-1">
                    <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wide">Agente AI</h3>
                </div>
                {data.model && (
                    <div className="bg-purple-50 px-2 py-0.5 rounded text-[10px] text-purple-700 font-medium border border-purple-100">
                        {data.model}
                    </div>
                )}
            </div>

            {/* Body */}
            <div className="p-3 space-y-2">
                <div className="flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-purple-400 mt-0.5 shrink-0" />
                    <p className="text-sm font-medium text-gray-800 line-clamp-2 leading-tight">
                        {data.label || 'Configurar Agente'}
                    </p>
                </div>

                {data.systemPrompt && (
                    <div className="bg-gray-50 p-2.5 rounded-md text-xs text-gray-500 line-clamp-3 font-mono border border-gray-100 leading-relaxed">
                        {data.systemPrompt}
                    </div>
                )}
            </div>

            {/* Handles */}
            <Handle
                type="source"
                position={Position.Right}
                isConnectable={isConnectable}
                className="w-2.5 h-2.5 bg-purple-500 border-2 border-white -mr-1 transition-all group-hover:w-3 group-hover:h-3 group-hover:shadow-sm"
            />
        </div>
    );
});
