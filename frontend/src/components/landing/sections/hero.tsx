"use client";

import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { HeroAppMock } from "../hero/hero-app-mock";
import { FogBackground } from "@/components/ui/fog";

export function Hero() {
    return (
        <section className="relative w-full min-h-screen pt-16 pb-20 overflow-hidden bg-white flex flex-col items-center">
            {/* Fog Effect - Living atmosphere behind H1 */}
            <FogBackground
                color="#3b82f6"
                opacity={0.15}
                speed={0.5}
            />

            <div className="w-full max-w-6xl mx-auto px-6 relative z-10 flex flex-col items-center text-center">

                {/* Badge */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-100 rounded-full text-blue-700 text-xs font-medium mb-6"
                >
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
                    </span>
                    API Oficial Meta + Inteligência Artificial
                </motion.div>

                {/* Headline */}
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-slate-900 leading-[1.1] mb-6 max-w-4xl"
                >
                    Não é um Chatbot. <br />
                    É o seu <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-violet-600">Melhor Funcionário Digital.</span>
                </motion.h1>

                {/* Subheadline */}
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto mb-10 font-light leading-relaxed"
                >
                    Automatize seu WhatsApp com a empatia de um humano e a precisão da IA.
                    O ÁXIS qualifica, agenda e vende 24/7.
                </motion.p>

                {/* CTA Buttons */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full mb-16"
                >
                    <Button
                        asChild
                        size="lg"
                        className="rounded-full px-8 h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-lg shadow-blue-600/20 transition-all hover:scale-105"
                    >
                        <Link href="/auth/register">
                            Criar Meu Agente Agora
                            <ArrowRight className="ml-2 w-4 h-4" />
                        </Link>
                    </Button>

                    <Button
                        asChild
                        variant="outline"
                        size="lg"
                        className="rounded-full px-8 h-12 border-slate-200 text-slate-700 hover:bg-slate-50 font-medium"
                    >
                        <Link href="#demo">Ver Demonstração</Link>
                    </Button>
                </motion.div>

                {/* The App Mock Visual */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="w-full relative"
                >
                    <div style={{ maskImage: 'linear-gradient(to bottom, black 40%, transparent 85%)', WebkitMaskImage: 'linear-gradient(to bottom, black 40%, transparent 85%)' }}>
                        <HeroAppMock />
                    </div>
                </motion.div>

            </div>
        </section>
    );
}
