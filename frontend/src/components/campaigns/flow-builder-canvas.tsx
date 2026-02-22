'use client'

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
    ReactFlow,
    ReactFlowProvider,
    addEdge,
    useNodesState,
    useEdgesState,
    Controls,
    Background,
    MiniMap,
    Connection,
    Edge,
    Node,
    BackgroundVariant,
    Panel,
    useReactFlow
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { Button } from '@/components/ui/button';
import { Loader2, Save, Play, Pause, Settings, Clock, ArrowLeft, Moon, Radio, ChevronLeft, AlertTriangle, XCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { campaignService, Campaign, CampaignSettings } from '@/services/campaign';
import { motion } from 'framer-motion';
import { useSocket } from '@/context/SocketContext';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

// Custom Nodes
import { TriggerNode } from './custom-nodes/trigger-node';
import { AgentNode } from './custom-nodes/agent-node';
import { ActionNode } from './custom-nodes/action-node';
import { LogicNode } from './custom-nodes/logic-node';
import { SplitNode } from './custom-nodes/split-node';
import { DelayNode } from './custom-nodes/delay-node';
import { GotoNode } from './custom-nodes/goto-node';
import { HandoffNode } from './custom-nodes/handoff-node';

import { ClosingNode } from './custom-nodes/closing-node';
import { BroadcastNode } from './custom-nodes/broadcast-node';
import { ChatbotNode } from './custom-nodes/chatbot-node';
import { FollowUpNode } from './custom-nodes/followup-node';

// Custom Edges
import { AnimatedEdge } from './custom-edges/animated-edge';

import { NodeExpansionOverlay } from './node-expansion-overlay';
import { CampaignSettingsPanel } from './campaign-settings-panel';
import { NodeLeadsSidebar } from './node-leads-sidebar';
import { useNodeValidation } from './hooks/useNodeValidation';
import { NodeValidationContext } from './node-validation-context';

import { wahaService } from '@/services/waha';
import { agentService, Agent } from '@/services/agentService';

// Node Type Registry
const nodeTypes = {
    trigger: TriggerNode,
    agent: AgentNode,
    agentic: AgentNode, // Explicit mapping for backend compatibility
    action: ActionNode,
    logic: LogicNode,
    split: SplitNode,
    delay: DelayNode,
    goto: GotoNode,
    handoff: HandoffNode,
    closing: ClosingNode,
    broadcast: BroadcastNode,
    chatbot: ChatbotNode,
    goto_campaign: GotoNode,
    followup: FollowUpNode,
};

// Edge Type Registry
const edgeTypes = {
    animated: AnimatedEdge,
};

interface FlowBuilderCanvasProps {
    campaignId: string;
    initialFlow?: any;
    campaign?: Campaign | null;
}

function isWithinBusinessHours(bh: CampaignSettings['businessHours']): { isWithin: boolean; reason?: 'weekend' | 'time' } {
    if (!bh || !bh.enabled) return { isWithin: true };
    try {
        const now = new Date();
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: bh.timezone || 'America/Sao_Paulo',
            hour: 'numeric',
            weekday: 'short',
            hour12: false,
        });
        const parts = formatter.formatToParts(now);
        const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0');
        const weekdayStr = parts.find(p => p.type === 'weekday')?.value || '';
        const dayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
        const dayNum = dayMap[weekdayStr] ?? now.getDay();

        const workDays = bh.workDays || [1, 2, 3, 4, 5, 6];
        const isWorkDay = workDays.includes(dayNum);
        const isWorkingHour = hour >= (bh.start ?? 8) && hour < (bh.end ?? 20);

        if (!isWorkDay) return { isWithin: false, reason: 'weekend' };
        if (!isWorkingHour) return { isWithin: false, reason: 'time' };

        return { isWithin: true };
    } catch { return { isWithin: true }; }
}

function FlowBuilderCanvasInner({ campaignId, initialFlow, campaign: initialCampaign }: FlowBuilderCanvasProps) {
    const reactFlowWrapper = useRef<HTMLDivElement>(null);
    const router = useRouter();
    const [nodes, setNodes, onNodesChange] = useNodesState(initialFlow?.nodes || []);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialFlow?.edges || []);
    const { screenToFlowPosition, getViewport, setViewport } = useReactFlow();
    const { socket, isConnected } = useSocket();
    const { validationResults, totalErrors, totalWarnings, isValid } = useNodeValidation(nodes as any);

    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const [selectedNodeElement, setSelectedNodeElement] = useState<HTMLElement | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [campaignStatus, setCampaignStatus] = useState<string>(initialCampaign?.status || 'draft');
    const [isTogglingStatus, setIsTogglingStatus] = useState(false);
    const [leadsSidebarNodeId, setLeadsSidebarNodeId] = useState<string | null>(null);
    const [leadsSidebarType, setLeadsSidebarType] = useState<'active' | 'error'>('active');

    // Configuration Data sources (Moved from NodeConfigSheet)
    const [sessions, setSessions] = useState<any[]>([]);
    const [agents, setAgents] = useState<Agent[]>([]);
    const [campaignsList, setCampaignsList] = useState<any[]>([]);

    useEffect(() => {
        const handleOpenLeads = (e: any) => {
            setLeadsSidebarNodeId(e.detail.nodeId);
            setLeadsSidebarType(e.detail.type || 'active');
        };
        const handleOpenConfig = (e: any) => {
            setSelectedNodeId(e.detail.nodeId);
            setLeadsSidebarNodeId(null); // Fechar a sidebar de leads se estiver aberta
            // Locate the node element in the DOM to act as animation source
            const el = document.querySelector(`[data-id="${e.detail.nodeId}"]`) as HTMLElement;
            setSelectedNodeElement(el);
        };
        window.addEventListener('open-node-leads', handleOpenLeads);
        window.addEventListener('open-node-config', handleOpenConfig);

        // Fetch global dependencies for node configuration
        wahaService.getSessions().then(setSessions).catch(() => setSessions([]));
        agentService.list().then(setAgents).catch(() => setAgents([]));
        campaignService.listCampaigns().then((r: any) => setCampaignsList(Array.isArray(r) ? r : r.data || [])).catch(() => setCampaignsList([]));

        return () => {
            window.removeEventListener('open-node-leads', handleOpenLeads);
            window.removeEventListener('open-node-config', handleOpenConfig);
        };
    }, []);

    const bh = initialCampaign?.settings?.businessHours;
    const hasBH = !!bh;
    const bhStatus = useMemo(() => hasBH ? isWithinBusinessHours(bh!) : { isWithin: true }, [bh, hasBH]);
    const withinHours = bhStatus.isWithin;
    const isActive = campaignStatus === 'active';
    const isOperating = isActive && withinHours;
    const isOutsideHours = isActive && !withinHours && hasBH && bh!.enabled;

    const handleStatusToggle = async () => {
        setIsTogglingStatus(true);
        try {
            const newStatus = isActive ? 'paused' : 'active';
            await campaignService.updateStatus(campaignId, newStatus);
            setCampaignStatus(newStatus);
            toast.success(newStatus === 'active' ? 'Campanha ativada! 🚀' : 'Campanha pausada ⏸️');
        } catch {
            toast.error('Erro ao alterar status.');
        } finally {
            setIsTogglingStatus(false);
        }
    };

    const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
        setSelectedNodeId(node.id);
        const el = document.querySelector(`[data-id="${node.id}"]`) as HTMLElement;
        setSelectedNodeElement(el);

        // Mark this specific node as expanding in its data to trigger the seamless transition (transparency)
        setNodes((nds) =>
            nds.map((n) => ({
                ...n,
                data: {
                    ...n.data,
                    isExpanding: n.id === node.id
                }
            }))
        );
    }, [setNodes]);

    const handleUpdateNode = useCallback((nodeId: string, newData: any) => {
        setNodes((nds) =>
            nds.map((node) => {
                if (node.id === nodeId) {
                    if (newData.type && newData.type !== node.type) {
                        return {
                            ...node,
                            type: newData.type,
                            data: { ...node.data, ...newData }
                        };
                    }
                    return { ...node, data: { ...node.data, ...newData } };
                }
                return node;
            })
        );
        toast.success('Nó atualizado');
    }, [setNodes]);

    useEffect(() => {
        if (initialFlow?.viewport) {
            setViewport(initialFlow.viewport);
        }
    }, [initialFlow, setViewport]);

    // ═══════════════════════════════════════════════════════════
    // REAL-TIME via Socket.IO (replaces 5s polling)
    // ═══════════════════════════════════════════════════════════
    useEffect(() => {
        if (!campaignId) return;

        // One-time initial sync on mount
        const syncInitial = async () => {
            try {
                if (typeof campaignService.getFlowStats === 'function') {
                    const response = await campaignService.getFlowStats(campaignId);
                    const activeStats = response.active || response || {};
                    const errorStats = response.error || {};

                    setNodes((nds) =>
                        nds.map((node) => {
                            const activeNodeData = activeStats[node.id] || { count: 0, leads: [] };
                            const errorNodeData = errorStats[node.id] || { count: 0, leads: [] };

                            const activeCount = activeNodeData.count || 0;
                            const activeLeadsList = activeNodeData.leads || [];

                            const errorCount = errorNodeData.count || 0;
                            const errorLeadsList = errorNodeData.leads || [];

                            return {
                                ...node,
                                data: {
                                    ...node.data,
                                    activeLeads: activeCount,
                                    activeLeadsList: activeLeadsList,
                                    errorLeads: errorCount,
                                    errorLeadsList: errorLeadsList
                                }
                            };
                        })
                    );
                }
            } catch (err) {
                console.warn('[Canvas] Initial stats sync failed (non-critical)', err);
            }
        };
        syncInitial();
    }, [campaignId, setNodes]);

    // Live Socket.IO listeners — instant updates
    useEffect(() => {
        if (!socket || !isConnected || !campaignId) return;

        const onLeadUpdate = (data: any) => {
            if (data.campaignId !== campaignId) return;

            const newLeadProfile = {
                id: data.leadId,
                name: data.metadata?.leadName || 'Lead',
                phone: data.metadata?.leadPhone,
                profile_picture_url: data.metadata?.profile_picture_url,
                slots: data.metadata?.slots || {},
                sentiment: data.metadata?.sentiment || 0,
                intentScore: data.metadata?.intentScore || 0
            };

            setNodes((nds) => {
                return nds.map((node) => {
                    // Start with the existing node data
                    let updatedNode = { ...node, data: { ...node.data } };

                    // Increment count on destination node
                    if (node.id === data.current_node_id) {
                        const currentList = Array.isArray(updatedNode.data.activeLeadsList) ? [...updatedNode.data.activeLeadsList] : [];
                        // Avoid duplicates
                        const filtered = currentList.filter(l => l.id !== newLeadProfile.id);
                        filtered.unshift(newLeadProfile); // Add to beginning
                        const newList = filtered.slice(0, 100); // Increased buffer to 100 for scrollable navbar

                        updatedNode.data = {
                            ...updatedNode.data,
                            activeLeads: Number(updatedNode.data.activeLeads || 0) + 1,
                            activeLeadsList: newList
                        };
                    }

                    // Decrement count on source node
                    if (data.previous_node_id && node.id === data.previous_node_id) {
                        const currentList = Array.isArray(updatedNode.data.activeLeadsList) ? [...updatedNode.data.activeLeadsList] : [];
                        const newList = currentList.filter(l => l.id !== newLeadProfile.id); // Remove from source list

                        updatedNode.data = {
                            ...updatedNode.data,
                            activeLeads: Math.max(0, Number(updatedNode.data.activeLeads || 0) - 1),
                            activeLeadsList: newList
                        };
                    }

                    return updatedNode;
                });
            });
        };

        // Agent config error detected at runtime
        const onConfigError = (data: any) => {
            if (data.campaignId !== campaignId) return;
            setNodes((nds) =>
                nds.map((node) => {
                    if (node.id === data.nodeId) {
                        return {
                            ...node,
                            data: {
                                ...node.data,
                                configErrors: data.errors || [data.message],
                                errorLeads: Number(node.data.errorLeads || 0) + 1
                            }
                        };
                    }
                    return node;
                })
            );
        };

        // General campaign events (status changes, etc.)
        const onCampaignEvent = (data: any) => {
            if (data.campaignId !== campaignId) return;
            // Future: handle campaign-level status changes
            console.debug('[Canvas] Campaign event:', data.type, data);
        };

        socket.on('lead.update', onLeadUpdate);
        socket.on('agent.config_error', onConfigError);
        socket.on('campaign.event', onCampaignEvent);

        return () => {
            socket.off('lead.update', onLeadUpdate);
            socket.off('agent.config_error', onConfigError);
            socket.off('campaign.event', onCampaignEvent);
        };
    }, [socket, isConnected, campaignId, setNodes]);

    const onConnect = useCallback(
        (params: Connection) => setEdges((eds) => addEdge(params, eds)),
        [setEdges],
    );

    const isValidConnection = useCallback(
        (connection: Connection | Edge) => {
            const source = connection.source;
            const target = connection.target;

            // 1. No self-loops
            if (source === target) return false;

            const sourceNode = nodes.find((n) => n.id === source);
            const targetNode = nodes.find((n) => n.id === target);

            if (!sourceNode || !targetNode) return false;

            // 2. Trigger Node cannot be a target (Start only)
            if (targetNode.type === 'trigger') return false;

            // 3. Closing Node cannot be a source (End only)
            if (sourceNode.type === 'closing') return false;

            return true;
        },
        [nodes]
    );

    const onDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const onDrop = useCallback(
        (event: React.DragEvent) => {
            event.preventDefault();

            const type = event.dataTransfer.getData('application/reactflow/type');
            const label = event.dataTransfer.getData('application/reactflow/label');

            if (typeof type === 'undefined' || !type) {
                return;
            }

            const position = screenToFlowPosition({
                x: event.clientX,
                y: event.clientY,
            });

            const newNode: Node = {
                id: `${type}_${Date.now()}`,
                type,
                position,
                data: { label: label },
            };

            setNodes((nds) => nds.concat(newNode));
        },
        [screenToFlowPosition, setNodes],
    );

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const flowData = {
                nodes,
                edges,
                viewport: getViewport(),
            };
            await campaignService.saveFlow(campaignId, flowData);
            toast.success('Fluxo salvo com sucesso!');
        } catch (error) {
            console.error(error);
            toast.error('Erro ao salvar fluxo.');
        } finally {
            setIsSaving(false);
        }
    };

    const handlePublish = async () => {
        // Validation: Global schema blocker
        if (!isValid) {
            toast.error(`A campanha tem ${totalErrors} erro(s) impeditivo(s)! Corrija os nós indicados em vermelho no Canvas antes de publicar.`);
            return;
        }

        // Validation: Ensure at least one Trigger Node has a session configured
        const triggerNodes = nodes.filter(n => n.type === 'trigger');
        const hasSession = triggerNodes.some(n => n.data?.sessionName && n.data?.sessionName !== 'default');

        if (!hasSession && triggerNodes.length > 0) {
            toast.error('Erro de Validação: Adicione um "Gatilho Inicial" com uma sessão de WhatsApp conectada para publicar.');
            return;
        }

        if (!confirm('Tem certeza? Isso ativará a nova versão do fluxo para esta campanha. Deseja continuar?')) return;

        setIsPublishing(true);
        try {
            await handleSave();
            await campaignService.publishFlow(campaignId);
            toast.success('Fluxo publicado e ativo! 🚀');
        } catch (error) {
            console.error(error);
            toast.error('Erro ao publicar fluxo.');
        } finally {
            setIsPublishing(false);
        }
    };

    return (
        <NodeValidationContext.Provider value={validationResults}>
            <div className="flex-1 h-full w-full relative bg-gray-50 from-gray-50 to-white" ref={reactFlowWrapper}>

                {/* ═══════════════════════════════════════════ */}
                {/* HEADER BAR — Status + Controls              */}
                {/* ═══════════════════════════════════════════ */}
                <div className="absolute top-0 left-0 right-0 z-10">
                    <motion.div
                        initial={{ y: -60, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="flex items-center justify-between px-4 py-2.5 bg-white/80 backdrop-blur-xl border-b border-gray-200/60 shadow-sm"
                    >
                        {/* LEFT: Back + Campaign Name + Status */}
                        <div className="flex items-center gap-3 min-w-0">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => router.push('/app/campaigns')}
                                className="h-8 w-8 rounded-full hover:bg-gray-100 shrink-0"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>

                            <div className="flex items-center gap-2.5 min-w-0">
                                {/* Live status dot */}
                                <span className={cn(
                                    "flex h-2.5 w-2.5 rounded-full shrink-0 transition-colors",
                                    isOperating
                                        ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"
                                        : isOutsideHours
                                            ? "bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.4)]"
                                            : isActive
                                                ? "bg-green-500"
                                                : "bg-gray-300"
                                )} />

                                <h1 className="text-sm font-bold text-gray-900 truncate">
                                    {initialCampaign?.name || 'Campanha'}
                                </h1>

                                {/* Status Badge */}
                                <div className={cn(
                                    "flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0",
                                    isOperating ? "bg-green-50 text-green-700" :
                                        isOutsideHours ? "bg-amber-50 text-amber-700" :
                                            isActive ? "bg-green-50 text-green-700" :
                                                "bg-gray-100 text-gray-500"
                                )}>
                                    {isOutsideHours && <Moon size={10} />}
                                    {isOperating && <Radio size={10} />}
                                    {isOutsideHours ? (bhStatus.reason === 'weekend' ? 'Fechado hoje' : 'Fora do horário') :
                                        isActive ? 'Ativa' : 'Pausada'}
                                </div>

                                {/* Business Hours Pill */}
                                {hasBH && bh!.enabled && (
                                    <div className={cn(
                                        "hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium",
                                        isOutsideHours ? "bg-amber-50 text-amber-600" : "bg-gray-50 text-gray-500"
                                    )}>
                                        <Clock size={10} />
                                        {String(bh!.start).padStart(2, '0')}h-{String(bh!.end).padStart(2, '0')}h
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* RIGHT: Controls */}
                        <div className="flex items-center gap-1.5 shrink-0">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleSave}
                                disabled={isSaving}
                                className="rounded-full px-3 h-8 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100/50"
                            >
                                {isSaving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Save className="mr-1.5 h-3.5 w-3.5" />}
                                Salvar
                            </Button>

                            <div className="h-5 w-px bg-gray-200" />

                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setShowSettings(true)}
                                className="rounded-full h-8 w-8 text-gray-500 hover:text-gray-900 hover:bg-gray-100/50"
                                title="Configurações"
                            >
                                <Settings className="h-3.5 w-3.5" />
                            </Button>

                            <div className="h-5 w-px bg-gray-200" />

                            {/* Status Toggle */}
                            <Button
                                size="sm"
                                onClick={handleStatusToggle}
                                disabled={isTogglingStatus}
                                className={cn(
                                    "rounded-full px-4 h-8 text-xs shadow-sm transition-all",
                                    isActive
                                        ? "bg-amber-500 hover:bg-amber-600 text-white"
                                        : "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-green-500/20"
                                )}
                            >
                                {isTogglingStatus ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> :
                                    isActive ? <Pause className="mr-1.5 h-3.5 w-3.5" /> : <Play className="mr-1.5 h-3.5 w-3.5 fill-current" />}
                                {isActive ? 'Pausar' : 'Ativar'}
                            </Button>
                        </div>
                    </motion.div>
                </div>

                {/* In-Place Animated Node Configuration */}
                <NodeExpansionOverlay
                    node={nodes.find((n) => n.id === selectedNodeId) || null}
                    nodes={nodes}
                    edges={edges}
                    htmlElement={selectedNodeElement}
                    onClose={() => {
                        setSelectedNodeId(null);
                        setSelectedNodeElement(null);
                        // Clear the isExpanding flag from all nodes so they become visible again
                        setNodes((nds) => nds.map((n) => ({
                            ...n,
                            data: { ...n.data, isExpanding: false }
                        })));
                    }}
                    onUpdateNode={handleUpdateNode}
                    sessions={sessions}
                    agents={agents}
                    campaigns={campaignsList}
                    onRefreshAgents={() => agentService.list().then(setAgents).catch(() => setAgents([]))}
                />

                {/* Campaign Settings Panel */}
                <CampaignSettingsPanel
                    campaignId={campaignId}
                    open={showSettings}
                    onClose={() => setShowSettings(false)}
                />

                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    isValidConnection={isValidConnection}
                    onDrop={onDrop}
                    onDragOver={onDragOver}
                    onNodeClick={onNodeClick}
                    onPaneClick={() => setSelectedNodeId(null)}
                    nodeTypes={nodeTypes}
                    edgeTypes={edgeTypes}
                    fitView={!initialFlow?.nodes?.length}
                    proOptions={{ hideAttribution: true }}
                    defaultEdgeOptions={{
                        type: 'animated',
                        style: { stroke: '#94a3b8', strokeWidth: 2 }
                    }}
                    deleteKeyCode={['Backspace', 'Delete']}
                    multiSelectionKeyCode={['Control', 'Meta', 'Shift']}
                    selectionKeyCode={['Control', 'Meta', 'Shift']}
                >
                    <Controls
                        className="bg-white border border-gray-100 shadow-xl rounded-xl overflow-hidden !m-4"
                        showInteractive={false}
                    />

                    <MiniMap
                        style={{ height: 120 }}
                        zoomable
                        pannable
                        className="!bg-white/80 !backdrop-blur-sm border !border-gray-200 !rounded-xl overflow-hidden shadow-lg !m-4"
                    />

                    <Background
                        variant={BackgroundVariant.Dots}
                        gap={24}
                        size={1}
                        color="#cbd5e1"
                    />

                    {/* Empty State Removed */}
                </ReactFlow>
            </div>

            {/* ═══════════════════════════════════════════ */}
            {/* STATUS BAR (Errors and Warnings)            */}
            {/* ═══════════════════════════════════════════ */}
            <div className="absolute bottom-6 left-6 z-50 flex gap-2 pointer-events-none">
                {totalErrors > 0 && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-700 text-[11px] font-bold tracking-wide uppercase rounded-full shadow-sm border border-red-200">
                        <XCircle size={14} />
                        {totalErrors} erro{totalErrors > 1 ? 's' : ''}
                    </div>
                )}
                {totalWarnings > 0 && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-100 text-orange-700 text-[11px] font-bold tracking-wide uppercase rounded-full shadow-sm border border-orange-200">
                        <AlertTriangle size={14} />
                        {totalWarnings} aviso{totalWarnings > 1 ? 's' : ''}
                    </div>
                )}
                {totalErrors === 0 && totalWarnings === 0 && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 text-[11px] font-bold tracking-wide uppercase rounded-full shadow-sm border border-green-200">
                        <CheckCircle2 size={14} />
                        Canvas Validado
                    </div>
                )}
            </div>
        </NodeValidationContext.Provider>
    );
}

export function FlowBuilderCanvas(props: FlowBuilderCanvasProps) {
    return (
        <ReactFlowProvider>
            <FlowBuilderCanvasInner {...props} />
        </ReactFlowProvider>
    );
}
