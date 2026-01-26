'use client'

import React, { useState } from 'react';
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
    Brain,
    Search,
    GripVertical,
    ChevronLeft,
    ChevronRight,
    Box
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';

export function NodePalette() {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const onDragStart = (event: React.DragEvent, nodeType: string, nodeLabel: string) => {
        event.dataTransfer.setData('application/reactflow/type', nodeType);
        event.dataTransfer.setData('application/reactflow/label', nodeLabel);
        event.dataTransfer.effectAllowed = 'move';
    };

    const categories = [
        {
            title: "Gatilhos & Entradas",
            items: [
                { type: 'trigger', label: 'Início do Fluxo', icon: Zap, color: 'text-amber-500', bg: 'bg-amber-50' }
            ]
        },
        {
            title: "Comunicação",
            items: [
                { type: 'action', label: 'Enviar Mensagem', icon: MessageSquare, color: 'text-blue-500', bg: 'bg-blue-50' },
                { type: 'broadcast', label: 'Disparo em Massa', icon: Megaphone, color: 'text-indigo-500', bg: 'bg-indigo-50' },
                { type: 'handoff', label: 'Transbordo Humano', icon: Users, color: 'text-rose-500', bg: 'bg-rose-50' }
            ]
        },
        {
            title: "Inteligência Artificial",
            items: [
                { type: 'agent', label: 'Agente IA', icon: Bot, color: 'text-purple-600', bg: 'bg-purple-50', desc: 'Cérebro treinado' }
            ]
        },
        {
            title: "Lógica & Controle",
            items: [
                { type: 'logic', label: 'Roteador Lógico', icon: GitBranch, color: 'text-slate-600', bg: 'bg-slate-50' },
                { type: 'split', label: 'Teste A/B', icon: Split, color: 'text-orange-600', bg: 'bg-orange-50' },
                { type: 'delay', label: 'Aguardar', icon: Clock, color: 'text-gray-600', bg: 'bg-gray-50' },
                { type: 'goto', label: 'Ir Para', icon: ArrowRight, color: 'text-cyan-600', bg: 'bg-cyan-50' },
                { type: 'closing', label: 'Finalizar', icon: MousePointerClick, color: 'text-red-600', bg: 'bg-red-50' }
            ]
        }
    ];

    const filteredCategories = categories.map(cat => ({
        ...cat,
        items: cat.items.filter(item => item.label.toLowerCase().includes(searchTerm.toLowerCase()))
    })).filter(cat => cat.items.length > 0);

    return (
        <motion.aside
            animate={{ width: isCollapsed ? 60 : 280 }}
            className="border-r border-gray-200 bg-white/50 backdrop-blur-xl flex flex-col h-full z-20 shadow-xl shadow-gray-200/50 transition-all duration-300"
        >
            {/* Header */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                {!isCollapsed && (
                    <div className="flex items-center gap-2 text-gray-800">
                        <Box size={20} className="text-indigo-600" />
                        <span className="font-bold tracking-tight">Toolbox</span>
                    </div>
                )}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
                >
                    {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                </button>
            </div>

            {/* Search */}
            {!isCollapsed && (
                <div className="p-4 pb-2">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                        <Input
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Buscar ferramenta..."
                            className="pl-9 h-9 bg-white/80 border-gray-200 focus:bg-white transition-all text-sm"
                        />
                    </div>
                </div>
            )}

            {/* List */}
            <div className="flex-1 overflow-hidden">
                <ScrollArea className="h-full px-3 py-2">
                    <div className="space-y-6 pb-6">
                        {filteredCategories.map((category, idx) => (
                            <div key={idx} className="space-y-2">
                                {!isCollapsed && (
                                    <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-2 font-mono">
                                        {category.title}
                                    </h3>
                                )}
                                <div className="space-y-1.5">
                                    {category.items.map((item, itemIdx) => (
                                        <motion.div
                                            key={item.type}
                                            whileHover={{ scale: 1.02, x: 2 }}
                                            whileTap={{ scale: 0.98 }}
                                            onDragStart={(event) => onDragStart(event as any, item.type, item.label)}
                                            draggable
                                            className={`
                                                group flex items-center gap-3 p-2.5 rounded-xl cursor-grab active:cursor-grabbing
                                                border border-transparent hover:border-gray-200 hover:shadow-sm hover:bg-white
                                                transition-all duration-200 relative
                                                ${isCollapsed ? 'justify-center' : ''}
                                            `}
                                        >
                                            <div className={`p-2 rounded-lg ${item.bg} ${item.color} shadow-sm group-hover:shadow transition-shadow`}>
                                                <item.icon size={18} strokeWidth={2} />
                                            </div>

                                            {!isCollapsed && (
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-gray-700 group-hover:text-gray-900 truncate">
                                                        {item.label}
                                                    </p>
                                                    {item.desc && (
                                                        <p className="text-[10px] text-gray-400 truncate">{item.desc}</p>
                                                    )}
                                                </div>
                                            )}

                                            {!isCollapsed && (
                                                <GripVertical size={14} className="text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            )}
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </div>
        </motion.aside>
    );
}
