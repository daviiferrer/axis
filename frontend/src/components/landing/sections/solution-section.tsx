"use client";

import { motion } from "motion/react";
import { ScrollReveal } from "@/components/ui/visuals/scroll-reveal";
import { ArrowRight, Zap } from "lucide-react";

import { CoreFeatures } from "@/components/landing/sections/core-features";

export function SolutionSection() {
    return (
        <section className="relative w-full flex flex-col items-center justify-center py-24 px-4 bg-white overflow-hidden">

            <div className="max-w-7xl mx-auto w-full relative z-10">

                {/* 1. Header: The Context */}
                <div className="text-center mb-16 md:mb-20 px-4">
                    <ScrollReveal width="100%">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 border border-slate-100 bg-slate-50 text-slate-600 text-[10px] font-bold tracking-[0.2em] uppercase mb-6 rounded-full">
                            <Zap className="w-3 h-3 text-blue-600" />
                            A Plataforma Completa
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6 tracking-tight">
                            Tudo o que você precisa <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-violet-600">para vender no automático.</span>
                        </h2>
                        <p className="text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
                            Substitua 5 ferramentas desconexas por uma única inteligência central.
                            Do primeiro "Oi" até o dinheiro na conta.
                        </p>
                    </ScrollReveal>
                </div>

                {/* 2. Characteristics Cards (Context) */}
                <ScrollReveal mode="fade-up" delay={0.2} width="100%">
                    <CoreFeatures />
                </ScrollReveal>

            </div>
        </section>
    );
}
