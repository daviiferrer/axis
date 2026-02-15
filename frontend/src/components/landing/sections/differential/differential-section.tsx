"use client";

import { motion } from "framer-motion";
import { BrainCircuit, GitMerge, Fingerprint } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";

const features = [
    {
        icon: BrainCircuit,
        title: "Memória de Elefante (FSM)",
        description: "Enquanto outros bots se perdem, o ÁXIS mantém o contexto. Nossa arquitetura de Máquina de Estados Finitos garante coerência mesmo em conversas complexas.",
        color: "text-blue-600",
        bg: "bg-blue-50",
    },
    {
        icon: GitMerge,
        title: "Anti-Atropelamento",
        description: "Evite mensagens duplicadas. O mecanismo Anti-Race Condition aguarda o cliente parar de digitar para processar o raciocínio completo.",
        color: "text-blue-600",
        bg: "bg-blue-50",
    },
    {
        icon: Fingerprint,
        title: "DNA Imutável",
        description: "Defina a personalidade e ela será respeitada. A camada de DNA garante que o agente nunca saia do personagem, independente da provocação.",
        color: "text-blue-600",
        bg: "bg-blue-50",
    }
];

export function DifferentialSection() {
    return (
        <section className="relative w-full py-24 md:py-32 overflow-hidden bg-white">
            <div className="max-w-[1400px] mx-auto px-4 md:px-12 relative z-10">
                {/* Header */}
                <div className="text-center max-w-3xl mx-auto mb-16 md:mb-24">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className=" text-3xl md:text-5xl font-extrabold tracking-[-0.04em] text-gray-900 mb-6"
                    >
                        Raciocínio Humano.{" "}
                        <span className="text-blue-600 drop-shadow-[0_0_20px_rgba(37,99,235,0.2)]">
                            Velocidade de Máquina.
                        </span>
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-lg md:text-[22px] text-gray-600 font-extralight leading-relaxed"
                    >
                        Esqueça chatbots que travam. O ÁXIS usa uma arquitetura proprietária de Estado Finito para garantir conversas fluidas.
                    </motion.p>
                </div>

                {/* Cards Container */}
                <div className="w-full bg-[#155dfc]/5 rounded-[30px] p-6 md:p-10 border border-[#155dfc]/5">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                        {features.map((feature, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 + 0.2 }}
                                className="group h-full"
                            >
                                <Card className="h-full relative overflow-hidden border-gray-100/50 shadow-sm hover:shadow-[0_20px_40px_-12px_rgba(21,93,252,0.15)] transition-all duration-500 hover:-translate-y-1 bg-white/80 backdrop-blur-sm">
                                    {/* Hover Glow Effect (Violet/Blue) */}
                                    <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-gradient-to-br from-blue-50/50 to-purple-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2" />

                                    <CardHeader className="relative space-y-4">
                                        {/* Icon */}
                                        <div className={cn(
                                            "relative w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 bg-blue-50 text-blue-600",
                                        )}>
                                            <feature.icon className="w-7 h-7 stroke-[1.5]" />
                                        </div>
                                        <CardTitle className=" text-xl font-extrabold text-gray-900 tracking-tight group-hover:text-blue-600 transition-colors duration-300">
                                            {feature.title}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="relative">
                                        <CardDescription className="text-gray-600 text-lg font-extralight leading-relaxed group-hover:text-gray-900 transition-colors duration-300">
                                            {feature.description}
                                        </CardDescription>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Glows */}
            <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-blue-100 opacity-30 blur-[100px] pointer-events-none -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-cyan-50 opacity-50 blur-[100px] pointer-events-none translate-x-1/2 -translate-y-1/2" />
        </section>
    );
}
