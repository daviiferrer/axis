'use client'

import React, { ReactNode, memo } from 'react';
import { Handle, Position, NodeProps, useNodeId, useReactFlow } from '@xyflow/react';
import { cn } from '@/lib/utils';
import { LucideIcon, AlertCircle, AlertTriangle, CheckCircle2, XCircle, Loader2, Thermometer, Target, Tag } from 'lucide-react';
import { useNodeStatus } from '../node-validation-context';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { motion, AnimatePresence } from 'framer-motion';
import { useHorizontalScroll } from '../hooks/use-horizontal-scroll';
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuSeparator,
    ContextMenuShortcut,
    ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Copy, Trash, LogIn, ExternalLink, RefreshCw } from "lucide-react";

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
    outputHandleLabels?: string[];

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
    outputHandleLabels = [],
    hasError = false,
    selected,
    isConnectable,
    data,
}: BaseNodeProps) => {
    const nodeId = useNodeId() || '';
    const nodeStatus = useNodeStatus(nodeId);
    const activeScrollRef = useHorizontalScroll();
    const errorScrollRef = useHorizontalScroll();
    const { deleteElements, getNode, addNodes, getNodes, getEdges } = useReactFlow();

    const handleDelete = () => {
        deleteElements({ nodes: [{ id: nodeId }] });
    };

    const handleDuplicate = () => {
        const nodeToCopy = getNode(nodeId);
        if (!nodeToCopy) return;

        const newNode = {
            ...nodeToCopy,
            id: `${nodeToCopy.type}-${Date.now()}`,
            position: {
                x: nodeToCopy.position.x + 50,
                y: nodeToCopy.position.y + 50,
            },
            selected: true,
        };
        addNodes(newNode);
    };

    const isError = hasError || nodeStatus.state === 'ERROR';
    const isWarning = nodeStatus.state === 'WARNING';
    const isRunning = nodeStatus.state === 'RUNNING';
    const isSuccess = nodeStatus.state === 'SUCCESS';
    const isFailed = nodeStatus.state === 'FAILED';

    return (
        <ContextMenu>
            <ContextMenuTrigger asChild>
                <div className={cn(
                    "relative min-w-[200px] max-w-[240px] group/node transition-all duration-300",
                    data?.isExpanding ? "opacity-0 scale-95 pointer-events-none" : "opacity-100 scale-100 ring-0"
                )}>
                    {/* Input Port */}
                    {showInputHandle && (
                        <ConnectorPort
                            type="target"
                            position={Position.Left}
                            isConnectable={isConnectable}
                            color={accentColor}
                        />
                    )}

                    {/* SCALING WRAPPER FOR UNIFIED DROP-SHADOW */}
                    <div className={cn(
                        "relative w-full h-full transition-all duration-300 ease-out",
                        "group-hover/node:scale-[1.02]",
                        isError ? "drop-shadow-[0_4px_12px_rgba(239,68,68,0.35)]" :
                            isWarning ? "drop-shadow-[0_4px_12px_rgba(249,115,22,0.35)]" :
                                isRunning ? "drop-shadow-[0_4px_12px_rgba(59,130,246,0.35)]" :
                                    isSuccess ? "drop-shadow-[0_4px_12px_rgba(34,197,94,0.35)]" :
                                        isFailed ? "drop-shadow-[0_4px_12px_rgba(185,28,28,0.35)]" :
                                            selected ? "drop-shadow-[0_8px_20px_rgba(99,102,241,0.4)]" :
                                                "drop-shadow-[0_4px_10px_rgba(0,0,0,0.06)] group-hover/node:drop-shadow-[0_8px_16px_rgba(0,0,0,0.08)]"
                    )}>

                        {/* EXTENSÃO DE LEADS (GOTA/HUMP) - Seamless & Minimalist */}
                        {(((data?.activeLeads as number) || 0) > 0 || ((data?.errorLeads as number) || 0) > 0) && (
                            <div
                                className={cn(
                                    "absolute bottom-[calc(100%-1px)] right-6 min-w-[50px] h-[36px] flex items-center justify-center px-1.5 pb-1 pt-2 z-20 transition-colors duration-300 cursor-pointer overflow-visible",
                                    "bg-white border-t border-x rounded-t-[20px]",
                                    isError ? "border-red-400" : isWarning ? "border-orange-400" : isFailed ? "border-red-500" : selected ? "border-indigo-500" : "border-gray-200"
                                )}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const type = ((data?.errorLeads as number) || 0) > 0 ? 'error' : 'active';
                                    if (typeof data?.onViewLeads === 'function') data.onViewLeads(nodeId, type);
                                    else window.dispatchEvent(new CustomEvent('open-node-leads', { detail: { nodeId: nodeId, type } }));
                                }}
                            >
                                {/* Curativo Branco: Este div esconde a borda do nó principal perfeitamente */}
                                <div className="absolute -bottom-[2px] left-0 right-0 h-[4px] bg-white z-[5]" />

                                <div className="relative z-10 flex gap-[2px] items-center w-full justify-center px-1">
                                    {/* ERROR LEADS */}
                                    {((data?.errorLeads as number) || 0) > 0 && (
                                        <div ref={errorScrollRef} className="flex items-center overflow-x-auto no-scrollbar max-w-[124px]" onWheel={(e) => e.stopPropagation()}>
                                            <div className="flex px-1 pb-1"> {/* Padding para não cortar sombras/avatares no overflow */}
                                                <AnimatePresence mode="popLayout">
                                                    {(data?.errorLeadsList as any[] || []).map((lead, idx) => (
                                                        <TooltipProvider key={lead.id} delayDuration={50}>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <motion.div
                                                                        layout
                                                                        initial={{ opacity: 0, scale: 0.5 }}
                                                                        animate={{ opacity: 1, scale: 1 }}
                                                                        exit={{ opacity: 0, scale: 0 }}
                                                                        transition={{ type: 'spring', damping: 15, stiffness: 300 }}
                                                                        className="relative shrink-0 -ml-2 first:ml-0 z-10 hover:z-50 group/avatar"
                                                                        style={{ zIndex: 100 - idx }}
                                                                    >
                                                                        <Avatar className="h-7 w-7 border-[2px] border-white bg-white shadow-sm ring-1 ring-red-100/50 group-hover/avatar:border-red-400 group-hover/avatar:ring-red-400 transition-colors duration-200">
                                                                            <AvatarImage src={lead.profile_picture_url || lead.picture || lead.profilePic || lead.avatar || ''} loading="lazy" />
                                                                            <AvatarFallback className="text-[9px] bg-red-50 text-red-700 font-bold">
                                                                                {lead.name?.substring(0, 2).toUpperCase() || 'ER'}
                                                                            </AvatarFallback>
                                                                        </Avatar>
                                                                    </motion.div>
                                                                </TooltipTrigger>
                                                                <TooltipContent side="top" sideOffset={12} className="p-0 bg-transparent border-none shadow-none z-[300]">
                                                                    <div className="min-w-[160px] bg-white border border-gray-100/80 rounded-[14px] shadow-xl flex flex-col overflow-hidden">
                                                                        <div className="bg-gradient-to-r from-red-50 to-white px-3 py-2.5 border-b border-gray-50/50">
                                                                            <span className="text-gray-900 text-[12px] font-bold block truncate tracking-tight">{lead.name || 'Sem nome'}</span>
                                                                            {lead.phone && <span className="text-gray-500 text-[10px] font-medium block mt-0.5">{lead.phone}</span>}
                                                                        </div>
                                                                        <div className="p-3 bg-white/50">
                                                                            <div className="flex items-center gap-1.5 justify-between">
                                                                                <span className="text-gray-400 text-[9px] font-semibold uppercase tracking-wider">Origem</span>
                                                                                <span className="text-red-600 bg-red-50 px-2 py-0.5 rounded-full text-[9px] font-bold truncate max-w-[90px]">
                                                                                    {lead.source || 'Desconhecida'}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    ))}
                                                </AnimatePresence>
                                            </div>
                                        </div>
                                    )}

                                    {/* ACTIVE LEADS */}
                                    {((data?.activeLeads as number) || 0) > 0 && (
                                        <div ref={activeScrollRef} className="flex items-center overflow-x-auto no-scrollbar max-w-[124px]" onWheel={(e) => e.stopPropagation()}>
                                            <div className="flex px-1 pb-1"> {/* Padding para não cortar sombras/avatares no overflow */}
                                                <AnimatePresence mode="popLayout">
                                                    {(data?.activeLeadsList as any[] || []).map((lead, idx) => (
                                                        <TooltipProvider key={lead.id} delayDuration={50}>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <motion.div
                                                                        layout
                                                                        initial={{ opacity: 0, scale: 0.5 }}
                                                                        animate={{ opacity: 1, scale: 1 }}
                                                                        exit={{ opacity: 0, scale: 0 }}
                                                                        transition={{ type: 'spring', damping: 15, stiffness: 300 }}
                                                                        className="relative shrink-0 -ml-2 first:ml-0 z-10 hover:z-50 group/avatar"
                                                                        style={{ zIndex: 100 - idx }}
                                                                    >
                                                                        <Avatar className="h-7 w-7 border-[2px] border-white bg-white shadow-sm ring-1 ring-black/5 group-hover/avatar:border-indigo-400 group-hover/avatar:ring-indigo-400 transition-colors duration-200">
                                                                            <AvatarImage src={lead.profile_picture_url || lead.picture || lead.profilePic || lead.avatar || ''} loading="lazy" />
                                                                            <AvatarFallback className="text-[9px] bg-blue-50 text-blue-700 font-bold">
                                                                                {lead.name?.substring(0, 2).toUpperCase() || 'U'}
                                                                            </AvatarFallback>
                                                                        </Avatar>
                                                                    </motion.div>
                                                                </TooltipTrigger>
                                                                <TooltipContent side="top" sideOffset={12} className="p-0 bg-transparent border-none shadow-none z-[300]">
                                                                    <div className="min-w-[170px] bg-white border border-gray-100/80 rounded-[14px] shadow-xl flex flex-col overflow-hidden">
                                                                        <div className="bg-gradient-to-r from-indigo-50/70 to-white px-3 py-2.5 border-b border-gray-50/50">
                                                                            <span className="text-gray-900 text-[12px] font-bold block truncate tracking-tight">{lead.name || 'Sem nome'}</span>
                                                                            {lead.phone && <span className="text-gray-500 text-[10px] font-medium block mt-0.5">{lead.phone}</span>}
                                                                        </div>
                                                                        <div className="p-3 bg-white">
                                                                            <div className="flex items-center gap-1.5 justify-between">
                                                                                <span className="text-gray-400 text-[9px] font-semibold uppercase tracking-wider">Origem</span>
                                                                                <span className="text-gray-700 bg-gray-100 px-2 py-0.5 rounded-full text-[9px] font-bold truncate max-w-[90px]">
                                                                                    {lead.source || 'Desconhecida'}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    ))}
                                                </AnimatePresence>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Visual Box (Main node body) */}
                        <div className={cn(
                            "bg-white rounded-[20px] w-full h-full relative z-10 flex flex-col",
                            "border transition-colors duration-300",
                            isError ? "border-red-400" :
                                isWarning ? "border-orange-400" :
                                    isRunning ? "border-blue-400" :
                                        isSuccess ? "border-green-400" :
                                            isFailed ? "border-red-500" :
                                                selected ? "border-indigo-500" : "border-gray-200"
                        )}>
                            {/* Header - Completely white to seamlessly match the hump */}
                            <div className={cn(
                                "px-3 py-2 border-b border-gray-100 rounded-t-[20px] relative overflow-hidden bg-white"
                            )}>
                                <div className="flex items-center gap-2.5 relative z-10">
                                    {/* Minimalist soft icon bubble */}
                                    <div className={cn(
                                        "w-8 h-8 flex items-center justify-center rounded-[10px]",
                                        "bg-gradient-to-br opacity-90",
                                        gradientFrom, gradientTo,
                                        "transition-transform duration-200 group-hover/node:scale-105",
                                        iconColor
                                    )}>
                                        <Icon size={16} strokeWidth={2} />
                                    </div>

                                    {/* Title Block */}
                                    <div className="flex-1 min-w-0 pr-6">
                                        {subtitle && (
                                            <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">
                                                {subtitle}
                                            </p>
                                        )}
                                        <h3 className="text-[13px] font-bold text-gray-900 truncate leading-tight">
                                            {title || 'Untitled'}
                                        </h3>
                                    </div>

                                    {/* Status Icon */}
                                    <div className="flex items-center absolute right-[2px] top-1/2 -translate-y-1/2">
                                        {isError && nodeStatus.errors.length > 0 && (
                                            <TooltipProvider delayDuration={0}>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <AlertCircle className="w-5 h-5 text-red-500 cursor-pointer animate-pulse" />
                                                    </TooltipTrigger>
                                                    <TooltipContent side="top" className="bg-red-50 border-red-200 text-red-700 font-medium z-[100]">
                                                        {nodeStatus.errors.map((e: any, i: number) => <div key={i} className="py-0.5">• {e}</div>)}
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        )}
                                        {isWarning && !isError && nodeStatus.warnings.length > 0 && (
                                            <TooltipProvider delayDuration={0}>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <AlertTriangle className="w-5 h-5 text-orange-500 cursor-pointer" />
                                                    </TooltipTrigger>
                                                    <TooltipContent side="top" className="bg-orange-50 border-orange-200 text-orange-700 font-medium z-[100]">
                                                        {nodeStatus.warnings.map((e: any, i: number) => <div key={i} className="py-0.5">• {e}</div>)}
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        )}
                                        {isRunning && (
                                            <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                                        )}
                                        {isSuccess && (
                                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                                        )}
                                        {isFailed && (
                                            <XCircle className="w-4 h-4 text-red-700" />
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Content Body */}
                            {children && (
                                <div className="px-3 py-2 bg-white rounded-b-[20px]">
                                    {children}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Output Port(s) */}
                    {showOutputHandle && outputHandleCount === 1 && (
                        <ConnectorPort
                            type="source"
                            position={Position.Right}
                            isConnectable={isConnectable}
                            color={accentColor}
                        />
                    )}

                    {/* Output Port(s) - Multiple */}
                    {showOutputHandle && outputHandleCount > 1 && (
                        <div className="flex flex-col gap-1.5 px-3 py-2 border-t border-gray-100 bg-gray-50/30 rounded-b-2xl">
                            {Array.from({ length: outputHandleCount }).map((_, i: number) => (
                                <div key={i} className="flex justify-between items-center bg-white border border-gray-100 rounded-lg p-1.5 relative group/handle hover:bg-gray-50 transition-colors shadow-sm">
                                    <span className="text-[10px] text-gray-500 font-medium pl-1 truncate select-none">
                                        {outputHandleLabels?.[i] || `Regra ${i + 1}`}
                                    </span>
                                    <div className="relative w-3 h-3 flex items-center justify-center">
                                        <ConnectorPort
                                            type="source"
                                            position={Position.Right}
                                            isConnectable={isConnectable}
                                            color={accentColor}
                                            id={`output-${i + 1}`}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </ContextMenuTrigger>
            <ContextMenuContent className="w-64">
                <ContextMenuItem onClick={handleDuplicate} className="gap-2 cursor-pointer">
                    <Copy className="h-4 w-4" />
                    <span>Duplicar Nó</span>
                    <ContextMenuShortcut>Ctrl+D</ContextMenuShortcut>
                </ContextMenuItem>

                <ContextMenuSeparator />

                <ContextMenuItem onClick={handleDelete} className="gap-2 text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer">
                    <Trash className="h-4 w-4" />
                    <span>Excluir Nó</span>
                    <ContextMenuShortcut>Del</ContextMenuShortcut>
                </ContextMenuItem>
            </ContextMenuContent>
        </ContextMenu>
    );
});

export default BaseNode;

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
