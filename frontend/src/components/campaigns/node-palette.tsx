'use client'

import React, { useState } from 'react';
import {
    MessageSquare,
    Bot,
    Zap,
    Clock,
    GitBranch,
    Users,
    Flag,
    Split,
    ArrowRight,
    Megaphone,
    Search,
    GripVertical,
    ExternalLink,
    RefreshCw
} from 'lucide-react';
import { motion } from 'framer-motion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import { Sidebar, SidebarBody } from '@/components/ui/sidebar';
import Image from 'next/image';
import Link from 'next/link';

export function NodePalette() {
    const router = useRouter();
    const [open, setOpen] = useState(false); // Sidebar state
    const [searchTerm, setSearchTerm] = useState('');

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
                { type: 'trigger', label: 'Início do Fluxo', icon: Zap, color: 'text-emerald-600', bg: 'bg-emerald-50/50', border: 'border-emerald-100', desc: 'Ponto de entrada quando o lead chega' }
            ]
        },
        {
            id: 'ai',
            title: "Inteligência Artificial",
            icon: Bot,
            items: [
                { type: 'agent', label: 'Agente IA', icon: Bot, color: 'text-purple-600', bg: 'bg-purple-50/50', border: 'border-purple-100', desc: 'Conversa e qualifica o lead com IA' }
            ]
        },
        {
            id: 'communication',
            title: "Comunicação",
            icon: MessageSquare,
            items: [
                { type: 'action', label: 'Mensagem', icon: MessageSquare, color: 'text-blue-600', bg: 'bg-blue-50/50', border: 'border-blue-100', desc: 'Envia uma mensagem automática' },
                { type: 'broadcast', label: 'Disparo em Massa', icon: Megaphone, color: 'text-sky-600', bg: 'bg-sky-50/50', border: 'border-sky-100', desc: 'Envia para vários leads de uma vez' },
                { type: 'followup', label: 'Follow-Up', icon: RefreshCw, color: 'text-teal-600', bg: 'bg-teal-50/50', border: 'border-teal-100', desc: 'Recontata o lead após um tempo' },
                { type: 'handoff', label: 'Transbordo', icon: Users, color: 'text-rose-600', bg: 'bg-rose-50/50', border: 'border-rose-100', desc: 'Transfere para atendimento humano' }
            ]
        },
        {
            id: 'logic',
            title: "Lógica & Controle",
            icon: GitBranch,
            items: [
                { type: 'logic', label: 'Condição IF/ELSE', icon: GitBranch, color: 'text-slate-600', bg: 'bg-slate-50/50', border: 'border-slate-100', desc: 'Separa leads por origem, status, etc.' },
                { type: 'split', label: 'Teste A/B', icon: Split, color: 'text-orange-600', bg: 'bg-orange-50/50', border: 'border-orange-100', desc: 'Divide leads aleatoriamente para testar' },
                { type: 'delay', label: 'Esperar', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50/50', border: 'border-amber-100', desc: 'Aguarda um tempo antes de continuar' },
                { type: 'goto', label: 'Ir Para', icon: ArrowRight, color: 'text-cyan-600', bg: 'bg-cyan-50/50', border: 'border-cyan-100', desc: 'Pula para outro ponto do fluxo' },
                { type: 'goto_campaign', label: 'Ir Para Campanha', icon: ExternalLink, color: 'text-indigo-600', bg: 'bg-indigo-50/50', border: 'border-indigo-100', desc: 'Envia o lead para outra campanha' },
                { type: 'closing', label: 'Finalizar', icon: Flag, color: 'text-red-600', bg: 'bg-red-50/50', border: 'border-red-100', desc: 'Encerra o fluxo para este lead' }
            ]
        }
    ];

    const filteredCategories = categories.map(cat => ({
        ...cat,
        items: cat.items.filter(item => item.label.toLowerCase().includes(searchTerm.toLowerCase()))
    })).filter(cat => cat.items.length > 0);

    return (
        <Sidebar open={open} setOpen={setOpen}>
            <SidebarBody className="justify-between gap-10 px-2">
                <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    {/* Custom Logo Logic for Flow Builder */}
                    <div className="flex items-center justify-start">
                        <SidebarLogo open={open} setOpen={setOpen} />
                    </div>

                    {/* Search Bar - Stable Vertical Height */}
                    <div className="mt-4 mb-4 h-9 relative">
                        {open ? (
                            <div className="relative group w-full h-full">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                                <Input
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Buscar..."
                                    className="pl-9 h-full w-full bg-gray-50/50 border-gray-200 focus:bg-white focus:border-blue-500/30 rounded-lg text-xs"
                                />
                            </div>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center cursor-pointer hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition-colors" onClick={() => setOpen(true)}>
                                <Search size={18} className="text-gray-400" />
                            </div>
                        )}
                    </div>

                    {/* Component List */}
                    <div className="mt-4 flex flex-col gap-4 pb-10">
                        {filteredCategories.map((category) => (
                            <div key={category.id} className="space-y-2">
                                {open && (
                                    <div className="flex items-center gap-2 px-1">
                                        <category.icon size={12} className="text-gray-400" />
                                        <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono">
                                            {category.title}
                                        </h3>
                                    </div>
                                )}

                                <div className="flex flex-col gap-2">
                                    {category.items.map((item) => (
                                        <motion.div
                                            key={item.type}
                                            draggable
                                            onDragStart={(e: any) => onDragStart(e, item.type, item.label)}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            className={`
                                                    cursor-grab active:cursor-grabbing group flex items-center p-2 rounded-lg
                                                    hover:bg-gray-200/50 dark:hover:bg-neutral-800 transition-colors
                                                    /* No gap here, handled inside animated wrapper */
                                                `}
                                        >
                                            {/* Icon Wrapper - Always visible, fixed size */}
                                            <div className={`
                                                    w-7 h-7 min-w-[1.75rem] rounded-lg flex items-center justify-center flex-shrink-0
                                                    ${item.bg} ${item.color}
                                                `}>
                                                <item.icon size={18} strokeWidth={2} />
                                            </div>

                                            {/* Animated Content Wrapper - Handles Width, Opacity & "Gap" */}
                                            <motion.div
                                                initial={false}
                                                animate={{
                                                    width: open ? "auto" : 0,
                                                    opacity: open ? 1 : 0
                                                }}
                                                transition={{ duration: 0.2, ease: "easeInOut" }}
                                                className="overflow-hidden whitespace-nowrap"
                                            >
                                                <div className="pl-3 flex items-center justify-between min-w-[140px]">
                                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                                        {item.label}
                                                    </span>
                                                    <GripVertical size={14} className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity ml-auto" />
                                                </div>
                                            </motion.div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </SidebarBody>
        </Sidebar>
    );
}

// Reusing the exact same Logo logic from AppSidebar for consistency
export const SidebarLogo = ({ open, setOpen }: { open: boolean; setOpen: React.Dispatch<React.SetStateAction<boolean>> }) => {
    return (
        <Link
            href="#"
            className="font-normal flex space-x-2 items-center text-sm text-black py-1 relative z-20"
            onClick={(e) => {
                e.preventDefault();
                setOpen(!open);
            }}
        >
            <motion.div
                initial={false}
                animate={{
                    width: open ? "8rem" : "1.6rem",
                }}
                transition={{
                    duration: 0.2,
                    ease: "easeInOut",
                }}
                className="h-6 relative overflow-hidden flex-shrink-0"
            >
                <div className="absolute top-0 left-0 h-full w-32">
                    <Image
                        src="/assets/brand/logo.svg"
                        alt="Axis Logo"
                        fill
                        className="object-contain object-left"
                        priority
                    />
                </div>
            </motion.div>
        </Link>
    );
};
