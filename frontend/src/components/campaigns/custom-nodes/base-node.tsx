'use client'

import React, { ReactNode, memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

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

    // States
    hasError?: boolean;

    // From NodeProps (only what we use)
    selected?: boolean;
    isConnectable?: boolean;
    data?: any;
}

// ============================================================================
// CONNECTOR PORT: Custom handle component — replaces default React Flow circles
// The Handle is invisible (for connection logic only).
// The visual is a sleek pill/bar flush with the node edge.
// ============================================================================

export function ConnectorPort({
    type,
    position,
    isConnectable,
    color = 'bg-gray-400',
    id,
    label,
}: {
    type: 'source' | 'target';
    position: Position;
    isConnectable?: boolean;
    color?: string;
    id?: string;
    label?: string;
}) {
    const isLeft = position === Position.Left;

    return (
        <div
            className={cn(
                "absolute flex items-center gap-1",
                isLeft ? "left-0 -translate-x-1/2" : "right-0 translate-x-1/2",
                "top-1/2 -translate-y-1/2"
            )}
            style={{ zIndex: 10 }}
        >
            {/* The invisible handle — React Flow needs this for connections */}
            <Handle
                type={type}
                position={position}
                id={id}
                isConnectable={isConnectable}
                className="!w-4 !h-6 !rounded-none !bg-transparent !border-0 !shadow-none !opacity-0"
                style={{ position: 'relative', transform: 'none', top: 'auto', left: 'auto', right: 'auto' }}
            />
            {/* The visible port — a small pill shape flush with the node */}
            <div
                className={cn(
                    "w-1.5 h-5 rounded-full",
                    color,
                    "pointer-events-none",
                    "absolute",
                    isLeft ? "-right-0.5" : "-left-0.5",
                    "top-1/2 -translate-y-1/2"
                )}
            />
            {/* Optional label */}
            {label && (
                <span className={cn(
                    "text-[9px] font-semibold text-gray-400 whitespace-nowrap pointer-events-none",
                    "absolute top-1/2 -translate-y-1/2",
                    isLeft ? "left-5" : "right-5"
                )}>
                    {label}
                </span>
            )}
        </div>
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
    hasError = false,
    selected,
    isConnectable,
    data,
}: BaseNodeProps) => {

    return (
        <div
            className={cn(
                // Base Structure — compact (200-240px)
                "relative group min-w-[200px] max-w-[240px]",
                "bg-white rounded-2xl",
                "transition-all duration-300 ease-out",
                "hover:scale-[1.02] hover:shadow-xl",

                // Shadow & Border
                hasError
                    ? "shadow-lg shadow-red-200/40 ring-2 ring-red-500 border border-red-200"
                    : selected
                        ? "shadow-2xl shadow-indigo-500/20 ring-2 ring-indigo-500"
                        : "shadow-lg shadow-gray-200/60 border border-gray-100"
            )}
        >
            {/* Input Port */}
            {showInputHandle && (
                <ConnectorPort
                    type="target"
                    position={Position.Left}
                    isConnectable={isConnectable}
                    color={accentColor}
                />
            )}

            {/* ERROR LEADS AVATAR GROUP (Above Header, Left aligned) */}
            {((data?.errorLeads as number) || 0) > 0 && (
                <div className="absolute -top-10 left-4 z-50 flex items-end animate-in fade-in zoom-in duration-300">
                    <div className="flex -space-x-2">
                        {(data?.errorLeadsList as any[] || []).map((lead, idx) => (
                            <div key={lead.id} className="relative group/avatar">
                                <Avatar className="h-8 w-8 border-2 border-white shadow-sm ring-2 ring-red-500/20">
                                    <AvatarImage src={lead.profile_picture_url || ''} />
                                    <AvatarFallback className="text-[10px] bg-red-100 text-red-700 font-medium">
                                        {lead.name?.substring(0, 2).toUpperCase() || 'ER'}
                                    </AvatarFallback>
                                </Avatar>
                                {/* Tooltip on hover */}
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-2 py-1 rounded shadow-lg opacity-0 group-hover/avatar:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                                    {lead.name || lead.phone || 'Unknown'}
                                </div>
                            </div>
                        ))}
                    </div>
                    {/* Remaining Count */}
                    {((data?.errorLeads as number) > (data?.errorLeadsList as any[] || []).length) && (
                        <div className="h-8 w-8 rounded-full bg-red-50 border-2 border-white shadow-sm flex items-center justify-center text-[10px] font-bold text-red-600 -ml-2 z-10 ring-2 ring-red-500/20">
                            +{(data?.errorLeads as number) - (data?.errorLeadsList as any[] || []).length}
                        </div>
                    )}
                </div>
            )}

            {/* ACTIVE LEADS AVATAR GROUP (Above Header, Right aligned) */}
            {((data?.activeLeads as number) || 0) > 0 && (
                <div className="absolute -top-10 right-4 z-50 flex flex-col items-center animate-in fade-in zoom-in duration-300">
                    <div className="flex -space-x-2">
                        {(data?.activeLeadsList as any[] || []).map((lead, idx) => (
                            <div key={lead.id} className="relative group/avatar cursor-help">
                                <Avatar className="h-8 w-8 border-2 border-white shadow-sm ring-2 ring-blue-500/20 relative">
                                    <AvatarImage src={lead.profile_picture_url || ''} />
                                    <AvatarFallback className="text-[10px] bg-blue-50 text-blue-700 font-medium">
                                        {lead.name?.substring(0, 2).toUpperCase() || 'U'}
                                    </AvatarFallback>
                                </Avatar>

                                {/* Status Indicator */}
                                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-blue-500 border border-white" />

                                {/* Tooltip on hover */}
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-2 py-1 rounded shadow-lg opacity-0 group-hover/avatar:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                                    {lead.name || lead.phone || 'Unknown'}
                                </div>
                            </div>
                        ))}
                    </div>
                    {/* Remaining Count */}
                    {((data?.activeLeads as number) > (data?.activeLeadsList as any[] || []).length) && (
                        <div className="absolute -right-4 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center text-[9px] font-bold text-gray-600 z-10">
                            +{(data?.activeLeads as number) - (data?.activeLeadsList as any[] || []).length}
                        </div>
                    )}
                </div>
            )}

            {/* Header with Gradient — compact */}
            <div className={cn(
                "px-3 py-2 border-b border-gray-100/80",
                "bg-gradient-to-r",
                gradientFrom,
                gradientTo
            )}>
                <div className="flex items-center gap-2.5">
                    {/* Icon — compact */}
                    <div className={cn(
                        "w-8 h-8 flex items-center justify-center",
                        "transition-transform duration-200 group-hover:scale-110",
                        iconColor
                    )}>
                        <Icon size={18} strokeWidth={2} />
                    </div>

                    {/* Title Block */}
                    <div className="flex-1 min-w-0">
                        {subtitle && (
                            <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">
                                {subtitle}
                            </p>
                        )}
                        <h3 className="text-[13px] font-bold text-gray-900 truncate leading-tight">
                            {title || 'Untitled'}
                        </h3>
                    </div>
                </div>
            </div>

            {/* Content Body — compact */}
            {children && (
                <div className="px-3 py-2">
                    {children}
                </div>
            )}

            {/* Output Port(s) */}
            {showOutputHandle && outputHandleCount === 1 && (
                <ConnectorPort
                    type="source"
                    position={Position.Right}
                    isConnectable={isConnectable}
                    color={accentColor}
                />
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
