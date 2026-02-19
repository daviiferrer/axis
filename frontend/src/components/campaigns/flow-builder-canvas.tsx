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
import { Loader2, Save, Play, Pause, Settings, Clock, ArrowLeft, Moon, Radio, ChevronLeft } from 'lucide-react';
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
import { FollowUpNode } from './custom-nodes/followup-node';

// Custom Edges
import { AnimatedEdge } from './custom-edges/animated-edge';

import { NodeConfigModal } from './node-config-modal';
import { CampaignSettingsPanel } from './campaign-settings-panel';

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

function isWithinBusinessHours(bh: CampaignSettings['businessHours']): boolean {
    if (!bh || !bh.enabled) return true;
    try {
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: bh.timezone || 'America/Sao_Paulo',
            hour: 'numeric',
            weekday: 'short',
            hour12: false,
        });
        const parts = formatter.formatToParts(new Date());
        const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0');
        const weekdayStr = parts.find(p => p.type === 'weekday')?.value || '';
        const dayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
        const dayNum = dayMap[weekdayStr] ?? new Date().getDay();
        return (bh.workDays || [1, 2, 3, 4, 5]).includes(dayNum) && hour >= (bh.start ?? 8) && hour < (bh.end ?? 20);
    } catch { return true; }
}

function FlowBuilderCanvasInner({ campaignId, initialFlow, campaign: initialCampaign }: FlowBuilderCanvasProps) {
    const reactFlowWrapper = useRef<HTMLDivElement>(null);
    const router = useRouter();
    const [nodes, setNodes, onNodesChange] = useNodesState(initialFlow?.nodes || []);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialFlow?.edges || []);
    const { screenToFlowPosition, getViewport, setViewport } = useReactFlow();
    const { socket, isConnected } = useSocket();

    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [campaignStatus, setCampaignStatus] = useState<string>(initialCampaign?.status || 'draft');
    const [isTogglingStatus, setIsTogglingStatus] = useState(false);

    const bh = initialCampaign?.settings?.businessHours;
    const hasBH = !!bh;
    const withinHours = useMemo(() => hasBH ? isWithinBusinessHours(bh!) : true, [bh, hasBH]);
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
    }, []);

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
                // @ts-ignore — getFlowStats may not exist yet on all backends
                if (typeof campaignService.getFlowStats === 'function') {
                    // @ts-ignore
                    const response = await campaignService.getFlowStats(campaignId);
                    const activeStats = response.active || response || {};
                    const errorStats = response.error || {};

                    setNodes((nds) =>
                        nds.map((node) => {
                            const activeCount = activeStats[node.id] || 0;
                            const errorCount = errorStats[node.id] || 0;
                            if (node.data.activeLeads !== activeCount || node.data.errorLeads !== errorCount) {
                                return { ...node, data: { ...node.data, activeLeads: activeCount, errorLeads: errorCount } };
                            }
                            return node;
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

        // Lead moved to a new node
        const onLeadUpdate = (data: any) => {
            if (data.campaignId !== campaignId) return;
            setNodes((nds) =>
                nds.map((node) => {
                    // Increment count on destination node
                    if (node.id === data.current_node_id) {
                        return { ...node, data: { ...node.data, activeLeads: Number(node.data.activeLeads || 0) + 1 } };
                    }
                    // Decrement count on source node
                    if (data.previous_node_id && node.id === data.previous_node_id) {
                        return { ...node, data: { ...node.data, activeLeads: Math.max(0, Number(node.data.activeLeads || 0) - 1) } };
                    }
                    return node;
                })
            );
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
        // Validation: Ensure at least one Trigger Node has a session configured
        const triggerNodes = nodes.filter(n => n.type === 'trigger');
        const hasSession = triggerNodes.some(n => n.data?.sessionName && n.data?.sessionName !== 'default');

        if (!hasSession) {
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
                                {isOutsideHours ? 'Fora do horário' :
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

                        {/* Publish + Status Toggle */}
                        <Button
                            size="sm"
                            onClick={handlePublish}
                            disabled={isPublishing}
                            className="rounded-full px-4 h-8 text-xs bg-gray-900 hover:bg-black text-white shadow-sm"
                        >
                            {isPublishing ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Save className="mr-1.5 h-3.5 w-3.5" />}
                            Publicar
                        </Button>

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

            {/* Universal Node Config Modal */}
            <NodeConfigModal
                selectedNode={nodes.find((n) => n.id === selectedNodeId) || null}
                onClose={() => setSelectedNodeId(null)}
                onUpdateNode={handleUpdateNode}
                nodes={nodes}
                edges={edges}
                onNavigate={(nodeId) => setSelectedNodeId(nodeId)}
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
    );
}

export function FlowBuilderCanvas(props: FlowBuilderCanvasProps) {
    return (
        <ReactFlowProvider>
            <FlowBuilderCanvasInner {...props} />
        </ReactFlowProvider>
    );
}
