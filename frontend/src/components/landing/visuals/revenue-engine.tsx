"use client";

import { motion, AnimatePresence } from "motion/react";
import {
    TrendingUp,
    Send,
    CheckCircle2,
    DollarSign,
    Users,
    Zap,
    Sparkles,
    ArrowUpRight
} from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

// --- Configuration ---
const LIVE_EVENTS = [
    { id: 1, type: "outbound", text: "Campanha 'Black Friday' disparada", count: 1542, time: "Agora" },
    { id: 2, type: "chat", text: "Lide respondeu: 'Tenho interesse'", from: "Marcos S.", time: "2s atrás" },
    { id: 3, type: "deal", text: "Pagamento Confirmado", value: "R$ 2.490,00", time: "5s atrás" },
    { id: 4, type: "chat", text: "Agendamento confirmado", from: "Dra. Julia", time: "12s atrás" },
    { id: 5, type: "outbound", text: "Follow-up automático enviado", count: 320, time: "45s atrás" },
];

export function RevenueEngine() {
    return (
        <div className="w-full max-w-7xl mx-auto p-4 md:p-8 relative">

            {/* Ambient Background Glow (Linking to Hero) */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-blue-100/30 blur-[100px] rounded-full -z-10" />

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

                {/* 1. REVENUE HERO CARD (Col 1-8) */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="md:col-span-8 bg-white/80 backdrop-blur-xl border border-white/50 shadow-2xl shadow-blue-900/5 rounded-[2rem] p-8 md:p-10 flex flex-col justify-between min-h-[380px] relative overflow-hidden group hover:border-blue-100 transition-colors"
                >
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="p-2 bg-gradient-to-tr from-blue-100 to-violet-100 rounded-xl">
                                <Sparkles className="w-5 h-5 text-blue-600 fill-blue-600/20" />
                            </div>
                            <span className="text-sm font-bold uppercase tracking-wider text-slate-500">Receita Gerada (Mês)</span>
                        </div>

                        <div className="flex flex-col gap-2">
                            <div className="text-7xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-slate-900 to-slate-700 tracking-tighter">
                                R$ <RollingCounter value={142050} />
                            </div>
                            <div className="flex items-center gap-3">
                                <motion.div
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    whileInView={{ scale: 1, opacity: 1 }}
                                    transition={{ delay: 0.2 }}
                                    className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-emerald-500 text-white text-sm font-bold rounded-full shadow-lg shadow-emerald-500/20"
                                >
                                    <TrendingUp className="w-4 h-4" />
                                    +24% vs mês anterior
                                </motion.div>
                                <span className="text-sm font-medium text-slate-400">ROI Atual: 12.5x</span>
                            </div>
                        </div>
                    </div>

                    {/* Chart Background (Smoother) */}
                    <div className="absolute inset-x-0 bottom-0 h-48 opacity-40 pointer-events-none mix-blend-multiply">
                        <LiveRevenueChart />
                    </div>
                </motion.div>

                {/* 2. OPERATIONAL METRICS (Col 9-12) */}
                <div className="md:col-span-4 flex flex-col gap-6">
                    {/* Active Leads (Deep Blue Card) */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="flex-1 bg-gradient-to-br from-blue-600 to-violet-700 text-white p-8 rounded-[2rem] shadow-xl shadow-blue-600/20 relative overflow-hidden group"
                    >
                        <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:scale-110 transition-transform duration-500">
                            <Users className="w-24 h-24" />
                        </div>

                        <div className="relative z-10 flex flex-col h-full justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                                <span className="text-xs font-bold uppercase tracking-wider text-blue-100">Live Active</span>
                            </div>
                            <div>
                                <div className="text-5xl font-bold tracking-tight mb-1">482</div>
                                <div className="text-sm font-medium text-blue-100">Leads em Negociação</div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Campaigns Running (Clean Card) */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="flex-1 bg-white border border-slate-100 p-8 rounded-[2rem] shadow-lg shadow-slate-200/50 flex flex-col justify-center relative overflow-hidden"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Send className="w-4 h-4 text-slate-400" />
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Outbound</span>
                            </div>
                            <ArrowUpRight className="w-5 h-5 text-slate-300" />
                        </div>
                        <div className="text-3xl font-bold text-slate-900">3 Campanhas</div>
                        <div className="w-full bg-slate-50 h-1.5 mt-6 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-gradient-to-r from-blue-500 to-violet-500"
                                initial={{ width: 0 }}
                                whileInView={{ width: "75%" }}
                                transition={{ duration: 1.5, ease: "circOut" }}
                            />
                        </div>
                    </motion.div>
                </div>

                {/* 3. LIVE ACTIVITY FEED (Bottom Wide - Glassmorphism) */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="md:col-span-12 bg-white/60 backdrop-blur-md border border-white/60 rounded-[2rem] p-1 shadow-lg shadow-slate-200/50"
                >
                    <div className="px-6 py-4 flex justify-between items-center border-b border-slate-100/50">
                        <div className="flex items-center gap-2">
                            <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
                            <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Live Activity Feed</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                            <span className="text-[10px] font-mono text-slate-400">REALTIME</span>
                        </div>
                    </div>
                    <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-6">
                        <ActivityColumn title="Disparos (Outbound)" icon={Send} color="text-blue-500" bg="bg-blue-50" events={LIVE_EVENTS.filter(e => e.type === 'outbound')} />
                        <ActivityColumn title="Engajamento (Chat)" icon={Users} color="text-violet-500" bg="bg-violet-50" events={LIVE_EVENTS.filter(e => e.type === 'chat')} />
                        <ActivityColumn title="Conversão (Deals)" icon={CheckCircle2} color="text-emerald-500" bg="bg-emerald-50" events={LIVE_EVENTS.filter(e => e.type === 'deal')} />
                    </div>
                </motion.div>

            </div>
        </div>
    );
}

// --- Subcomponents ---

function RollingCounter({ value }: { value: number }) {
    return <span>{value.toLocaleString('pt-BR')}</span>;
}

function LiveRevenueChart() {
    return (
        <svg className="w-full h-full" viewBox="0 0 400 100" preserveAspectRatio="none">
            <defs>
                <linearGradient id="gradRevenue" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#4f46e5" stopOpacity="0" />
                </linearGradient>
            </defs>
            <path d="M0,100 L0,60 Q50,80 100,50 T200,40 T300,20 L400,5 V100 Z" fill="url(#gradRevenue)" />
            <path d="M0,60 Q50,80 100,50 T200,40 T300,20 L400,5" fill="none" stroke="#4f46e5" strokeWidth="3" strokeLinecap="round" />
        </svg>
    )
}

function ActivityColumn({ title, icon: Icon, color, bg, events }: any) {
    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
                <div className={cn("p-1.5 rounded-lg", bg)}>
                    <Icon className={cn("w-3 h-3", color)} />
                </div>
                <div className="text-[10px] font-bold uppercase text-slate-400">{title}</div>
            </div>
            <div className="flex flex-col gap-3">
                {events.map((e: any) => (
                    <div key={e.id} className="bg-white/50 hover:bg-white p-3 rounded-2xl border border-slate-100 transition-all flex items-start gap-3 group">
                        <div className={cn("w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 opacity-50 group-hover:opacity-100 transition-opacity", color.replace('text-', 'bg-'))} />
                        <div>
                            <div className="text-xs font-semibold text-slate-700 leading-tight group-hover:text-slate-900 transition-colors">{e.text}</div>
                            <div className="text-[10px] text-slate-400 mt-1">{e.value || e.from || `${e.count} msgs`} • {e.time}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
