'use client'

import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Node, Edge, useReactFlow } from '@xyflow/react';
import { X, Save, Zap, Clock, GitBranch, MessageSquare, CornerUpRight, ExternalLink, Users, Flag, Bot, Split, RefreshCw, MessageSquareText, AlertCircle, Thermometer, Target, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { Agent } from '@/services/agentService';


// Import all configurations directly
import {
    TriggerConfig, DelayConfig, SplitConfig, ActionConfig,
    BroadcastConfig, LogicConfig, GotoConfig, GotoCampaignConfig,
    HandoffConfig, ClosingConfig, AgentConfig, ChatbotConfig
} from './node-configs';
import { FollowUpConfig } from './node-configs/followup-config';
import { AgentWizard } from './node-configs/agent-wizard';

const AGENT_TYPES = ['agent', 'agentic'];

const NODE_META: Record<string, { icon: React.ElementType; color: string; bgColor: string; label: string }> = {
    trigger: { icon: Zap, color: 'text-amber-600', bgColor: 'bg-amber-50', label: 'Gatilho Inicial' },
    delay: { icon: Clock, color: 'text-amber-600', bgColor: 'bg-amber-50', label: 'Delay' },
    split: { icon: Split, color: 'text-pink-600', bgColor: 'bg-pink-50', label: 'Split A/B' },
    action: { icon: MessageSquare, color: 'text-blue-600', bgColor: 'bg-blue-50', label: 'Ação' },
    broadcast: { icon: MessageSquare, color: 'text-sky-600', bgColor: 'bg-sky-50', label: 'Broadcast' },
    logic: { icon: GitBranch, color: 'text-slate-600', bgColor: 'bg-slate-50', label: 'Condição IF/ELSE' },
    goto: { icon: CornerUpRight, color: 'text-cyan-600', bgColor: 'bg-cyan-50', label: 'Goto' },
    goto_campaign: { icon: ExternalLink, color: 'text-indigo-600', bgColor: 'bg-indigo-50', label: 'Ir para Campanha' },
    handoff: { icon: Users, color: 'text-rose-600', bgColor: 'bg-rose-50', label: 'Transbordo' },
    closing: { icon: Flag, color: 'text-red-600', bgColor: 'bg-red-50', label: 'Fechamento' },
    chatbot: { icon: MessageSquareText, color: 'text-rose-600', bgColor: 'bg-rose-50', label: 'Chatbot Determinístico' },
    agent: { icon: Bot, color: 'text-purple-600', bgColor: 'bg-purple-50', label: 'Agente IA' },
    agentic: { icon: Bot, color: 'text-purple-600', bgColor: 'bg-purple-50', label: 'Agente IA' },
    followup: { icon: RefreshCw, color: 'text-teal-600', bgColor: 'bg-teal-50', label: 'Follow-Up' },
};

export interface NodeExpansionOverlayProps {
    node: Node | null;
    nodes: Node[];
    edges: Edge[];
    htmlElement: HTMLElement | null; // The DOM element of the node to extract coordinates
    onClose: () => void;
    onUpdateNode: (id: string, data: any) => void;
    // Data sources that used to be fetched inside the Sheet
    sessions: any[];
    agents: Agent[];
    campaigns: any[];
    onRefreshAgents: () => void;
}

export function NodeExpansionOverlay({
    node,
    nodes,
    edges,
    htmlElement,
    onClose,
    onUpdateNode,
    sessions,
    agents,
    campaigns,
    onRefreshAgents
}: NodeExpansionOverlayProps) {
    const [sourceRect, setSourceRect] = useState<DOMRect | null>(null);
    const [isAnimatingOut, setIsAnimatingOut] = useState(false);
    const [formData, setFormData] = useState<any>({});
    const overlayRef = useRef<HTMLDivElement>(null);

    // Sync formData when node changes
    useEffect(() => {
        if (node) {
            setFormData({ ...node.data });
        }
    }, [node?.id, node?.data]);

    // Capture starting position metrics instantly before rendering the flying card
    useLayoutEffect(() => {
        if (node && htmlElement && !isAnimatingOut) {
            const rect = htmlElement.getBoundingClientRect();
            setSourceRect(rect);
        } else if (!node) {
            setSourceRect(null);
            setIsAnimatingOut(false);
        }
    }, [node, htmlElement]);

    const handleClose = () => {
        setIsAnimatingOut(true);
        // Slightly delay the actual destruction so the reverse animation plays
        setTimeout(() => {
            onClose();
        }, 500); // Matches the framer motion transition
    };

    const handleChange = (key: string, value: any) => {
        setFormData((prev: any) => {
            const next = { ...prev, [key]: value };
            if (node) onUpdateNode(node.id, next);
            return next;
        });
    };

    if (!node || !sourceRect) return null;

    const type = node.type || '';
    const meta = NODE_META[type] || { icon: Zap, color: 'text-gray-600', bgColor: 'bg-gray-50', label: type };
    const MetaIcon = meta.icon;
    const isAgentType = AGENT_TYPES.includes(type);

    const renderGenericContent = () => {
        switch (type) {
            case 'trigger': return <TriggerConfig formData={formData} onChange={handleChange} sessions={sessions} />;
            case 'delay': return <DelayConfig formData={formData} onChange={handleChange} />;
            case 'split': return <SplitConfig formData={formData} onChange={handleChange} />;
            case 'action': return <ActionConfig formData={formData} onChange={handleChange} />;
            case 'broadcast': return <BroadcastConfig formData={formData} onChange={handleChange} />;
            case 'chatbot': return <ChatbotConfig formData={formData} onChange={handleChange} />;
            case 'logic': return <LogicConfig formData={formData} onChange={handleChange} />;
            case 'goto': return <GotoConfig formData={formData} onChange={handleChange} />;
            case 'goto_campaign': return <GotoCampaignConfig formData={formData} onChange={handleChange} campaigns={campaigns} />;
            case 'handoff': return <HandoffConfig formData={formData} onChange={handleChange} campaigns={campaigns} />;
            case 'closing': return <ClosingConfig formData={formData} onChange={handleChange} />;
            case 'followup': return <FollowUpConfig formData={formData} onChange={handleChange} />;
            default:
                return (
                    <div className="text-center py-12 text-gray-400">
                        <p className="text-sm">Configuração não disponível para "{type}"</p>
                    </div>
                );
        }
    };

    return (
        <AnimatePresence>
            {!isAnimatingOut && (
                <div className="fixed inset-0 z-40 flex items-center justify-center pointer-events-auto">
                    {/* Backdrop - Blur & Isolation Effect */}
                    <motion.div
                        initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                        animate={{ opacity: 1, backdropFilter: 'blur(12px)' }}
                        exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                        transition={{ duration: 0.4, ease: "easeInOut" }}
                        className="absolute inset-0 bg-slate-900/20"
                        onClick={handleClose}
                    />

                    {/* Shared Element (The expanding Node itself) */}
                    <motion.div
                        ref={overlayRef}
                        initial={{
                            // START: Exactly match the original Node physical dimensions and screen position
                            position: 'absolute',
                            top: sourceRect.top,
                            left: sourceRect.left,
                            width: sourceRect.width,
                            height: sourceRect.height,
                            borderRadius: 20,
                            opacity: 1,
                            scale: 1,
                        }}
                        animate={{
                            // END: Expand to center as a large modal
                            top: 'max(10vh, calc(50% - 300px))', // roughly center with top margin limits
                            left: 'calc(50% - 300px)', // half of target width (600)
                            width: 600, // Target Modal Width
                            height: isAgentType ? '85vh' : 'auto', // dynamic based on content
                            maxHeight: '85vh',
                            borderRadius: 24,
                            scale: 1,
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255,255,255,0.1)',
                        }}
                        exit={{
                            // REVERSE: Shrink back to the node position
                            top: sourceRect.top,
                            left: sourceRect.left,
                            width: sourceRect.width,
                            height: sourceRect.height,
                            borderRadius: 20,
                            opacity: 0, // fade out right at the end to hand back visual to base-node
                            transition: { duration: 0.4, ease: [0.32, 0.72, 0, 1] }
                        }}
                        transition={{
                            // Spring for the wow effect (Smooth, slightly bouncy organically)
                            type: "spring",
                            stiffness: 260,
                            damping: 25,
                            mass: 1.2,
                        }}
                        className="bg-white/95 backdrop-blur-3xl overflow-hidden flex flex-col shadow-2xl relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* ── HEADER MORPH ── */}
                        <motion.div
                            className={cn(
                                "flex-shrink-0 px-5 py-4 flex items-center justify-between border-b border-gray-100",
                                meta.bgColor
                            )}
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15, duration: 0.3 }}
                        >
                            <div className="flex items-center gap-3">
                                <div className={cn("w-10 h-10 rounded-[12px] flex items-center justify-center shadow-sm bg-white", meta.color)}>
                                    <MetaIcon size={20} strokeWidth={2.5} />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-gray-900 leading-tight">
                                        {formData.label || meta.label}
                                    </h2>
                                    <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                                        Configuração do Nó
                                    </p>
                                </div>
                            </div>

                            <Button variant="ghost" size="icon" onClick={handleClose} className="rounded-full bg-white/50 hover:bg-white shrink-0">
                                <X size={18} className="text-gray-500" />
                            </Button>
                        </motion.div>

                        {/* ── BODY SEAMLESS FADE-IN ── */}
                        <motion.div
                            className="flex-1 min-h-0 relative flex flex-col"
                            initial={{ opacity: 0, filter: 'blur(4px)' }}
                            animate={{ opacity: 1, filter: 'blur(0px)' }}
                            transition={{ delay: 0.2, duration: 0.3 }}
                        >
                            <Tabs defaultValue="config" className="flex-1 flex flex-col h-full">
                                <div className="px-6 py-2 border-b border-gray-100 bg-gray-50/50">
                                    <TabsList className="bg-transparent h-fit p-0 gap-6">
                                        <TabsTrigger
                                            value="config"
                                            className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none px-0 py-2 text-sm font-semibold text-gray-500 transition-all"
                                        >
                                            <div className="flex items-center gap-2">
                                                <RefreshCw size={14} />
                                                Configuração
                                            </div>
                                        </TabsTrigger>
                                        <TabsTrigger
                                            value="leads"
                                            className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none px-0 py-2 text-sm font-semibold text-gray-500 transition-all"
                                        >
                                            <div className="flex items-center gap-2">
                                                <Users size={14} />
                                                Monitor de Leads
                                            </div>
                                        </TabsTrigger>
                                    </TabsList>
                                </div>

                                <TabsContent value="config" className="flex-1 min-h-0 m-0 focus-visible:ring-0">
                                    <ScrollArea className="h-full max-h-[calc(85vh-190px)]">
                                        {isAgentType ? (
                                            <div className="h-full">
                                                <AgentWizard
                                                    formData={formData}
                                                    onChange={handleChange}
                                                    agents={agents}
                                                    onAgentsChange={onRefreshAgents}
                                                />
                                            </div>
                                        ) : (
                                            <div className="p-6">
                                                {renderGenericContent()}
                                            </div>
                                        )}
                                    </ScrollArea>
                                </TabsContent>

                                <TabsContent value="leads" className="flex-1 min-h-0 m-0 focus-visible:ring-0 flex flex-col">
                                    <ScrollArea className="flex-1 max-h-[calc(85vh-190px)]">
                                        <div className="p-6">
                                            {/* Summary Stats */}
                                            <div className="flex gap-4 mb-6">
                                                <div className="flex-1 p-4 rounded-2xl bg-blue-50/50 border border-blue-100">
                                                    <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1">Passando</p>
                                                    <p className="text-2xl font-black text-blue-900">{Number(node.data?.activeLeads) || 0}</p>
                                                </div>
                                                <div className="flex-1 p-4 rounded-2xl bg-red-50/50 border border-red-100">
                                                    <p className="text-[10px] font-bold text-red-600 uppercase tracking-widest mb-1">Falhas</p>
                                                    <p className="text-2xl font-black text-red-900">{Number(node.data?.errorLeads) || 0}</p>
                                                </div>
                                            </div>

                                            {/* Leads List */}
                                            {((node.data?.activeLeadsList as any[])?.length || 0) === 0 && ((node.data?.errorLeadsList as any[])?.length || 0) === 0 ? (
                                                <div className="text-center py-12">
                                                    <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-3 text-gray-300">
                                                        <Users size={24} />
                                                    </div>
                                                    <p className="text-sm font-medium text-gray-500">Nenhum lead registrado neste nó</p>
                                                </div>
                                            ) : (
                                                <div className="space-y-6">
                                                    {/* Error Leads */}
                                                    {((node.data?.errorLeadsList as any[])?.length || 0) > 0 && (
                                                        <div className="space-y-3">
                                                            <h4 className="text-xs font-bold text-red-600 uppercase tracking-widest flex items-center gap-2">
                                                                <AlertCircle size={14} />
                                                                Falhas Recentes
                                                            </h4>
                                                            <div className="space-y-2">
                                                                {(node.data?.errorLeadsList as any[]).map((lead, i) => (
                                                                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-red-100 bg-red-50/30">
                                                                        <Avatar className="h-8 w-8 border-2 border-white shadow-sm">
                                                                            <AvatarImage src={lead.profile_picture_url || lead.picture || ''} />
                                                                            <AvatarFallback className="bg-red-100 text-red-600 text-[10px] font-bold">
                                                                                {lead.name?.substring(0, 2).toUpperCase() || 'U'}
                                                                            </AvatarFallback>
                                                                        </Avatar>
                                                                        <div className="flex-1 min-w-0">
                                                                            <p className="text-xs font-bold text-gray-900 truncate">{lead.name || 'Usuário'}</p>
                                                                            <p className="text-[10px] text-gray-500 truncate">{lead.phone || lead.id}</p>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Active Leads */}
                                                    {((node.data?.activeLeadsList as any[])?.length || 0) > 0 && (
                                                        <div className="space-y-3">
                                                            <h4 className="text-xs font-bold text-blue-600 uppercase tracking-widest flex items-center gap-2">
                                                                <Users size={14} />
                                                                Leads no Nó
                                                            </h4>
                                                            <div className="space-y-2">
                                                                {(node.data?.activeLeadsList as any[]).map((lead, i) => (
                                                                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 bg-white shadow-sm">
                                                                        <Avatar className="h-8 w-8 border-2 border-white shadow-sm">
                                                                            <AvatarImage src={lead.profile_picture_url || lead.picture || ''} />
                                                                            <AvatarFallback className="bg-blue-50 text-blue-600 text-[10px] font-bold">
                                                                                {lead.name?.substring(0, 2).toUpperCase() || 'U'}
                                                                            </AvatarFallback>
                                                                        </Avatar>
                                                                        <div className="flex-1 min-w-0">
                                                                            <div className="flex items-center justify-between gap-2">
                                                                                <p className="text-xs font-bold text-gray-900 truncate">{lead.name || 'Usuário'}</p>
                                                                                {lead.intentScore > 0 && (
                                                                                    <span className="text-[9px] font-black bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-100 uppercase">
                                                                                        {((lead.intentScore || 0) * 100).toFixed(0)}% Intenção
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                            <p className="text-[10px] text-gray-500 truncate">{lead.phone || lead.id}</p>
                                                                            {lead.slots && Object.keys(lead.slots).length > 0 && (
                                                                                <div className="flex flex-wrap gap-1 mt-1.5 pt-1.5 border-t border-gray-50">
                                                                                    {Object.entries(lead.slots).map(([k, v]) => (
                                                                                        <span key={k} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-black bg-indigo-50 text-indigo-700 border border-indigo-100 uppercase tracking-wider">
                                                                                            <Tag size={8} /> {k}: {String(v)}
                                                                                        </span>
                                                                                    ))}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </ScrollArea>
                                </TabsContent>
                            </Tabs>
                        </motion.div>

                        {/* ── FLOATING ACTION FOOTER ── */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3, duration: 0.3 }}
                            className="p-4 border-t border-gray-100 bg-white/50 backdrop-blur-xl flex justify-end gap-2"
                        >
                            <Button variant="ghost" onClick={handleClose} className="rounded-xl text-gray-500 hover:text-gray-900">
                                Cancelar
                            </Button>
                            <Button onClick={handleClose} className="rounded-xl shadow-sm bg-gray-900 hover:bg-black text-white px-6">
                                Pronto
                            </Button>
                        </motion.div>

                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
