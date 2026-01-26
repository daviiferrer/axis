'use client'

import React, { memo } from 'react';
import { NodeProps } from '@xyflow/react';
import { Megaphone, MessageSquare, Sparkles } from 'lucide-react';
import { BaseNode, NODE_PRESETS } from './base-node';
import { Badge } from '@/components/ui/badge';

// ============================================================================
// BROADCAST NODE: Mass outreach / Spintax messaging (Premium Version)
// ============================================================================

export const BroadcastNode = memo(({ data, isConnectable, selected }: NodeProps) => {
    return (
        <BaseNode
            gradientFrom="from-orange-50"
            gradientTo="to-amber-50/50"
            iconColor="text-orange-600"
            accentColor="!bg-orange-500"
            icon={Megaphone}
            title={data.label || 'Broadcast'}
            subtitle="Mensagem em Massa"
            showInputHandle={true}
            showOutputHandle={true}
            selected={selected}
            isConnectable={isConnectable}
            data={data}
        >
            <div className="space-y-3">
                {/* Message Preview */}
                {data.messageTemplate ? (
                    <div className="relative">
                        <div className="p-3 rounded-xl bg-gradient-to-br from-orange-50 to-white border border-orange-100">
                            <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">
                                {data.messageTemplate}
                            </p>
                        </div>
                        {/* Spintax indicator */}
                        {data.spintaxEnabled && (
                            <Badge className="absolute -top-2 -right-2 h-5 text-[10px] gap-1 bg-amber-100 text-amber-700 border-0">
                                <Sparkles size={10} /> Spintax
                            </Badge>
                        )}
                    </div>
                ) : (
                    <div className="text-center py-4">
                        <MessageSquare size={28} className="mx-auto text-gray-200 mb-2" />
                        <p className="text-xs text-gray-400">Configure a mensagem</p>
                    </div>
                )}
            </div>
        </BaseNode>
    );
});

BroadcastNode.displayName = 'BroadcastNode';
