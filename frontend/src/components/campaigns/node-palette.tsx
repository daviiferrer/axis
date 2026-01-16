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
    ArrowRight
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
                        className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-100 rounded-lg cursor-grab hover:shadow-sm active:cursor-grabbing transition-all"
                        onDragStart={(event) => onDragStart(event, 'trigger', 'Início do Fluxo')}
                        draggable
                    >
                        <Zap className="h-5 w-5 text-blue-600" />
                        <span className="text-sm font-medium text-blue-900">Início / Gatilho</span>
                    </div>
                </div>

                {/* AI & Agents */}
                <div className="space-y-3">
                    <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Inteligência (AI)</h3>
                    <div
                        className="flex items-center gap-3 p-3 bg-purple-50 border border-purple-100 rounded-lg cursor-grab hover:shadow-sm transition-all"
                        onDragStart={(event) => onDragStart(event, 'agent', 'Agente IA')}
                        draggable
                    >
                        <Bot className="h-5 w-5 text-purple-600" />
                        <span className="text-sm font-medium text-purple-900">Agente IA</span>
                    </div>
                    <div
                        className="flex items-center gap-3 p-3 bg-purple-50 border border-purple-100 rounded-lg cursor-grab hover:shadow-sm transition-all"
                        onDragStart={(event) => onDragStart(event, 'qualification', 'Qualificação')}
                        draggable
                    >
                        <Flag className="h-5 w-5 text-purple-600" />
                        <span className="text-sm font-medium text-purple-900">Qualificação SDR</span>
                    </div>
                </div>

                {/* Actions */}
                <div className="space-y-3">
                    <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</h3>
                    <div
                        className="flex items-center gap-3 p-3 bg-green-50 border border-green-100 rounded-lg cursor-grab hover:shadow-sm transition-all"
                        onDragStart={(event) => onDragStart(event, 'action', 'Enviar Mensagem')}
                        draggable
                    >
                        <MessageSquare className="h-5 w-5 text-green-600" />
                        <span className="text-sm font-medium text-green-900">Enviar Mensagem</span>
                    </div>
                    <div
                        className="flex items-center gap-3 p-3 bg-green-50 border border-green-100 rounded-lg cursor-grab hover:shadow-sm transition-all"
                        onDragStart={(event) => onDragStart(event, 'handoff', 'Transbordo')}
                        draggable
                    >
                        <Users className="h-5 w-5 text-green-600" />
                        <span className="text-sm font-medium text-green-900">Transbordo Humano</span>
                    </div>
                </div>

                {/* Logic */}
                <div className="space-y-3">
                    <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Lógica</h3>
                    <div
                        className="flex items-center gap-3 p-3 bg-orange-50 border border-orange-100 rounded-lg cursor-grab hover:shadow-sm transition-all"
                        onDragStart={(event) => onDragStart(event, 'logic', 'Condição')}
                        draggable
                    >
                        <GitBranch className="h-5 w-5 text-orange-600" />
                        <span className="text-sm font-medium text-orange-900">Condição (If/Else)</span>
                    </div>
                    <div
                        className="flex items-center gap-3 p-3 bg-orange-50 border border-orange-100 rounded-lg cursor-grab hover:shadow-sm transition-all"
                        onDragStart={(event) => onDragStart(event, 'split', 'Split A/B')}
                        draggable
                    >
                        <Split className="h-5 w-5 text-orange-600" />
                        <span className="text-sm font-medium text-orange-900">Split A/B</span>
                    </div>
                    <div
                        className="flex items-center gap-3 p-3 bg-orange-50 border border-orange-100 rounded-lg cursor-grab hover:shadow-sm transition-all"
                        onDragStart={(event) => onDragStart(event, 'delay', 'Aguardar')}
                        draggable
                    >
                        <Clock className="h-5 w-5 text-orange-600" />
                        <span className="text-sm font-medium text-orange-900">Delay / Aguardar</span>
                    </div>
                    <div
                        className="flex items-center gap-3 p-3 bg-orange-50 border border-orange-100 rounded-lg cursor-grab hover:shadow-sm transition-all"
                        onDragStart={(event) => onDragStart(event, 'goto', 'Ir Para')}
                        draggable
                    >
                        <ArrowRight className="h-5 w-5 text-orange-600" />
                        <span className="text-sm font-medium text-orange-900">Ir Para (Go To)</span>
                    </div>
                </div>

            </div>
        </aside>
    );
}
