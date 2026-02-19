import React, { useState, useEffect } from 'react';
import {
    MessageSquare,
    Bot,
    Zap,
    Clock,
    GitBranch,
    MousePointerClick,
    Users,
    Split,
    ArrowRight,
    Megaphone,
    Search,
    X,
    Plus,
    RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';

interface NodePickerOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    onAddNode: (type: string, label: string) => void;
    position?: { x: number, y: number }; // Optional: for context menu style
}

export function NodePickerOverlay({ isOpen, onClose, onAddNode, position }: NodePickerOverlayProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    // Reset search on open
    useEffect(() => {
        if (isOpen) {
            setSearchTerm('');
            setSelectedCategory(null);
        }
    }, [isOpen]);

    const categories = [
        {
            id: 'trigger',
            title: "Gatilhos & Entradas",
            items: [
                { type: 'trigger', label: 'Início do Fluxo', icon: Zap, color: 'text-amber-500', bg: 'bg-amber-500/10', desc: 'Sessão, Webhook, Manual' }
            ]
        },
        {
            id: 'communication',
            title: "Comunicação",
            items: [
                { type: 'action', label: 'Enviar Mensagem', icon: MessageSquare, color: 'text-blue-500', bg: 'bg-blue-500/10', desc: 'WhatsApp, E-mail' },
                { type: 'broadcast', label: 'Disparo em Massa', icon: Megaphone, color: 'text-indigo-500', bg: 'bg-indigo-500/10', desc: 'Campanhas Ativas' },
                { type: 'followup', label: 'Follow-Up', icon: RefreshCw, color: 'text-teal-500', bg: 'bg-teal-500/10', desc: 'Reengajamento automático' },
                { type: 'handoff', label: 'Transbordo Humano', icon: Users, color: 'text-rose-500', bg: 'bg-rose-500/10', desc: 'Atendimento Manual' }
            ]
        },
        {
            id: 'ai',
            title: "Inteligência Artificial",
            items: [
                { type: 'agent', label: 'Agente IA', icon: Bot, color: 'text-purple-600', bg: 'bg-purple-600/10', desc: 'Cérebro treinado (Gemini)' }
            ]
        },
        {
            id: 'logic',
            title: "Lógica",
            items: [
                { type: 'logic', label: 'Condição IF/ELSE', icon: GitBranch, color: 'text-slate-600', bg: 'bg-slate-600/10', desc: 'Divergir por dados do lead' },
                { type: 'split', label: 'Teste A/B', icon: Split, color: 'text-orange-600', bg: 'bg-orange-600/10', desc: 'Divisão de Tráfego' },
                { type: 'delay', label: 'Aguardar', icon: Clock, color: 'text-gray-600', bg: 'bg-gray-600/10', desc: 'Timer / Delay' },
                { type: 'goto', label: 'Ir Para', icon: ArrowRight, color: 'text-cyan-600', bg: 'bg-cyan-600/10', desc: 'Salto no Fluxo' },
                { type: 'closing', label: 'Finalizar', icon: MousePointerClick, color: 'text-red-600', bg: 'bg-red-600/10', desc: 'Fim da Sessão' }
            ]
        }
    ];

    const filteredCategories = categories.map(cat => ({
        ...cat,
        items: cat.items.filter(item =>
            item.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.desc.toLowerCase().includes(searchTerm.toLowerCase())
        )
    })).filter(cat => cat.items.length > 0);

    // Framer Motion Variants
    const overlayVariants = {
        hidden: { opacity: 0, scale: 0.95 },
        visible: {
            opacity: 1,
            scale: 1,
            transition: { type: "spring" as const, duration: 0.3, bounce: 0.2 }
        },
        exit: { opacity: 0, scale: 0.95, transition: { duration: 0.15 } }
    };

    if (!isOpen) return null;

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm" onClick={onClose}>
            <motion.div
                variants={overlayVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-2xl bg-white/90 dark:bg-zinc-900/95 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-2xl rounded-2xl overflow-hidden flex flex-col max-h-[80vh]"
            >
                {/* Header */}
                <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                        <Search className="w-5 h-5 text-gray-400" />
                        <Input
                            autoFocus
                            placeholder="Buscar nó (ex: Agente, Delay, WhatsApp)..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="border-none bg-transparent shadow-none focus-visible:ring-0 text-lg px-0 h-auto placeholder:text-gray-400"
                        />
                    </div>
                    <div className="text-xs text-gray-400 font-mono hidden sm:block mr-4">ESC to close</div>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <ScrollArea className="flex-1 p-4 bg-gray-50/50 dark:bg-black/20">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4">
                        {filteredCategories.map((category) => (
                            <div key={category.id} className="space-y-3">
                                {filteredCategories.length > 1 && (
                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">
                                        {category.title}
                                    </h3>
                                )}
                                <div className="space-y-2">
                                    {category.items.map((item) => (
                                        <motion.button
                                            key={item.type}
                                            whileHover={{ scale: 1.02, x: 2 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => {
                                                onAddNode(item.type, item.label);
                                                onClose();
                                            }}
                                            className="w-full flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-zinc-800 border border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-800 hover:shadow-md transition-all group text-left"
                                        >
                                            <div className={`p-2.5 rounded-lg ${item.bg} ${item.color} group-hover:scale-110 transition-transform`}>
                                                <item.icon size={20} strokeWidth={2} />
                                            </div>
                                            <div>
                                                <div className="font-semibold text-gray-700 dark:text-gray-200">{item.label}</div>
                                                <div className="text-xs text-gray-400">{item.desc}</div>
                                            </div>
                                        </motion.button>
                                    ))}
                                </div>
                            </div>
                        ))}

                        {filteredCategories.length === 0 && (
                            <div className="col-span-2 text-center py-12 text-gray-400">
                                <Search className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                <p>Nenhum nó encontrado para "{searchTerm}"</p>
                            </div>
                        )}
                    </div>
                </ScrollArea>

                {/* Footer Hint */}
                <div className="p-3 bg-gray-50 dark:bg-black/40 border-t border-gray-100 dark:border-gray-800 text-center text-xs text-gray-400">
                    Dica: Use <strong>Drag & Drop</strong> no Canvas ou clique para inserir rapidamente.
                </div>
            </motion.div>
        </div>
    );
}
