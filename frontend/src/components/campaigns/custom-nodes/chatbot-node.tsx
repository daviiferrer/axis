'use client'

import React, { memo } from 'react';
import { NodeProps } from '@xyflow/react';
import { MessageSquareText, ListTree } from 'lucide-react';
import { BaseNode } from './base-node';

interface ChatbotNodeData {
    label?: string;
    messages?: string[];
    routingRules?: any[];
    [key: string]: unknown;
}

export const ChatbotNode = memo(({ data: rawData, isConnectable, selected }: NodeProps) => {
    const data = rawData as ChatbotNodeData;
    const msgCount = data.messages?.length || 0;
    const rulesCount = data.routingRules?.length || 0;

    return (
        <BaseNode
            gradientFrom="from-rose-50"
            gradientTo="to-pink-50/50"
            iconColor="text-rose-600"
            accentColor="!bg-rose-500"
            icon={MessageSquareText}
            title={data.label || 'Chatbot Determinístico'}
            subtitle="Fluxograma Fixo"
            showInputHandle={true}
            showOutputHandle={true}
            selected={selected}
            isConnectable={isConnectable}
            data={data}
            outputHandleCount={Math.max(1, rulesCount + 1)} // Number of rules + 1 for fallback "else/any"
            outputHandleLabels={rulesCount > 0 ? [...data.routingRules!.map(r => r.value), 'Else'] : ['Default']}
        >
            <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2 mt-2">
                    <div className="flex flex-col items-center justify-center p-2 bg-white rounded-lg border border-gray-100 shadow-sm">
                        <MessageSquareText className="w-4 h-4 text-gray-400 mb-1" />
                        <span className="text-xs font-semibold text-gray-700">{msgCount}</span>
                        <span className="text-[10px] text-gray-400">Mensagens</span>
                    </div>
                    <div className="flex flex-col items-center justify-center p-2 bg-white rounded-lg border border-gray-100 shadow-sm">
                        <ListTree className="w-4 h-4 text-gray-400 mb-1" />
                        <span className="text-xs font-semibold text-gray-700">{rulesCount}</span>
                        <span className="text-[10px] text-gray-400">Regras</span>
                    </div>
                </div>

                {msgCount > 0 && (
                    <div className="p-2 mt-2 rounded bg-white border border-rose-100 text-[11px] text-gray-500 line-clamp-2">
                        {data.messages?.[0]}
                    </div>
                )}
            </div>
        </BaseNode>
    );
});

ChatbotNode.displayName = 'ChatbotNode';
