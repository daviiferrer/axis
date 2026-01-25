"use client";

import { motion, AnimatePresence } from "motion/react";
import {
    TrendingUp,
    Users,
    Calendar,
    DollarSign,
    CheckCircle2,
    Zap,
    Clock
} from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

// --- Configuration ---
const NOTIFICATIONS = [
    { type: "deal", text: "Venda Fechada: R$ 12.500", time: "Agora" },
    { type: "booking", text: "Reunião Agendada: Marcos S.", time: "2 min" },
    { type: "lead", text: "Novo Lead Qualificado (Alto Valor)", time: "5 min" },
    { type: "optimization", text: "ROI de Anúncios subiu para 4.2x", time: "12 min" },
    { type: "deal", text: "Proposta Aceita: R$ 8.900", time: "15 min" },
];

export function SmartBusinessGrid() {
    return (
        <div className="w-full max-w-6xl mx-auto p-4 md:p-8">
            <div className="grid grid-cols-1 md:grid-cols-12 auto-rows-min gap-4 md:gap-6">

                {/* 1. REVENUE COMMAND CENTER (Big Chart) - COL 8 */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    className="md:col-span-8 bg-white border border-slate-100 rounded-none shadow-xl overflow-hidden relative group min-h-[300px] flex flex-col"
                >
                    <div className="p-6 border-b border-slate-50 flex justify-between items-start">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <div className="p-1.5 bg-emerald-50 rounded-md">
                                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                                </div>
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Receita Gerada (IA)</span>
                            </div>
                            <div className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mt-2 flex items-baseline gap-2">
                                R$ <Counter value={142050} />
                                <span className="text-sm font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">+24% este mês</span>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 border border-slate-200 rounded-full text-[10px] font-bold text-slate-500 uppercase">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Live
                            </div>
                        </div>
                    </div>

                    {/* Simulated Chart Area */}
                    <div className="flex-1 relative w-full h-full min-h-[200px] mt-4 px-4 overflow-hidden">
                        <div className="absolute bottom-0 left-0 right-0 h-[200px] opacity-10 bg-gradient-to-t from-emerald-500 to-transparent" />
                        <LiveLineChart />
                    </div>
                </motion.div>

                {/* 2. LIVE FEED (Notifications) - COL 4 */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="md:col-span-4 bg-slate-50 border border-slate-200 rounded-none shadow-sm p-0 flex flex-col relative overflow-hidden"
                >
                    <div className="p-5 border-b border-slate-200 bg-white/50 backdrop-blur-sm z-10">
                        <div className="flex items-center gap-2">
                            <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Live Actions</span>
                        </div>
                    </div>

                    <div className="flex-1 p-4 flex flex-col gap-3 overflow-hidden relative">
                        <NotificationFeed />
                        {/* Fade overlay */}
                        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-slate-50 to-transparent pointer-events-none" />
                    </div>
                </motion.div>

                {/* 3. AGENT EFFICIENCY METRICS (Bottom Row) */}
                <div className="md:col-span-12 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                    <MetricCard
                        icon={Users}
                        color="text-blue-600"
                        bg="bg-blue-50"
                        label="Agentes Ativos"
                        value="12"
                        sub="Simultâneos"
                        delay={0.2}
                    />
                    <MetricCard
                        icon={Clock}
                        color="text-purple-600"
                        bg="bg-purple-50"
                        label="Tempo de Resposta"
                        value="1.2s"
                        sub="Média Global"
                        delay={0.3}
                    />
                    <MetricCard
                        icon={CheckCircle2}
                        color="text-emerald-600"
                        bg="bg-emerald-50"
                        label="Taxa de Conversão"
                        value="18.5%"
                        sub="Acima do Mercado (3%)"
                        delay={0.4}
                    />
                </div>

            </div>
        </div>
    );
}

// --- Subcomponents ---

function MetricCard({ icon: Icon, color, bg, label, value, sub, delay }: any) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            className="bg-white border border-slate-100 shadow-lg p-6 flex flex-col gap-4 rounded-none group hover:border-slate-200 transition-colors"
        >
            <div className="flex justify-between items-start">
                <div className={cn("p-2 rounded-md", bg)}>
                    <Icon className={cn("w-5 h-5", color)} />
                </div>
                {label === "Taxa de Conversão" && (
                    <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">Elite Tier</span>
                )}
            </div>
            <div>
                <div className="text-3xl font-black text-slate-900 tracking-tight">{value}</div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wide mt-1">{label}</div>
                <div className="text-xs text-slate-400 mt-2 border-t border-slate-50 pt-2">{sub}</div>
            </div>
        </motion.div>
    )
}

function Counter({ value }: { value: number }) {
    // Simple animated counter logic is complex without dependencies, 
    // sticking to static formatted for robustness, visual pop handled by parent motion
    return <span>{value.toLocaleString('pt-BR')}</span>;
}

function LiveLineChart() {
    return (
        <svg className="w-full h-full overflow-visible" viewBox="0 0 100 50" preserveAspectRatio="none">
            {/* Grid Lines */}
            <line x1="0" y1="10" x2="100" y2="10" stroke="#f1f5f9" strokeWidth="0.5" />
            <line x1="0" y1="30" x2="100" y2="30" stroke="#f1f5f9" strokeWidth="0.5" />

            {/* The Growth Line */}
            <motion.path
                d="M0 45 C 20 40, 40 45, 60 25 S 80 10, 100 5"
                fill="none"
                stroke="#10b981"
                strokeWidth="1.5"
                initial={{ pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                transition={{ duration: 2, ease: "easeOut" }}
                className="drop-shadow-md"
            />

            {/* Pulsing Dots at Key Points */}
            <motion.circle cx="60" cy="25" r="1.5" fill="white" stroke="#10b981" strokeWidth="0.5" initial={{ scale: 0 }} whileInView={{ scale: 1 }} transition={{ delay: 1 }} />
            <motion.circle cx="100" cy="5" r="2" fill="#10b981" initial={{ scale: 0 }} whileInView={{ scale: [1, 1.5, 1] }} transition={{ delay: 2, repeat: Infinity }} />
        </svg>
    )
}

function NotificationFeed() {
    const [notifications, setNotifications] = useState(NOTIFICATIONS.slice(0, 3));

    useEffect(() => {
        const interval = setInterval(() => {
            const random = NOTIFICATIONS[Math.floor(Math.random() * NOTIFICATIONS.length)];
            setNotifications(prev => [random, ...prev].slice(0, 5));
        }, 3500);
        return () => clearInterval(interval);
    }, []);

    // Defensive check
    if (!notifications) return null;

    return (
        <div className="flex flex-col gap-3">
            <AnimatePresence mode="popLayout">
                {notifications.map((notif, i) => (
                    <motion.div
                        key={`${notif.text}-${i}`}
                        initial={{ opacity: 0, x: -20, height: 0 }}
                        animate={{ opacity: 1, x: 0, height: "auto" }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="bg-white p-3 border border-slate-100 shadow-sm flex items-start gap-3 rounded-none"
                    >
                        <div className={cn(
                            "mt-0.5 w-2 h-2 rounded-full shrink-0",
                            notif.type === 'deal' ? "bg-emerald-500" :
                                notif.type === 'lead' ? "bg-blue-500" : "bg-orange-400"
                        )} />
                        <div>
                            <div className="text-xs font-bold text-slate-700 leading-tight">{notif.text}</div>
                            <div className="text-[10px] text-slate-400 font-medium mt-1 uppercase">{notif.type} • {notif.time}</div>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    )
}
