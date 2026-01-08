"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Calendar, CheckCircle2, Play } from "lucide-react";

export function HeroText() {
    // Animation variants for children
    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2, // Time between each child starting
                delayChildren: 0.3 // Delay before starting sequence
            }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20, filter: "blur(10px)" },
        show: {
            opacity: 1,
            y: 0,
            filter: "blur(0px)",
            transition: {
                type: "spring",
                damping: 20,
                stiffness: 100
            }
        }
    };

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="w-full max-w-2xl md:max-w-[55vw] lg:max-w-[50vw] md:mt-[5vh] z-30 relative pointer-events-none md:absolute md:top-1/2 md:-translate-y-1/2 flex flex-col justify-center items-center md:items-start mx-auto md:mx-0"
        >
            <motion.h1
                variants={item}
                className="font-[family-name:var(--font-jetbrains-mono)] text-4xl sm:text-5xl md:text-[60px] font-bold leading-[1.1] tracking-[-0.04em] mb-6 pointer-events-auto text-center md:text-left text-white"
            >
                Crie uma equipe de{" "}
                <span
                    className="text-purple-400"
                    style={{
                        textShadow: '0 0 15px rgba(139,92,246,0.4), 0 0 30px rgba(139,92,246,0.2)'
                    }}
                >especialistas digitais</span>{" "}
                que pensam, sentem e vendem por você.
            </motion.h1>

            <motion.p
                variants={item}
                className="text-gray-400 text-lg sm:text-xl md:text-[22px] font-extralight max-w-3xl leading-relaxed pointer-events-auto mb-10 text-center md:text-left mx-auto md:mx-0"
            >
                Do SDR que qualifica leads ao Suporte que resolve objeções em segundos.<br className="hidden md:inline" />
                Crie e gerencie múltiplos agentes com personalidades únicas e{" "}
                <span className="text-purple-300/80">inteligência emocional</span>.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
                variants={item}
                className="flex flex-col sm:flex-row items-center gap-4 pointer-events-auto"
            >
                <Link href="/auth/register">
                    <Button className="h-12 px-8 rounded-full bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-base font-bold shadow-[0_0_40px_-5px_rgba(139,92,246,0.6)] hover:shadow-[0_0_60px_-5px_rgba(139,92,246,0.8)] transition-all duration-300 group ring-1 ring-white/20">
                        Criar meu primeiro agente
                    </Button>
                </Link>
                <Link href="/demo">
                    <Button variant="ghost" className="h-12 px-6 rounded-full text-gray-200 hover:text-white hover:bg-white/10 text-base font-medium transition-all">
                        <Play className="w-4 h-4 mr-2 fill-current" />
                        Ver agentes em ação
                    </Button>
                </Link>
            </motion.div>
        </motion.div>
    );
}
