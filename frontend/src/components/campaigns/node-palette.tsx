'use client'

import React from 'react';
import {
    MessageSquare,
    Bot,
    Zap,
    Clock,
    GitBranch,
    MousePointerClick,
    Users,
    Flag,
    Split,
    ArrowRight,
    Megaphone,
    Brain
} from 'lucide-react';

export function NodePalette() {
    const onDragStart = (event: React.DragEvent, nodeType: string, nodeLabel: string) => {
        event.dataTransfer.setData('application/reactflow/type', nodeType);
        event.dataTransfer.setData('application/reactflow/label', nodeLabel);
        event.dataTransfer.effectAllowed = 'move';
    };

    return (
        <aside className="w-64 border-r border-gray-200 bg-white flex flex-col h-full">
            <div className="p-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900">Elementos</h2>
                <p className="text-xs text-muted-foreground">Arraste para o fluxo</p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">

                {/* Triggers */}
                <div className="space-y-3">
                    <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Gatilhos</h3>
                    <div
                        className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg cursor-grab hover:shadow-sm hover:border-gray-300 transition-all group"
                        onDragStart={(event) => onDragStart(event, 'trigger', 'Início do Fluxo')}
                        draggable
                    >
                        <Zap className="h-4 w-4 text-gray-700 group-hover:text-gray-900" strokeWidth={1.5} />
                        <span className="text-sm font-medium text-gray-900">Início / Gatilho</span>
                    </div>
                </div>

                {/* Actions & Communication */}
                <div className="space-y-3">
                    <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Ações & Comunicação</h3>
                    <div
                        className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg cursor-grab hover:shadow-sm hover:border-gray-300 transition-all group"
                        onDragStart={(event) => onDragStart(event, 'action', 'Enviar Mensagem')}
                        draggable
                    >
                        <MessageSquare className="h-4 w-4 text-gray-700 group-hover:text-gray-900" strokeWidth={1.5} />
                        <span className="text-sm font-medium text-gray-900">Enviar Mensagem (Action)</span>
                    </div>
                    <div
                        className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg cursor-grab hover:shadow-sm hover:border-gray-300 transition-all group"
                        onDragStart={(event) => onDragStart(event, 'broadcast', 'Disparo em Massa')}
                        draggable
                    >
                        <Megaphone className="h-4 w-4 text-gray-700 group-hover:text-gray-900" strokeWidth={1.5} />
                        <span className="text-sm font-medium text-gray-900">Disparo em Massa (Broadcast)</span>
                    </div>
                    <div
                        className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg cursor-grab hover:shadow-sm hover:border-gray-300 transition-all group"
                        onDragStart={(event) => onDragStart(event, 'handoff', 'Transbordo Humano')}
                        draggable
                    >
                        <Users className="h-4 w-4 text-gray-700 group-hover:text-gray-900" strokeWidth={1.5} />
                        <span className="text-sm font-medium text-gray-900">Transbordo Humano</span>
                    </div>
                </div>

                {/* AI & Agents */}
                <div className="space-y-3">
                    <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Inteligência (AI)</h3>
                    <div
                        className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg cursor-grab hover:shadow-sm hover:border-gray-300 transition-all group"
                        onDragStart={(event) => onDragStart(event, 'agent', 'Agente IA')}
                        draggable
                    >
                        <Bot className="h-4 w-4 text-gray-700 group-hover:text-gray-900" strokeWidth={1.5} />
                        <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-900">Agente IA</span>
                            <span className="text-[10px] text-gray-500 leading-tight">Escolha o cérebro nas configurações</span>
                        </div>
                    </div>
                </div>

                {/* Logic & Flow */}
                <div className="space-y-3">
                    <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Controle de Fluxo</h3>
                    <div
                        className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg cursor-grab hover:shadow-sm hover:border-gray-300 transition-all group"
                        onDragStart={(event) => onDragStart(event, 'logic', 'Roteador Lógico')}
                        draggable
                    >
                        <GitBranch className="h-4 w-4 text-gray-700 group-hover:text-gray-900" strokeWidth={1.5} />
                        <span className="text-sm font-medium text-gray-900">Roteador Lógico</span>
                    </div>
                    <div
                        className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg cursor-grab hover:shadow-sm hover:border-gray-300 transition-all group"
                        onDragStart={(event) => onDragStart(event, 'split', 'Teste A/B')}
                        draggable
                    >
                        <Split className="h-4 w-4 text-gray-700 group-hover:text-gray-900" strokeWidth={1.5} />
                        <span className="text-sm font-medium text-gray-900">Teste A/B (Split)</span>
                    </div>
                    <div
                        className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg cursor-grab hover:shadow-sm hover:border-gray-300 transition-all group"
                        onDragStart={(event) => onDragStart(event, 'delay', 'Aguardar')}
                        draggable
                    >
                        <Clock className="h-4 w-4 text-gray-700 group-hover:text-gray-900" strokeWidth={1.5} />
                        <span className="text-sm font-medium text-gray-900">Aguardar (Delay)</span>
                    </div>
                    <div
                        className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg cursor-grab hover:shadow-sm hover:border-gray-300 transition-all group"
                        onDragStart={(event) => onDragStart(event, 'goto', 'Ir Para Nó')}
                        draggable
                    >
                        <ArrowRight className="h-4 w-4 text-gray-700 group-hover:text-gray-900" strokeWidth={1.5} />
                        <span className="text-sm font-medium text-gray-900">Ir Para (GoTo Node)</span>
                    </div>
                    <div
                        className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg cursor-grab hover:shadow-sm hover:border-gray-300 transition-all group"
                        onDragStart={(event) => onDragStart(event, 'goto_campaign', 'Ir Para Campanha')}
                        draggable
                    >
                        <ArrowRight className="h-4 w-4 text-gray-700 group-hover:text-gray-900" strokeWidth={1.5} />
                        <span className="text-sm font-medium text-gray-900">Trocar Campanha</span>
                    </div>
                    <div
                        className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg cursor-grab hover:shadow-sm hover:border-gray-300 transition-all group"
                        onDragStart={(event) => onDragStart(event, 'closing', 'Encerrar Lead')}
                        draggable
                    >
                        <MousePointerClick className="h-4 w-4 text-gray-700 group-hover:text-gray-900" strokeWidth={1.5} />
                        <span className="text-sm font-medium text-gray-900">Finalizar (Closing)</span>
                    </div>
                </div>

            </div>
        </aside>
    );
}
