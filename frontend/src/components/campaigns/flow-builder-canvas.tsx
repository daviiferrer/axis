'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react';
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
import { Loader2, Save, Play, MousePointer2 } from 'lucide-react';
import { toast } from 'sonner';
import { campaignService } from '@/services/campaign';
import { motion } from 'framer-motion';

// Custom Nodes
import { TriggerNode } from './custom-nodes/trigger-node';
import { AgentNode } from './custom-nodes/agent-node';
import { ActionNode } from './custom-nodes/action-node';
import { LogicNode } from './custom-nodes/logic-node';
import { SplitNode } from './custom-nodes/split-node';
import { DelayNode } from './custom-nodes/delay-node';
import { GotoNode } from './custom-nodes/goto-node';
import { HandoffNode } from './custom-nodes/handoff-node';
import { QualificationNode } from './custom-nodes/qualification-node';
import { ClosingNode } from './custom-nodes/closing-node';
import { BroadcastNode } from './custom-nodes/broadcast-node';

// Custom Edges
import { AnimatedEdge } from './custom-edges/animated-edge';

import { NodeEditorPanel } from './node-editor-panel';

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
    qualification: QualificationNode,
    closing: ClosingNode,
    broadcast: BroadcastNode,
    outreach: AgentNode,
    objection: AgentNode,
    goto_campaign: GotoNode,
};

// Edge Type Registry
const edgeTypes = {
    animated: AnimatedEdge,
};

interface FlowBuilderCanvasProps {
    campaignId: string;
    initialFlow?: any;
}

function FlowBuilderCanvasInner({ campaignId, initialFlow }: FlowBuilderCanvasProps) {
    const reactFlowWrapper = useRef<HTMLDivElement>(null);
    const [nodes, setNodes, onNodesChange] = useNodesState(initialFlow?.nodes || []);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialFlow?.edges || []);
    const { screenToFlowPosition, getViewport, setViewport } = useReactFlow();

    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);

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

    const onConnect = useCallback(
        (params: Connection) => setEdges((eds) => addEdge(params, eds)),
        [setEdges],
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

            {/* Floating Action Bar (Top Center) */}
            <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10">
                <motion.div
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="flex items-center gap-2 p-1.5 bg-white/80 backdrop-blur-md shadow-lg shadow-gray-200/50 border border-white/50 rounded-full"
                >
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleSave}
                        disabled={isSaving}
                        className="rounded-full px-4 text-gray-600 hover:text-gray-900 hover:bg-gray-100/50"
                    >
                        {isSaving ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Save className="mr-2 h-3.5 w-3.5" />}
                        Salvar
                    </Button>
                    <div className="h-4 w-px bg-gray-200" />
                    <Button
                        size="sm"
                        onClick={handlePublish}
                        disabled={isPublishing}
                        className="rounded-full px-6 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-md shadow-green-500/20"
                    >
                        {isPublishing ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Play className="mr-2 h-3.5 w-3.5 fill-current" />}
                        Publicar
                    </Button>
                </motion.div>
            </div>

            {/* Node Editor Panel (Right Overlay) */}
            <NodeEditorPanel
                selectedNode={nodes.find((n) => n.id === selectedNodeId) || null}
                onClose={() => setSelectedNodeId(null)}
                onUpdateNode={handleUpdateNode}
            />

            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
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

                {nodes.length === 0 && (
                    <Panel position="center">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-white/40 backdrop-blur-sm p-10 rounded-3xl border-2 border-dashed border-gray-300/50 flex flex-col items-center justify-center text-center max-w-sm"
                        >
                            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/10 mb-6 text-indigo-500">
                                <MousePointer2 size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 mb-2">Comece seu Fluxo</h3>
                            <p className="text-gray-500 text-sm leading-relaxed">
                                Arraste elementos da <span className="font-semibold text-indigo-600">Toolbox</span> à esquerda para construir sua automação.
                            </p>
                        </motion.div>
                    </Panel>
                )}
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
