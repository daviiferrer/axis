"use client";

import { motion } from "framer-motion";
import { Bot, DollarSign, MessageSquare, Phone } from "lucide-react";
import { useEffect, useState } from "react";

// Simplified Mock Data for Animation
const MOCK_LEADS = [
    { id: 1, name: "Carlos Eduardo", phone: "+55 11 98888-1111", value: 2500, initialCol: 0, targetCol: 1, delay: 1 },
    { id: 2, name: "Mariana Silva", phone: "+55 21 97777-2222", value: 4200, initialCol: 1, targetCol: 2, delay: 3 },
    { id: 3, name: "Tech Solutions", phone: "+55 31 96666-3333", value: 15000, initialCol: 0, targetCol: 2, delay: 5 },
    { id: 4, name: "Ana Beatriz", phone: "+55 41 95555-4444", value: 800, initialCol: 0, targetCol: 0, delay: 0 },
];

const COLUMNS = [
    { id: 0, title: "Novos", color: "bg-blue-500/10 border-blue-500/20" },
    { id: 1, title: "Em Negociação", color: "bg-purple-500/10 border-purple-500/20", icon: <Bot className="w-3 h-3 text-purple-600" /> },
    { id: 2, title: "Fechamento", color: "bg-green-500/10 border-green-500/20" }
];

export function AiKanbanAnimation() {
    const [animatedLeads, setAnimatedLeads] = useState(MOCK_LEADS);

    useEffect(() => {
        // Trigger animations after mount
        const timers = MOCK_LEADS.map((lead, index) => {
            if (lead.initialCol !== lead.targetCol) {
                return setTimeout(() => {
                    setAnimatedLeads(prev => prev.map(l => l.id === lead.id ? { ...l, initialCol: lead.targetCol } : l));
                }, lead.delay * 1000 + 1000);
            }
            return null;
        });

        return () => timers.forEach(t => t && clearTimeout(t));
    }, []);

    const formatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

    return (
        <div className="w-full max-w-2xl mx-auto p-4 perspective-1000">
            <div className="flex gap-4 transform rotate-y-[-5deg] rotate-x-[5deg] scale-[0.85] transform-origin-center">
                {COLUMNS.map((col) => (
                    <div key={col.id} className={`flex-1 flex flex-col rounded-xl border bg-white/60 backdrop-blur-md shadow-xl ${col.color} min-h-[400px]`}>
                        <div className="p-3 border-b border-black/5 flex items-center justify-between bg-white/40 rounded-t-xl">
                            <h3 className="font-semibold text-sm flex items-center gap-1.5 text-gray-800">
                                {col.icon}
                                {col.title}
                            </h3>
                            <span className="text-xs font-mono bg-white/50 px-2 py-0.5 rounded-full text-gray-500 shadow-sm border border-gray-100">
                                {animatedLeads.filter(l => l.initialCol === col.id).length}
                            </span>
                        </div>
                        <div className="p-3 flex flex-col gap-3 relative flex-1">
                            {animatedLeads.filter(l => l.initialCol === col.id).map((lead) => (
                                <motion.div
                                    key={lead.id}
                                    layout
                                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                    className={`bg-white p-3 rounded-lg border shadow-sm relative ${col.id === 1 ? 'ring-1 ring-purple-400/50 shadow-purple-500/10' : 'border-gray-100'}`}
                                >
                                    {col.id === 1 && (
                                        <motion.div
                                            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                                            transition={{ repeat: Infinity, duration: 1.5 }}
                                            className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-purple-500 rounded-full"
                                        />
                                    )}
                                    <div className="font-semibold text-sm text-gray-900 truncate pr-4">{lead.name}</div>
                                    <div className="text-[10px] text-gray-500 flex items-center gap-1 mt-1">
                                        <Phone className="w-2.5 h-2.5" /> {lead.phone}
                                    </div>
                                    <div className="mt-2 flex">
                                        <div className="text-[10px] flex items-center gap-0.5 bg-green-50 text-green-700 px-1.5 py-0.5 rounded-md border border-green-100 font-medium">
                                            <DollarSign className="w-2.5 h-2.5" />
                                            {formatter.format(lead.value)}
                                        </div>
                                    </div>
                                    {col.id === 1 && (
                                        <div className="mt-2 pt-2 border-t border-gray-50 text-[9px] text-purple-600 flex items-center gap-1 font-medium italic">
                                            <Bot className="w-3 h-3" /> IA Engajada...
                                        </div>
                                    )}
                                    {col.id === 2 && (
                                        <div className="mt-2 pt-2 border-t border-gray-50 text-[9px] text-green-600 flex items-center gap-1 font-medium">
                                            Venda Concluída 🎉
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
