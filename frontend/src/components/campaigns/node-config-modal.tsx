import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    X, Zap, Clock, GitBranch, MessageSquare, CornerUpRight, ExternalLink, Users, Flag, Bot, Brain,
    Split, CheckCircle, Filter, ArrowLeft, ArrowRight, MousePointer2
} from 'lucide-react';
import { Node, Edge } from '@xyflow/react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { wahaService } from '@/services/waha';
import { agentService, Agent } from '@/services/agentService';
import { campaignService } from '@/services/campaign';
import {
    TriggerConfig, DelayConfig, SplitConfig, ActionConfig,
    LogicConfig, GotoConfig, GotoCampaignConfig, HandoffConfig,
    ClosingConfig, AgentConfig
} from './node-configs';

interface NodeConfigModalProps {
    selectedNode: Node | null;
    onClose: () => void;
    onUpdateNode: (id: string, data: any) => void;
    nodes: Node[];
    edges: Edge[];
    onNavigate: (nodeId: string) => void;
}

const NODE_META: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
    trigger: { icon: <Zap className="w-5 h-5" />, color: 'text-emerald-600 bg-emerald-50', label: 'Entrada de Leads' },
    delay: { icon: <Clock className="w-5 h-5" />, color: 'text-amber-600 bg-amber-50', label: 'Delay' },
    split: { icon: <Split className="w-5 h-5" />, color: 'text-pink-600 bg-pink-50', label: 'Split A/B' },
    action: { icon: <MessageSquare className="w-5 h-5" />, color: 'text-sky-600 bg-sky-50', label: 'Ação' },
    broadcast: { icon: <MessageSquare className="w-5 h-5" />, color: 'text-sky-600 bg-sky-50', label: 'Broadcast' },
    logic: { icon: <GitBranch className="w-5 h-5" />, color: 'text-slate-600 bg-slate-50', label: 'Logic Router' },
    goto: { icon: <CornerUpRight className="w-5 h-5" />, color: 'text-cyan-600 bg-cyan-50', label: 'Goto' },
    goto_campaign: { icon: <ExternalLink className="w-5 h-5" />, color: 'text-indigo-600 bg-indigo-50', label: 'Ir para Campanha' },
    handoff: { icon: <Users className="w-5 h-5" />, color: 'text-rose-600 bg-rose-50', label: 'Transbordo' },
    closing: { icon: <Flag className="w-5 h-5" />, color: 'text-red-600 bg-red-50', label: 'Fechamento' },
    agent: { icon: <Bot className="w-5 h-5" />, color: 'text-purple-600 bg-purple-50', label: 'Agente IA' },
    agentic: { icon: <Bot className="w-5 h-5" />, color: 'text-purple-600 bg-purple-50', label: 'Agente IA' },
};

const AGENT_TYPES = ['agent', 'agentic'];

export function NodeConfigModal({ selectedNode, onClose, onUpdateNode, nodes, edges, onNavigate }: NodeConfigModalProps) {
    const [formData, setFormData] = useState<any>({});
    const [sessions, setSessions] = useState<any[]>([]);
    const [agents, setAgents] = useState<Agent[]>([]);
    const [campaigns, setCampaigns] = useState<any[]>([]);

    const type = selectedNode?.type || '';
    const meta = NODE_META[type] || { icon: <Zap className="w-5 h-5" />, color: 'text-gray-600 bg-gray-50', label: type };

    // Load form data from node
    useEffect(() => {
        if (selectedNode) {
            setFormData({ ...selectedNode.data });
        }
    }, [selectedNode?.id]);

    // Load sessions for trigger nodes
    useEffect(() => {
        if (type === 'trigger') {
            wahaService.getSessions().then(setSessions).catch(() => setSessions([]));
        }
    }, [type]);

    // Load agents for agent-type nodes
    useEffect(() => {
        if (AGENT_TYPES.includes(type)) {
            agentService.list().then(setAgents).catch(() => setAgents([]));
        }
    }, [type]);

    // Load campaigns for goto_campaign & handoff
    useEffect(() => {
        if (type === 'goto_campaign' || type === 'handoff') {
            campaignService.listCampaigns().then((r: any) => setCampaigns(Array.isArray(r) ? r : r.data || [])).catch(() => setCampaigns([]));
        }
    }, [type]);

    const handleChange = useCallback((key: string, value: any) => {
        setFormData((prev: any) => {
            const next = { ...prev, [key]: value };
            if (selectedNode) onUpdateNode(selectedNode.id, next);
            return next;
        });
    }, [selectedNode, onUpdateNode]);

    const refreshAgents = useCallback(() => {
        agentService.list().then(setAgents).catch(() => { });
    }, []);

    const [direction, setDirection] = useState(0);

    const handleNavigate = (nodeId: string, dir: number) => {
        setDirection(dir);
        onNavigate(nodeId);
    };

    const variants = {
        enter: (direction: number) => ({
            x: direction > 0 ? 500 : -500,
            opacity: 0,
            scale: 0.9,
            position: 'absolute' as any // Prevent layout shift during overlap
        }),
        center: {
            zIndex: 1,
            x: 0,
            opacity: 1,
            scale: 1,
            position: 'relative' as any
        },
        exit: (direction: number) => ({
            zIndex: 0,
            x: direction < 0 ? 500 : -500,
            opacity: 0,
            scale: 0.9,
            position: 'absolute' as any
        })
    };

    // Calculate connected nodes (Memoized)
    const connectedNodes = useMemo(() => {
        if (!selectedNode) return { incoming: [], outgoing: [] };

        const incomingEdges = edges.filter(e => e.target === selectedNode.id);
        const outgoingEdges = edges.filter(e => e.source === selectedNode.id);

        const incoming = incomingEdges.map(e => nodes.find(n => n.id === e.source)).filter(Boolean) as Node[];
        const outgoing = outgoingEdges.map(e => nodes.find(n => n.id === e.target)).filter(Boolean) as Node[];

        return { incoming, outgoing };
    }, [selectedNode, edges, nodes]);

    if (!selectedNode) return null;

    const renderContent = () => {
        switch (type) {
            case 'trigger':
                return <TriggerConfig formData={formData} onChange={handleChange} sessions={sessions} />;
            case 'delay':
                return <DelayConfig formData={formData} onChange={handleChange} />;
            case 'split':
                return <SplitConfig formData={formData} onChange={handleChange} />;
            case 'action':
            case 'broadcast':
                return <ActionConfig formData={formData} onChange={handleChange} />;
            case 'logic':
                return <LogicConfig />;
            case 'goto':
                return <GotoConfig formData={formData} onChange={handleChange} />;
            case 'goto_campaign':
                return <GotoCampaignConfig formData={formData} onChange={handleChange} campaigns={campaigns} />;
            case 'handoff':
                return <HandoffConfig formData={formData} onChange={handleChange} campaigns={campaigns} />;
            case 'closing':
                return <ClosingConfig formData={formData} onChange={handleChange} />;
            case 'agent':
            case 'agentic':
                return <AgentConfig formData={formData} onChange={handleChange} agents={agents} onAgentsChange={refreshAgents} />;
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
            {selectedNode && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        key="backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={onClose}
                        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
                    />

                    {/* CAROUSEL CONTAINER */}
                    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none overflow-hidden">

                        {/* THE NAVIGATION TRACK */}
                        <motion.div
                            className="flex items-center justify-center gap-8 w-full perspective-1000"
                            initial={false}
                            animate={{ x: 0 }} // Center based on selection (handled by key prop)
                        >
                            <AnimatePresence mode="popLayout" custom={direction}>
                                {/* PREVIOUS NODE (Left Slot) */}
                                {connectedNodes.incoming.length > 0 ? (
                                    <motion.div
                                        key={`prev-${connectedNodes.incoming[0].id}`}
                                        className="w-[500px] h-[80vh] shrink-0 opacity-40 scale-90 pointer-events-auto cursor-pointer hover:opacity-60 hover:scale-95 transition-all duration-300 hidden xl:block"
                                        onClick={() => handleNavigate(connectedNodes.incoming[0].id, -1)}
                                        initial={{ x: -100, opacity: 0 }}
                                        animate={{ x: 0, opacity: 0.4, scale: 0.9 }}
                                        exit={{ x: -100, opacity: 0 }}
                                        layout
                                    >
                                        {/* Render a "Read-Only" version of the panel */}
                                        <div className="bg-white rounded-3xl shadow-xl w-full h-full border border-gray-200 overflow-hidden flex flex-col relative select-none">
                                            <div className="absolute inset-0 z-10 bg-white/10" /> {/* Overlay */}
                                            {/* Header Replica */}
                                            <div className="px-8 py-5 border-b border-gray-100 bg-white flex items-center gap-4">
                                                <div className={`p-3 rounded-2xl ${NODE_META[connectedNodes.incoming[0]?.type || 'default']?.color || 'bg-gray-100 text-gray-500'}`}>
                                                    {NODE_META[connectedNodes.incoming[0]?.type || 'default']?.icon || <Zap className="w-5 h-5" />}
                                                </div>
                                                <div>
                                                    <h2 className="font-bold text-gray-900 text-lg">{NODE_META[connectedNodes.incoming[0]?.type || 'default']?.label || connectedNodes.incoming[0]?.type}</h2>
                                                    <p className="text-[11px] text-gray-400 uppercase tracking-widest font-bold">ANTERIOR</p>
                                                </div>
                                            </div>
                                            <div className="p-8 text-gray-400 text-center mt-20">
                                                <ArrowLeft className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                                <p className="text-lg font-medium">Clique para editar</p>
                                            </div>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <div className="w-[500px] hidden xl:block" /> // Spacer
                                )}

                                {/* CURRENT ACTIVE NODE (Center) */}
                                <motion.div
                                    key={selectedNode.id}
                                    custom={direction}
                                    variants={variants}
                                    initial="enter"
                                    animate="center"
                                    exit="exit"
                                    transition={{
                                        x: { type: "spring", stiffness: 300, damping: 30 },
                                        opacity: { duration: 0.2 },
                                        scale: { duration: 0.2 }
                                    }}
                                    className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl h-[90vh] flex flex-col pointer-events-auto border border-gray-200/80 overflow-hidden relative z-20 shrink-0"
                                >
                                    {/* Header */}
                                    <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100 bg-white z-20">
                                        <div className="flex items-center gap-4">
                                            <div className={`p-3 rounded-2xl ${meta.color} shadow-sm`}>
                                                {meta.icon}
                                            </div>
                                            <div>
                                                <h2 className="font-bold text-gray-900 text-lg tracking-tight">{meta.label}</h2>
                                                <span className="flex items-center gap-2 mt-0.5">
                                                    <span className="relative flex h-2 w-2">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                                    </span>
                                                    <p className="text-[11px] text-gray-400 uppercase tracking-widest font-bold">{type?.replace('_', ' ')}</p>
                                                </span>
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={onClose}
                                            className="h-10 w-10 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-900 transition-colors"
                                        >
                                            <X className="h-5 w-5" />
                                        </Button>
                                    </div>

                                    {/* Label Field */}
                                    <div className="px-8 py-4 border-b border-gray-50 bg-gray-50/30 group hover:bg-gray-50 transition-colors z-20">
                                        <div className="flex items-center gap-4">
                                            <Label className="text-[10px] text-gray-400 whitespace-nowrap font-bold tracking-widest pl-1">LABEL</Label>
                                            <Input
                                                value={formData.label || ''}
                                                onChange={(e) => handleChange('label', e.target.value)}
                                                placeholder="Nomeie este passo..."
                                                className="h-9 text-base border-0 border-b border-transparent group-hover:border-gray-200 focus:border-indigo-500 rounded-none bg-transparent px-2 font-medium transition-all focus:ring-0 placeholder:text-gray-300"
                                            />
                                        </div>
                                    </div>

                                    {/* Content Scroll Area */}
                                    <div className="flex-1 overflow-y-auto p-8 scrollbar-thin scrollbar-thumb-gray-200 hover:scrollbar-thumb-gray-300 bg-white z-0">
                                        {renderContent()}
                                    </div>

                                    {/* Footer Status */}
                                    <div className="px-8 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between z-20">
                                        <div className="flex items-center gap-2.5">
                                            <div className="bg-white p-1.5 rounded-lg border border-gray-100 shadow-sm">
                                                <Bot size={14} className="text-indigo-500" />
                                            </div>
                                            <p className="text-xs text-gray-600 font-medium">Configuração {type}</p>
                                        </div>
                                        <p className="text-[10px] text-gray-300 font-mono tracking-wider">ID: {selectedNode.id.slice(0, 8)}</p>
                                    </div>
                                </motion.div>

                                {/* NEXT NODE (Right Slot) */}
                                {connectedNodes.outgoing.length > 0 ? (
                                    <motion.div
                                        key={`next-${connectedNodes.outgoing[0].id}`}
                                        className="w-[500px] h-[80vh] shrink-0 opacity-40 scale-90 pointer-events-auto cursor-pointer hover:opacity-60 hover:scale-95 transition-all duration-300 hidden xl:block"
                                        onClick={() => handleNavigate(connectedNodes.outgoing[0].id, 1)}
                                        initial={{ x: 100, opacity: 0 }}
                                        animate={{ x: 0, opacity: 0.4, scale: 0.9 }}
                                        exit={{ x: 100, opacity: 0 }}
                                        layout
                                    >
                                        {/* Render a "Read-Only" version of the panel */}
                                        <div className="bg-white rounded-3xl shadow-xl w-full h-full border border-gray-200 overflow-hidden flex flex-col relative select-none">
                                            <div className="absolute inset-0 z-10 bg-white/10" /> {/* Overlay */}
                                            {/* Header Replica */}
                                            <div className="px-8 py-5 border-b border-gray-100 bg-white flex items-center gap-4">
                                                <div className={`p-3 rounded-2xl ${NODE_META[connectedNodes.outgoing[0]?.type || 'default']?.color || 'bg-gray-100 text-gray-500'}`}>
                                                    {NODE_META[connectedNodes.outgoing[0]?.type || 'default']?.icon || <Zap className="w-5 h-5" />}
                                                </div>
                                                <div>
                                                    <h2 className="font-bold text-gray-900 text-lg">{NODE_META[connectedNodes.outgoing[0]?.type || 'default']?.label || connectedNodes.outgoing[0]?.type}</h2>
                                                    <p className="text-[11px] text-gray-400 uppercase tracking-widest font-bold">PRÓXIMO</p>
                                                </div>
                                            </div>
                                            <div className="p-8 text-gray-400 text-center mt-20">
                                                <ArrowRight className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                                <p className="text-lg font-medium">Clique para editar</p>
                                            </div>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <div className="w-[500px] hidden xl:block flex items-center justify-center opacity-30">
                                        <div className="bg-white/10 border-2 border-dashed border-white/20 rounded-3xl w-full h-[60%] flex flex-col items-center justify-center gap-4">
                                            <CornerUpRight className="w-12 h-12 text-white" />
                                            <p className="text-white font-medium">Fim do fluxo</p>
                                        </div>
                                    </div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}
