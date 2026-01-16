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
import { Loader2, Save, Play } from 'lucide-react';
import { toast } from 'sonner';
import { campaignService } from '@/services/campaign';

import { TriggerNode } from './custom-nodes/trigger-node';
import { AgentNode } from './custom-nodes/agent-node';
import { ActionNode } from './custom-nodes/action-node';
import { LogicNode } from './custom-nodes/logic-node';
import { SplitNode } from './custom-nodes/split-node';
import { DelayNode } from './custom-nodes/delay-node';
import { GotoNode } from './custom-nodes/goto-node';
import { HandoffNode } from './custom-nodes/handoff-node';
import { QualificationNode } from './custom-nodes/qualification-node'; // To implement

const nodeTypes = {
    trigger: TriggerNode,
    agent: AgentNode,
    action: ActionNode,
    logic: LogicNode,
    split: SplitNode,
    delay: DelayNode,
    goto: GotoNode,
    handoff: HandoffNode,
    qualification: AgentNode, // Re-use generic agent layout for now or create specific
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

    const [isSaving, setIsSaving] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);

    // Initial Viewport
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
        if (!confirm('Tem certeza? Isso ativará a nova versão do fluxo para esta campanha. Deseja continuar?')) return;

        setIsPublishing(true);
        try {
            // Save first
            await handleSave();
            // Publish
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
        <div className="flex-1 h-full w-full relative" ref={reactFlowWrapper}>
            <div className="absolute top-4 right-4 z-10 flex gap-2">
                <Button variant="outline" size="sm" onClick={handleSave} disabled={isSaving}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Salvar Rascunho
                </Button>
                <Button size="sm" onClick={handlePublish} disabled={isPublishing} className="bg-green-600 hover:bg-green-700">
                    {isPublishing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
                    Publicar
                </Button>
            </div>

            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onDrop={onDrop}
                onDragOver={onDragOver}
                nodeTypes={nodeTypes}
                fitView={!initialFlow?.nodes?.length}
                proOptions={{ hideAttribution: true }}
                defaultEdgeOptions={{ type: 'smoothstep', animated: true }}
            >
                <Controls />
                <MiniMap />
                <Background variant={BackgroundVariant.Dots} gap={12} size={1} />

                {nodes.length === 0 && (
                    <Panel position="top-center" className="bg-white/80 p-4 rounded-xl border border-dashed border-gray-300 mt-20 backdrop-blur-sm">
                        <div className="text-center text-gray-500">
                            <p className="font-medium">O canvas está vazio</p>
                            <p className="text-sm">Arraste elementos do menu lateral para começar</p>
                        </div>
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
