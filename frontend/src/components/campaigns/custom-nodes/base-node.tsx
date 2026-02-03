'use client'

import React, { ReactNode, memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

// ============================================================================
// BASE NODE: The foundation for all premium flow nodes
// Inspired by: n8n, Make.com, Turbo Flow styling
// ============================================================================

export interface BaseNodeProps {
    // Visual configuration
    icon: LucideIcon;
    iconColor?: string;
    gradientFrom?: string;
    gradientTo?: string;
    accentColor?: string;

    // Content
    title: string;
    subtitle?: string;
    children?: ReactNode;

    // Handles
    showInputHandle?: boolean;
    showOutputHandle?: boolean;
    outputHandleCount?: number;

    // From NodeProps (only what we use)
    selected?: boolean;
    isConnectable?: boolean;
    data?: any;
}

// Handle Component with premium styling
function NodeHandle({
    type,
    position,
    isConnectable,
    accentColor = 'bg-gray-400',
    id
}: {
    type: 'source' | 'target';
    position: Position;
    isConnectable?: boolean;
    accentColor?: string;
    id?: string;
}) {
    return (
        <Handle
            type={type}
            position={position}
            id={id}
            isConnectable={isConnectable}
            className={cn(
                "!w-4 !h-4 !border-[3px] !border-white !shadow-md",
                "transition-all duration-200 ease-out",
                "hover:!scale-125 hover:!shadow-lg",
                accentColor
            )}
        />
    );
}

// Main BaseNode Component
export const BaseNode = memo(({
    icon: Icon,
    iconColor = 'text-gray-600',
    gradientFrom = 'from-gray-50',
    gradientTo = 'to-white',
    accentColor = 'bg-gray-400',
    title,
    subtitle,
    children,
    showInputHandle = true,
    showOutputHandle = true,
    outputHandleCount = 1,
    selected,
    isConnectable,
    data,
}: BaseNodeProps) => {

    return (
        <div
            className={cn(
                // Base Structure
                "relative group min-w-[280px] max-w-[320px]",
                "bg-white rounded-2xl overflow-hidden",
                "transition-all duration-300 ease-out",

                // Shadow & Border
                selected
                    ? "shadow-2xl shadow-indigo-500/20 ring-2 ring-indigo-500"
                    : "shadow-lg shadow-gray-200/60 border border-gray-100 hover:shadow-xl hover:border-gray-200",

                // Subtle glow effect on hover (Turbo Flow inspired)
                "before:absolute before:inset-0 before:rounded-2xl before:opacity-0 before:transition-opacity before:duration-300",
                "group-hover:before:opacity-100",
                "before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:pointer-events-none"
            )}
        >
            {/* Input Handle */}
            {showInputHandle && (
                <NodeHandle
                    type="target"
                    position={Position.Left}
                    isConnectable={isConnectable}
                    accentColor={accentColor}
                />
            )}

            {/* Header with Gradient */}
            <div className={cn(
                "px-4 py-3 border-b border-gray-100/80",
                "bg-gradient-to-r",
                gradientFrom,
                gradientTo
            )}>
                <div className="flex items-center gap-3">
                    {/* Icon Container */}
                    <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center",
                        "bg-white shadow-sm border border-gray-100",
                        "transition-transform duration-200 group-hover:scale-105",
                        iconColor
                    )}>
                        <Icon size={20} strokeWidth={2} />
                    </div>

                    {/* Title Block */}
                    <div className="flex-1 min-w-0">
                        {subtitle && (
                            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">
                                {subtitle}
                            </p>
                        )}
                        <h3 className="text-sm font-bold text-gray-900 truncate leading-tight">
                            {title || 'Untitled'}
                        </h3>
                    </div>
                </div>
            </div>

            {/* Content Body */}
            {children && (
                <div className="p-4">
                    {children}
                </div>
            )}

            {/* Output Handle(s) */}
            {showOutputHandle && (
                <>
                    {outputHandleCount === 1 ? (
                        <NodeHandle
                            type="source"
                            position={Position.Right}
                            isConnectable={isConnectable}
                            accentColor={accentColor}
                        />
                    ) : (
                        // Multiple outputs (e.g., Split node, Logic node)
                        Array.from({ length: outputHandleCount }).map((_, i) => (
                            <Handle
                                key={`output-${i}`}
                                type="source"
                                position={Position.Right}
                                id={`output-${i}`}
                                isConnectable={isConnectable}
                                style={{ top: `${30 + (i * 25)}%` }}
                                className={cn(
                                    "!w-4 !h-4 !border-[3px] !border-white !shadow-md",
                                    "transition-all duration-200 ease-out hover:!scale-125",
                                    accentColor
                                )}
                            />
                        ))
                    )}
                </>
            )}

            {/* Selection Indicator */}
            {selected && (
                <div className="absolute inset-0 pointer-events-none rounded-2xl ring-2 ring-indigo-500 ring-offset-2" />
            )}
        </div>
    );
});

BaseNode.displayName = 'BaseNode';

// ============================================================================
// PRESET CONFIGURATIONS for common node types
// ============================================================================

export const NODE_PRESETS = {
    trigger: {
        gradientFrom: 'from-amber-50',
        gradientTo: 'to-orange-50/50',
        iconColor: 'text-amber-600',
        accentColor: '!bg-amber-500',
    },
    action: {
        gradientFrom: 'from-blue-50',
        gradientTo: 'to-indigo-50/50',
        iconColor: 'text-blue-600',
        accentColor: '!bg-blue-500',
    },
    agent: {
        gradientFrom: 'from-purple-50',
        gradientTo: 'to-violet-50/50',
        iconColor: 'text-purple-600',
        accentColor: '!bg-purple-500',
    },
    logic: {
        gradientFrom: 'from-slate-50',
        gradientTo: 'to-gray-50/50',
        iconColor: 'text-slate-600',
        accentColor: '!bg-slate-500',
    },
    delay: {
        gradientFrom: 'from-amber-50',
        gradientTo: 'to-yellow-50/50',
        iconColor: 'text-amber-600',
        accentColor: '!bg-amber-500',
    },
    split: {
        gradientFrom: 'from-pink-50',
        gradientTo: 'to-rose-50/50',
        iconColor: 'text-pink-600',
        accentColor: '!bg-pink-500',
    },
    handoff: {
        gradientFrom: 'from-rose-50',
        gradientTo: 'to-red-50/50',
        iconColor: 'text-rose-600',
        accentColor: '!bg-rose-500',
    },
    closing: {
        gradientFrom: 'from-red-50',
        gradientTo: 'to-orange-50/50',
        iconColor: 'text-red-600',
        accentColor: '!bg-red-500',
    },
} as const;
