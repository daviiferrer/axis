"use client";

import { motion } from "motion/react";
import {
    MessageCircle,
    Bot,
    BarChart3,
    ArrowRight,
    Target,
    Zap,
    Users
} from "lucide-react";
import { cn } from "@/lib/utils";

const FEATURES = [
    {
        id: "outbound",
        title: "Disparos em Massa",
        description: "Aqueça sua base e reative clientes antigos. Envie milhares de mensagens no WhatsApp sem risco de bloqueio (API Oficial).",
        icon: Target,
        color: "text-blue-600",
        bg: "bg-blue-50",
        border: "group-hover:border-blue-200",
        shadow: "group-hover:shadow-blue-500/10"
    },
    {
        id: "ai",
        title: "IA Generativa Humanizada",
        description: "Não parece robô. Nossa IA entende áudio, gírias e contexto. Qualifica leads e agenda reuniões como seu melhor vendedor.",
        icon: Bot,
        color: "text-violet-600",
        bg: "bg-violet-50",
        border: "group-hover:border-violet-200",
        shadow: "group-hover:shadow-violet-500/10"
    },
    {
        id: "crm",
        title: "CRM & Funil Conversacional",
        description: "Adeus planilhas. Centralize todos os atendimentos em um Kanban visual. Saiba exatamente quem está pronto para comprar.",
        icon: BarChart3,
        color: "text-emerald-600",
        bg: "bg-emerald-50",
        border: "group-hover:border-emerald-200",
        shadow: "group-hover:shadow-emerald-500/10"
    }
];

export function CoreFeatures() {
    return (
        <div className="w-full max-w-7xl mx-auto px-4 md:px-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                {FEATURES.map((feature, index) => (
                    <motion.div
                        key={feature.id}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={cn(
                            "group relative p-8 bg-white border border-slate-100 rounded-[2rem] shadow-lg shadow-slate-200/50 transition-all duration-300 hover:-translate-y-1",
                            feature.border,
                            feature.shadow
                        )}
                    >
                        {/* Icon */}
                        <div className={cn(
                            "w-12 h-12 rounded-xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110",
                            feature.bg
                        )}>
                            <feature.icon className={cn("w-6 h-6", feature.color)} />
                        </div>

                        {/* Content */}
                        <h3 className="text-xl font-bold text-slate-900 mb-3 tracking-tight">
                            {feature.title}
                        </h3>
                        <p className="text-slate-500 leading-relaxed mb-6">
                            {feature.description}
                        </p>

                        {/* Micro-Interaction Link */}
                        <div className="flex items-center gap-2 text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0 duration-300">
                            <span className={cn(feature.color)}>Saiba mais</span>
                            <ArrowRight className={cn("w-4 h-4", feature.color)} />
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
