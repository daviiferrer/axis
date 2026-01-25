"use client";

import { motion } from "motion/react";
import { Bot, MessageSquare, Database, Calendar, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

// --- Types ---
type NodeType = "trigger" | "agent" | "logic" | "action";

interface GraphNode {
    id: string;
    label: string;
    type: NodeType;
    icon: any;
    x: number;
    y: number;
    description: string;
}

// --- Configuration ---
const NODES: GraphNode[] = [
    { id: "trigger", label: "WhatsApp Msg", type: "trigger", icon: MessageSquare, x: 50, y: 150, description: "Lead envia 'Olá'" },
    { id: "supervisor", label: "AI Supervisor", type: "agent", icon: Bot, x: 250, y: 150, description: "Analisa intenção e contexto" },
    { id: "logic", label: "Qualificação", type: "logic", icon: CheckCircle2, x: 450, y: 50, description: "Verifica budget > R$ 5k" },
    { id: "crm", label: "Update CRM", type: "action", icon: Database, x: 650, y: 150, description: "Salva dados no PipeDrive" },
    { id: "booking", label: "Agendamento", type: "action", icon: Calendar, x: 800, y: 150, description: "Agenda reunião" },
];

const EDGES = [
    { source: "trigger", target: "supervisor" },
    { source: "supervisor", target: "logic" },
    { source: "logic", target: "crm" },
    { source: "crm", target: "booking" },
];

export function LiveGraphFlow() {
    return (
        <div className="w-full h-[400px] md:h-[500px] relative bg-slate-50/50 border border-slate-200 rounded-3xl overflow-hidden shadow-sm flex items-center justify-center select-none">

            {/* Grid Background */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />

            <div className="relative w-full max-w-4xl h-full mx-auto flex items-center justify-center p-8">
                {/* SVG Layer for Connections */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                    <defs>
                        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="22" refY="3.5" orient="auto">
                            <polygon points="0 0, 10 3.5, 0 7" fill="#cbd5e1" />
                        </marker>
                    </defs>
                    {EDGES.map((edge, i) => {
                        // Find standard coordinates (simplified for demo, in real app might need refs)
                        // Using percentage-based approximations for the SVG lines relative to the container
                        // NOTE: For a truly responsive SVG connecting div elements, we usually need absolute positioning or refs.
                        // Here we simulate the path for the visual "Flow".
                        return null;
                    })}

                    {/* Animated Path (The Lead's Journey) */}
                    <motion.path
                        d="M 100 250 L 300 250 L 500 150 L 700 250 L 850 250" // Hardcoded path matching the visual layout below
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="3"
                        strokeDasharray="10 5"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1, strokeDashoffset: -200 }}
                        transition={{
                            duration: 4,
                            repeat: Infinity,
                            ease: "linear",
                            repeatDelay: 1
                        }}
                        className="drop-shadow-lg"
                    />
                    <motion.circle
                        r="6"
                        fill="#2563eb"
                        className="z-20"
                    >
                        <motion.animateMotion
                            dur="4s"
                            repeatCount="indefinite"
                            path="M 100 250 L 300 250 L 500 150 L 700 250 L 850 250"
                        />
                    </motion.circle>
                </svg>

                {/* Nodes Layer */}
                <div className="flex justify-between items-center w-full max-w-5xl relative z-10 gap-4">

                    {/* Node 1: Trigger */}
                    <GraphNodeCard
                        icon={MessageSquare}
                        label="WhatsApp"
                        sub="Novo Lead"
                        color="bg-green-500"
                    />

                    {/* Arrow */}
                    <ConnectionLine />

                    {/* Node 2: Supervisor */}
                    <GraphNodeCard
                        icon={Bot}
                        label="Supervisor AI"
                        sub="Reasoning..."
                        color="bg-blue-600"
                        pulse
                    />

                    {/* Arrow */}
                    <ConnectionLine />

                    {/* Branching Logic */}
                    <div className="flex flex-col gap-12 relative">
                        {/* Upper Path */}
                        <GraphNodeCard
                            icon={CheckCircle2}
                            label="Qualificado"
                            sub="Score > 80"
                            color="bg-emerald-500"
                        />
                    </div>

                    <ConnectionLine />

                    {/* Node 4: Action */}
                    <GraphNodeCard
                        icon={Database}
                        label="CRM Sync"
                        sub="Deal Created"
                        color="bg-purple-500"
                    />

                </div>

            </div>

            {/* Floating Label (context) */}
            <div className="absolute bottom-6 left-6 text-xs text-slate-400 font-mono">
                ENGINE: @langchain/langgraph<br />
                STATUS: LIVE EXECUTION
            </div>

        </div>
    );
}

function GraphNodeCard({ icon: Icon, label, sub, color, pulse = false }: { icon: any, label: string, sub: string, color: string, pulse?: boolean }) {
    return (
        <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex flex-col items-center gap-3 relative"
        >
            <div className={cn(
                "w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg text-white relative z-10",
                color
            )}>
                <Icon className="w-8 h-8" />
                {pulse && (
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                    </span>
                )}
            </div>
            <div className="text-center">
                <div className="font-bold text-slate-800 text-sm">{label}</div>
                <div className="text-xs text-slate-500 font-medium bg-white/80 px-2 py-0.5 rounded-full border border-slate-100 shadow-sm mt-1">{sub}</div>
            </div>
        </motion.div>
    );
}

function ConnectionLine() {
    return (
        <div className="h-[2px] w-12 md:w-20 bg-slate-200 relative overflow-hidden rounded-full">
            <motion.div
                className="absolute inset-0 bg-blue-400 w-full"
                initial={{ x: "-100%" }}
                animate={{ x: "100%" }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            />
        </div>
    )
}
