"use client";

import { motion, Variants } from "framer-motion";
import { Button } from "@/components/ui/forms/button";
import Link from "next/link";
import { ArrowLeft, Calendar, CheckCircle2, Play } from "lucide-react";

import { Ripple } from "@/components/ui/visuals/ripple";

export function HeroText() {
    // Animation variants for children
    const container: Variants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1, // Reduzido para ser mais rápido
                delayChildren: 0.5    // Aumentado levemente para esperar o PageTransition estabilizar
            }
        }
    };

    const item: Variants = {
        hidden: { opacity: 0, y: 20 },
        show: {
            opacity: 1,
            y: 0,
            transition: {
                ease: "easeOut",
                duration: 0.5
            }
        }
    };

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="w-full max-w-4xl flex flex-col justify-center items-center md:items-start mx-auto md:mx-0"
        >
            <motion.div variants={item} className="relative">
                <Ripple
                    mainCircleSize={300}
                    mainCircleOpacity={0.15}
                    numCircles={6}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0 pointer-events-none"
                    style={{ maskImage: 'none', WebkitMaskImage: 'none' }}
                />

                <h1
                    className="relative z-10 font-[family-name:var(--font-jetbrains-mono)] text-4xl sm:text-5xl md:text-[60px] font-extrabold leading-[1.1] tracking-[-0.04em] mb-6 pointer-events-auto text-center md:text-left text-gray-900"
                >
                    Contrate o primeiro{" "}
                    <span
                        className="text-blue-600"
                        style={{
                            textShadow: '0 0 20px rgba(37,99,235,0.2)'
                        }}
                    >Agente de IA</span>{" "}
                    que realmente entende o seu negócio.
                </h1>
            </motion.div>

            <motion.p
                variants={item}
                className="text-gray-600 text-lg sm:text-xl md:text-[22px] font-extralight max-w-3xl leading-relaxed pointer-events-auto mb-10 text-center md:text-left mx-auto md:mx-0"
            >
                A AXIS transforma seu WhatsApp em uma máquina de receita autônoma. Implante agentes que qualificam leads, agendam reuniões e resolvem tickets com a empatia de um humano e a escala de um software. Sem fluxogramas. Sem scripts.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
                variants={item}
                className="flex flex-col sm:flex-row items-center gap-4 pointer-events-auto relative z-50"
            >
                <Link href="/auth/register">
                    <Button className="h-12 px-8 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-base font-bold shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30 transition-all duration-300 group">
                        Criar meu primeiro agente
                    </Button>
                </Link>
                <Link href="/demo">
                    <Button variant="ghost" className="h-12 px-6 rounded-full text-gray-600 hover:text-gray-900 hover:bg-gray-100/50 text-base font-medium transition-all">
                        <Play className="w-4 h-4 mr-2 fill-current" />
                        Ver agentes em ação
                    </Button>
                </Link>
            </motion.div>
        </motion.div>
    );
}
