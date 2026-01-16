'use client'

import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Save, Play } from "lucide-react"
import Link from "next/link"
import React, { useCallback } from 'react';
import {
    ReactFlow,
    MiniMap,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    addEdge,
    Connection,
    Edge,
} from '@xyflow/react';

import '@xyflow/react/dist/style.css';

const initialNodes = [
    { id: '1', position: { x: 0, y: 0 }, data: { label: 'Início' } },
    { id: '2', position: { x: 0, y: 100 }, data: { label: 'Mensagem de Boas-vindas' } },
];
const initialEdges = [{ id: 'e1-2', source: '1', target: '2' }];

export default function AgentEditorPage() {
    const params = useParams()
    const id = params?.id

    // XYFlow State
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

    const onConnect = useCallback(
        (params: Connection) => setEdges((eds) => addEdge(params, eds)),
        [setEdges],
    );

    return (
        <div className="h-[calc(100vh-theme(spacing.4))] flex flex-col font-inter bg-white">
            {/* Toolbar */}
            <div className="border-b px-6 py-3 flex items-center justify-between bg-white z-10">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/app/agents">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="font-semibold text-gray-900 leading-tight">Editor de Fluxo</h1>
                        <p className="text-xs text-muted-foreground">Editando Agente #{id}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                        <Play className="mr-2 h-4 w-4" />
                        Testar
                    </Button>
                    <Button size="sm">
                        <Save className="mr-2 h-4 w-4" />
                        Salvar
                    </Button>
                </div>
            </div>

            {/* Editor Canvas */}
            <div className="flex-1 bg-gray-50 relative">
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    fitView
                >
                    <Controls />
                    <MiniMap />
                    <Background gap={12} size={1} />
                </ReactFlow>
            </div>
        </div>
    )
}
