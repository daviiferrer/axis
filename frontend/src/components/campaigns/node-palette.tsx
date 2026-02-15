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
    Box,
    LayoutGrid,
    ArrowLeft,
    Layers,
    ClipboardCheck,
    ShieldAlert,
    ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export function NodePalette() {
    const router = useRouter();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState<string | null>(null);

    const onDragStart = (event: React.DragEvent, nodeType: string, nodeLabel: string) => {
        event.dataTransfer.setData('application/reactflow/type', nodeType);
        event.dataTransfer.setData('application/reactflow/label', nodeLabel);
        event.dataTransfer.effectAllowed = 'move';
    };

    const categories = [
        {
            id: 'triggers',
            title: "Gatilhos",
            icon: Zap,
            items: [
                { type: 'trigger', label: 'Início do Fluxo', icon: Zap, color: 'text-emerald-600', bg: 'bg-emerald-50/50', border: 'border-emerald-100' }
            ]
        },
        {
            id: 'ai',
            title: "Inteligência Artificial",
            icon: Bot,
            items: [
                { type: 'agent', label: 'Agente IA', icon: Bot, color: 'text-purple-600', bg: 'bg-purple-50/50', border: 'border-purple-100', desc: 'Cérebro treinado' }
            ]
        },
        {
            id: 'communication',
            title: "Comunicação",
            icon: MessageSquare,
            items: [
                { type: 'action', label: 'Mensagem', icon: MessageSquare, color: 'text-blue-600', bg: 'bg-blue-50/50', border: 'border-blue-100' },
                { type: 'broadcast', label: 'Disparo em Massa', icon: Megaphone, color: 'text-sky-600', bg: 'bg-sky-50/50', border: 'border-sky-100' },
                { type: 'handoff', label: 'Transbordo', icon: Users, color: 'text-rose-600', bg: 'bg-rose-50/50', border: 'border-rose-100' }
            ]
        },
        {
            id: 'logic',
            title: "Lógica & Controle",
            icon: GitBranch,
            items: [
                { type: 'logic', label: 'Roteador', icon: GitBranch, color: 'text-slate-600', bg: 'bg-slate-50/50', border: 'border-slate-100' },
                { type: 'split', label: 'Teste A/B', icon: Split, color: 'text-orange-600', bg: 'bg-orange-50/50', border: 'border-orange-100' },
                { type: 'delay', label: 'Delay', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50/50', border: 'border-amber-100' },
                { type: 'goto', label: 'Ir Para', icon: ArrowRight, color: 'text-cyan-600', bg: 'bg-cyan-50/50', border: 'border-cyan-100' },
                { type: 'goto_campaign', label: 'Ir Para Campanha', icon: ExternalLink, color: 'text-indigo-600', bg: 'bg-indigo-50/50', border: 'border-indigo-100' },
                { type: 'closing', label: 'Finalizar', icon: Flag, color: 'text-red-600', bg: 'bg-red-50/50', border: 'border-red-100' }
            ]
        }
    ];

    const filteredCategories = categories.map(cat => ({
        ...cat,
        items: cat.items.filter(item => item.label.toLowerCase().includes(searchTerm.toLowerCase()))
    })).filter(cat => cat.items.length > 0);

    return (
        <motion.aside
            initial={false}
            animate={{
                width: isCollapsed ? 72 : 280,
                transition: { type: "spring" as const, stiffness: 300, damping: 30 }
            }}
            className="h-full z-40 flex flex-col bg-white/80 backdrop-blur-xl border-r border-gray-200/60 shadow-2xl shadow-gray-200/20 relative"
        >
            {/* Header / Navigation Integration */}
            <div className="flex items-center gap-3 p-4 border-b border-gray-100/50 h-[72px]">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.back()}
                    className="h-9 w-9 rounded-full hover:bg-gray-100/80 text-gray-500 hover:text-gray-900 transition-all shrink-0"
                >
                    <ArrowLeft size={18} strokeWidth={2.5} />
                </Button>

                {!isCollapsed && (
                    <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="flex flex-col overflow-hidden"
                    >
                        <h1 className="text-sm font-bold text-gray-900 tracking-tight leading-none mb-0.5">Editor de Fluxo</h1>
                        <p className="text-[10px] text-gray-500 font-medium truncate">Campanha Ativa</p>
                    </motion.div>
                )}
            </div>

            {/* Search Bar */}
            {!isCollapsed ? (
                <div className="px-4 py-4">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                        <Input
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Buscar nós..."
                            className="pl-9 h-10 bg-gray-50/50 border-gray-200/50 focus:bg-white focus:border-indigo-500/30 focus:ring-4 focus:ring-indigo-500/10 rounded-xl transition-all text-sm font-medium"
                        />
                    </div>
                </div>
            ) : (
                <div className="px-2 py-4 flex justify-center">
                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-gray-100" onClick={() => setIsCollapsed(false)}>
                        <Search size={20} className="text-gray-400" />
                    </Button>
                </div>
            )}

            {/* Component List */}
            <div className="flex-1 overflow-hidden">
                <ScrollArea className="h-full px-4 pb-4">
                    <div className="space-y-6">
                        {filteredCategories.map((category) => (
                            <div key={category.id} className="space-y-3">
                                {!isCollapsed ? (
                                    <div className="flex items-center gap-2 px-1">
                                        <category.icon size={14} className="text-gray-400" />
                                        <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider font-mono">
                                            {category.title}
                                        </h3>
                                    </div>
                                ) : (
                                    <div className="h-px bg-gray-100 mx-2 my-4" />
                                )}

                                <div className={`grid ${isCollapsed ? 'grid-cols-1 gap-3' : 'grid-cols-1 gap-2'}`}>
                                    {category.items.map((item) => (
                                        <motion.div
                                            key={item.type}
                                            layoutId={item.type}
                                            draggable
                                            onDragStart={(e: any) => onDragStart(e, item.type, item.label)}
                                            whileHover={{ scale: 1.02, y: -1, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
                                            whileTap={{ scale: 0.98, cursor: "grabbing" }}
                                            className={`
                                                cursor-grab active:cursor-grabbing group relative
                                                ${isCollapsed
                                                    ? 'w-10 h-10 mx-auto rounded-xl flex items-center justify-center ' + item.bg + ' ' + item.color
                                                    : 'flex items-center gap-3 p-3 rounded-xl bg-white border ' + (item.border || 'border-gray-100') + ' hover:border-gray-300/50 shadow-sm hover:shadow-md transition-all'
                                                }
                                            `}
                                        >
                                            {!isCollapsed ? (
                                                <>
                                                    <div className={`p-2 rounded-lg ${item.bg} ${item.color}`}>
                                                        <item.icon size={18} strokeWidth={2} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-semibold text-gray-700 group-hover:text-gray-900 transition-colors">
                                                            {item.label}
                                                        </p>
                                                        {/* {(item as any).desc && <p className="text-[10px] text-gray-400 truncate">{(item as any).desc}</p>} */}
                                                    </div>
                                                    <GripVertical size={16} className="text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </>
                                            ) : (
                                                <item.icon size={20} strokeWidth={2} />
                                            )}
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </div>

            {/* Footer / Toggle */}
            <div className="p-4 border-t border-gray-100/50">
                <Button
                    variant="ghost"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="w-full flex items-center justify-center gap-2 h-9 text-gray-400 hover:text-gray-900 hover:bg-gray-100/50 rounded-lg transition-all"
                >
                    {isCollapsed ? <ChevronRight size={16} /> : (
                        <>
                            <ChevronLeft size={16} />
                            <span className="text-xs font-medium">Recolher</span>
                        </>
                    )}
                </Button>
            </div>
        </motion.aside>
    );
}
