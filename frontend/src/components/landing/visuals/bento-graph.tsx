"use client";

import { motion, AnimatePresence } from "motion/react";
import {
    MessageSquare,
    Bot,
    Database,
    CheckCircle2,
    ArrowRight,
    Terminal,
    Cpu,
    Activity
} from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

// --- Configuration ---
const CHAT_SEQUENCE = [
    { role: "user", text: "Olá, gostaria de saber o preço." },
    { role: "ai", text: "Claro! Para qual volume de leads você precisa?" },
    { role: "user", text: "Aprox 5000/mês." },
];

const LOG_SEQUENCE = [
    "> INITIALIZING_AGENT_GRAPH...",
    "> NODE: Supervisor (Thinking...)",
    "> CONTEXT: High intent detected",
    "> ACTION: Qualify Lead (Budget > 5k)",
    "> RESULT: QUALIFIED",
    "> NEXT: Handover to Sales"
];

export function BentoGraph() {
    return (
        <div className="w-full max-w-6xl mx-auto p-4 md:p-8">
            <div className="grid grid-cols-1 md:grid-cols-12 grid-rows-auto gap-4 md:gap-6 h-[800px] md:h-[600px]">

                {/* 1. INPUT STREAM (WhatsApp) - COL 4 */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    className="md:col-span-4 bg-white border border-slate-200 rounded-none shadow-sm relative overflow-hidden flex flex-col group hover:border-slate-300 transition-colors"
                >
                    <BentoHeader icon={MessageSquare} label="Input Stream" color="text-green-600" />
                    <div className="flex-1 p-4 bg-slate-50/50 flex flex-col gap-3 font-mono text-xs overflow-hidden relative">
                        <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px] opacity-20" />
                        <ChatSimulator />
                    </div>
                </motion.div>

                {/* 2. THE BRAIN (LangGraph Execution) - COL 5 */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="md:col-span-5 bg-[#0f172a] border border-slate-800 rounded-none shadow-2xl relative overflow-hidden flex flex-col text-slate-300 group"
                >
                    <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-[#020617]">
                        <div className="flex items-center gap-2">
                            <Cpu className="w-4 h-4 text-blue-500 animate-pulse" />
                            <span className="text-xs font-bold uppercase tracking-wider text-blue-400">LangGraph Kernel</span>
                        </div>
                        <div className="flex gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-red-500/20" />
                            <div className="w-2 h-2 rounded-full bg-yellow-500/20" />
                            <div className="w-2 h-2 rounded-full bg-green-500" />
                        </div>
                    </div>

                    <div className="flex-1 p-4 font-mono text-xs md:text-sm text-green-400/90 overflow-hidden relative leading-relaxed">
                        <TerminalLogSimulator />

                        {/* Scanline Effect */}
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent h-4 animate-scan pointer-events-none" />
                    </div>

                    <div className="p-3 border-t border-slate-800 bg-[#0f172a] text-[10px] flex justify-between text-slate-500">
                        <span>CPU: 12%</span>
                        <span>MEM: 248MB</span>
                        <span>LATENCY: 42ms</span>
                    </div>
                </motion.div>

                {/* 3. METRICS / ANALYTICS - COL 3 (Stacked) */}
                <div className="md:col-span-3 flex flex-col gap-4 md:gap-6">
                    {/* Qualification Score */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="flex-1 bg-white border border-slate-200 rounded-none shadow-sm p-5 flex flex-col justify-between group hover:-translate-y-1 transition-transform duration-300"
                    >
                        <BentoHeader icon={CheckCircle2} label="Lead Score" color="text-emerald-600" />
                        <div className="flex items-end gap-2 mt-2">
                            <span className="text-5xl font-black text-slate-900 tracking-tighter">98</span>
                            <span className="text-sm font-medium text-emerald-600 mb-2">/100</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 mt-4 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-emerald-500"
                                initial={{ width: 0 }}
                                whileInView={{ width: "98%" }}
                                transition={{ duration: 1.5, ease: "circOut" }}
                            />
                        </div>
                    </motion.div>

                    {/* Active State */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        className="flex-1 bg-white border border-slate-200 rounded-none shadow-sm p-5 flex flex-col justify-between group hover:-translate-y-1 transition-transform duration-300"
                    >
                        <BentoHeader icon={Activity} label="Status" color="text-orange-500" />
                        <div className="flex items-center gap-3 mt-4">
                            <div className="relative">
                                <div className="w-3 h-3 bg-orange-500 rounded-full" />
                                <div className="absolute inset-0 bg-orange-500 rounded-full animate-ping opacity-75" />
                            </div>
                            <span className="text-lg font-bold text-slate-700">Closing Deal</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-2">Agent: Negotiation_Bot_v2</p>
                    </motion.div>
                </div>

                {/* 4. CRM SYNC (Bottom Wide) */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="md:col-span-12 h-32 bg-slate-50 border border-slate-200 rounded-none shadow-sm border-dashed flex items-center justify-between px-8 relative overflow-hidden"
                >
                    <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
                        <Database className="w-64 h-64" />
                    </div>

                    <div className="flex items-center gap-4 z-10">
                        <div className="p-3 bg-white border border-slate-200 shadow-sm rounded-none">
                            <Database className="w-6 h-6 text-slate-600" />
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-800">CRM Synchronization</h4>
                            <p className="text-sm text-slate-500">Auto-injecting deal to HubSpot Pipeline</p>
                        </div>
                    </div>

                    <div className="flex gap-8 items-center z-10 hidden md:flex">
                        <MetricItem label="Latency" value="120ms" />
                        <MetricItem label="Fields" value="14 mapped" />
                        <div className="h-8 w-[1px] bg-slate-200" />
                        <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-1 rounded-none border border-emerald-100">
                            <CheckCircle2 className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase">Synced</span>
                        </div>
                    </div>
                </motion.div>

            </div>
        </div>
    );
}

// --- Subcomponents ---

function BentoHeader({ icon: Icon, label, color }: { icon: any, label: string, color: string }) {
    return (
        <div className="flex items-center gap-2 p-4 border-b border-slate-100">
            <Icon className={cn("w-4 h-4", color)} />
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</span>
        </div>
    )
}

function MetricItem({ label, value }: { label: string, value: string }) {
    return (
        <div className="flex flex-col items-end">
            <span className="text-[10px] text-slate-400 uppercase font-bold">{label}</span>
            <span className="text-sm font-mono text-slate-700">{value}</span>
        </div>
    )
}

function ChatSimulator() {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setIndex(i => (i + 1) % (CHAT_SEQUENCE.length + 1));
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    // Only show messages up to current index
    const visibleMessages = CHAT_SEQUENCE.slice(0, index === 0 ? 0 : index);

    return (
        <div className="flex flex-col gap-3 h-full justify-end pb-2">
            <AnimatePresence>
                {visibleMessages.map((msg, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, x: msg.role === 'user' ? -10 : 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={cn(
                            "max-w-[85%] p-3 rounded-none text-xs leading-relaxed shadow-sm border",
                            msg.role === 'user'
                                ? "self-start bg-white border-slate-200 text-slate-700 rounded-tr-lg rounded-br-lg rounded-bl-lg"
                                : "self-end bg-slate-900 border-slate-900 text-white rounded-tl-lg rounded-bl-lg rounded-br-lg"
                        )}
                    >
                        {msg.text}
                    </motion.div>
                ))}
            </AnimatePresence>
            {index < CHAT_SEQUENCE.length && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[10px] text-slate-400 p-1">
                    typing...
                </motion.div>
            )}
        </div>
    )
}

function TerminalLogSimulator() {
    const [logs, setLogs] = useState<string[]>([]);

    useEffect(() => {
        let currentIndex = 0;
        const interval = setInterval(() => {
            if (currentIndex < LOG_SEQUENCE.length) {
                const nextLog = LOG_SEQUENCE[currentIndex];
                if (nextLog) {
                    setLogs(prev => [...prev.slice(-7), nextLog]);
                }
                currentIndex++;
            } else {
                // Reset loop
                setLogs([]);
                currentIndex = 0;
            }
        }, 800);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex flex-col gap-1.5 h-full font-mono">
            {logs.map((log, i) => {
                if (!log) return null;
                return (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="break-all"
                    >
                        <span className="opacity-50 mr-2">{new Date().toLocaleTimeString().split(' ')[0]}</span>
                        <span className={log.includes('ERROR') ? 'text-red-400' : log.includes('ACTION') ? 'text-yellow-400' : 'text-green-400'}>
                            {log}
                        </span>
                    </motion.div>
                );
            })}
            <motion.div
                animate={{ opacity: [0, 1, 0] }}
                transition={{ repeat: Infinity, duration: 0.8 }}
                className="w-2 h-4 bg-green-500 mt-1"
            />
        </div>
    )
}
