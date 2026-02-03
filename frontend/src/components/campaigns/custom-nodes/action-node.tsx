'use client'

import React, { memo } from 'react';
import { NodeProps } from '@xyflow/react';
import { MessageSquare, Image, Mic, Tag, Globe, Megaphone } from 'lucide-react';
import { BaseNode, NODE_PRESETS } from './base-node';
import { Badge } from '@/components/ui/badge';

interface ActionNodeData {
    label?: string;
    actionType?: 'message' | 'webhook' | 'update_tag' | 'remove_tag' | 'broadcast';
    messageContent?: string;
    webhookUrl?: string;
    tagPayload?: string;
    hasImage?: boolean;
    hasAudio?: boolean;
    [key: string]: unknown;
}

// ============================================================================
// ACTION NODE: Message/Action step (Premium Version)
// ============================================================================

export const ActionNode = memo(({ data: rawData, isConnectable, selected }: NodeProps) => {
    const data = rawData as ActionNodeData;

    // Determine icon based on action type
    const getIcon = () => {
        switch (data.actionType) {
            case 'webhook': return Globe;
            case 'update_tag':
            case 'remove_tag': return Tag;
            case 'broadcast': return Megaphone;
            default: return MessageSquare;
        }
    };

    // Determine preset based on action type
    const getPreset = () => {
        if (data.actionType === 'broadcast') {
            return {
                gradientFrom: 'from-orange-50',
                gradientTo: 'to-amber-50/50',
                iconColor: 'text-orange-600',
                accentColor: '!bg-orange-500',
            };
        }
        return NODE_PRESETS.action;
    };

    const Icon = getIcon();
    const preset = getPreset();

    return (
        <BaseNode
            {...preset}
            icon={Icon}
            title={data.label || 'Nova Ação'}
            subtitle={data.actionType === 'broadcast' ? 'Broadcast' : 'Ação'}
            showInputHandle={true}
            showOutputHandle={true}
            selected={selected}
            isConnectable={isConnectable}
            data={data}
        >
            <div className="space-y-3">
                {/* Message Preview */}
                {(data.actionType === 'message' || !data.actionType) && data.messageContent && (
                    <div className="relative">
                        <div className="p-3 rounded-xl bg-gradient-to-br from-gray-50 to-white border border-gray-100">
                            <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">
                                {data.messageContent}
                            </p>
                        </div>
                        {/* Media indicators */}
                        {(data.hasImage || data.hasAudio) && (
                            <div className="flex gap-1.5 mt-2">
                                {data.hasImage && (
                                    <Badge variant="secondary" className="h-5 text-[10px] gap-1 bg-blue-50 text-blue-600 border-0">
                                        <Image size={10} /> Imagem
                                    </Badge>
                                )}
                                {data.hasAudio && (
                                    <Badge variant="secondary" className="h-5 text-[10px] gap-1 bg-purple-50 text-purple-600 border-0">
                                        <Mic size={10} /> Áudio
                                    </Badge>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Webhook Preview */}
                {data.actionType === 'webhook' && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-50/50 border border-indigo-100">
                        <Globe size={12} className="text-indigo-500 shrink-0" />
                        <span className="text-xs font-mono text-indigo-700 truncate">
                            {data.webhookUrl || 'URL não configurada'}
                        </span>
                    </div>
                )}

                {/* Tag Preview */}
                {data.actionType?.includes('tag') && data.tagPayload && (
                    <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs">
                        {data.actionType === 'update_tag' ? '+ ' : '- '}
                        {data.tagPayload}
                    </Badge>
                )}

                {/* Empty state */}
                {!data.messageContent && !data.webhookUrl && !data.tagPayload && (
                    <p className="text-xs text-gray-400 italic text-center py-2">
                        Clique para configurar
                    </p>
                )}
            </div>
        </BaseNode>
    );
});

ActionNode.displayName = 'ActionNode';
