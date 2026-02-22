'use client';

import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Users, AlertCircle, Bot, Zap, GitBranch, Thermometer, Target, Tag } from 'lucide-react';
import { Node } from '@xyflow/react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface NodeLeadsSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    node: Node | null;
    leadsType: 'active' | 'error';
}

const ICONS: Record<string, any> = {
    trigger: Zap,
    agent: Bot,
    agentic: Bot,
    logic: GitBranch,
};

export function NodeLeadsSidebar({ isOpen, onClose, node, leadsType }: NodeLeadsSidebarProps) {
    if (!node) return null;

    const Icon = ICONS[node.type || ''] || Users;

    // Fallback securely to empty arrays
    const isError = leadsType === 'error';
    const leadsList = isError
        ? (node.data?.errorLeadsList as any[] || [])
        : (node.data?.activeLeadsList as any[] || []);

    const totalCount = isError
        ? (node.data?.errorLeads as number || 0)
        : (node.data?.activeLeads as number || 0);

    return (
        <Sheet open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
            <SheetContent
                side="right"
                className={cn(
                    "w-[400px] sm:max-w-[400px] p-0 flex flex-col",
                    isError ? "border-l-4 border-red-500" : "border-l-4 border-blue-500"
                )}
            >
                {/* ── Header ── */}
                <SheetHeader className={cn(
                    "px-5 py-6 border-b border-gray-100",
                    isError ? "bg-red-50" : "bg-blue-50"
                )}>
                    <div className="flex items-center gap-3">
                        <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center shadow-sm",
                            isError ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"
                        )}>
                            {isError ? <AlertCircle size={20} /> : <Users size={20} />}
                        </div>
                        <div className="flex-1 min-w-0">
                            <SheetTitle className="text-sm font-bold truncate">
                                {isError ? 'Falhas no Nó' : 'Leads Ativos no Nó'}
                            </SheetTitle>
                            <SheetDescription className="text-xs font-semibold mt-0.5">
                                <span className="flex items-center gap-1.5 text-gray-600">
                                    <Icon size={12} />
                                    {(node.data?.label as string) || (node.data?.agentName as string) || 'Passo do Fluxo'}
                                </span>
                            </SheetDescription>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            className="text-xs h-7 shrink-0 border-gray-200"
                            onClick={() => {
                                onClose();
                                window.dispatchEvent(new CustomEvent('open-node-config', { detail: { nodeId: node.id } }));
                            }}
                        >
                            Configurar
                        </Button>
                    </div>
                </SheetHeader>

                {/* ── Summary Stats ── */}
                <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex justify-between items-center shrink-0">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                        Total {isError ? 'Ocorridas' : 'Passando'}
                    </span>
                    <div className={cn(
                        "px-2.5 py-0.5 rounded-full text-xs font-bold",
                        isError ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
                    )}>
                        {totalCount} {totalCount === 1 ? 'Lead' : 'Leads'}
                    </div>
                </div>

                {/* ── Leads List ── */}
                <ScrollArea className="flex-1 p-5">
                    {leadsList.length === 0 ? (
                        <div className="flex flex-col items-center justify-center text-center py-12 px-4">
                            <div className={cn(
                                "w-12 h-12 rounded-full flex items-center justify-center mb-3",
                                isError ? "bg-red-50 text-red-300" : "bg-blue-50 text-blue-300"
                            )}>
                                {isError ? <AlertCircle size={24} /> : <Users size={24} />}
                            </div>
                            <p className="text-sm font-medium text-gray-500">
                                Nenhum lead recente encontrado.
                            </p>
                            {totalCount > 0 && (
                                <p className="text-xs text-gray-400 mt-2">
                                    Existem {totalCount} leads listados, mas os dados do perfil não estão mais no buffer em tempo real.
                                </p>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <AnimatePresence>
                                {leadsList.map((lead, index) => (
                                    <motion.div
                                        key={lead.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ delay: index * 0.05 }}
                                        className={cn(
                                            "flex items-center gap-3 p-3 rounded-xl border bg-white shadow-sm transition-hover hover:border-gray-300",
                                            isError ? "border-red-100" : "border-gray-100"
                                        )}
                                    >
                                        <Avatar className="h-10 w-10 border shadow-sm shrink-0">
                                            <AvatarImage src={lead.profile_picture_url || lead.picture || lead.profilePic || lead.avatar || ''} />
                                            <AvatarFallback className={cn(
                                                "text-xs font-bold",
                                                isError ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"
                                            )}>
                                                {lead.name?.substring(0, 2).toUpperCase() || 'U'}
                                            </AvatarFallback>
                                        </Avatar>

                                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                                            <p className="text-sm font-bold text-gray-900 truncate">
                                                {lead.name || 'Usuário Desconhecido'}
                                            </p>
                                            <p className="text-[11px] font-medium text-gray-500 truncate mt-0.5">
                                                {lead.phone || lead.id || 'Sem telefone'}
                                            </p>

                                            {/* Slots Coletados */}
                                            {lead.slots && Object.keys(lead.slots).length > 0 && (
                                                <div className="flex flex-wrap gap-1 mt-2">
                                                    {Object.entries(lead.slots).map(([key, value]) => (
                                                        <span key={key} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 uppercase tracking-wider">
                                                            <Tag size={8} />
                                                            {key}: {String(value)}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Indicadores IA (Sentiment & Intent) */}
                                            {(lead.sentiment > 0 || lead.intentScore > 0) && (
                                                <div className="flex gap-3 mt-2 border-t border-gray-50 pt-2">
                                                    <div className="flex items-center gap-1 text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded text-[10px] font-bold border border-orange-100">
                                                        <Thermometer size={10} />
                                                        Sentimento: {((lead.sentiment || 0) * 100).toFixed(0)}%
                                                    </div>
                                                    <div className="flex items-center gap-1 text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded text-[10px] font-bold border border-blue-100">
                                                        <Target size={10} />
                                                        Intenção: {((lead.intentScore || 0) * 100).toFixed(0)}%
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>

                            {totalCount > leadsList.length && (
                                <div className="text-center py-4">
                                    <span className="text-xs font-bold text-gray-400 tracking-wider">
                                        + {totalCount - leadsList.length} OUTROS LEADS
                                    </span>
                                </div>
                            )}
                        </div>
                    )}
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
}
