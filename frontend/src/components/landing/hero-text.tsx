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
                className="text-4xl sm:text-5xl md:text-[67px] font-bold leading-[1.1] tracking-[-0.04em] mb-6 pointer-events-auto text-center md:text-left text-white"
            >
                Seu melhor SDR trabalhando 24/7{" "}
                <span className="text-blue-500">no WhatsApp</span>
            </motion.h1>

            <motion.p
                variants={item}
                className="text-gray-400 text-lg sm:text-xl md:text-[28px] font-extralight max-w-3xl leading-relaxed pointer-events-auto mb-10 text-center md:text-left mx-auto md:mx-0"
            >
                Pare de perder leads fora do horário comercial.<br className="hidden md:inline" />
                O Áxis agenda reuniões automaticamente para você.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
                variants={item}
                className="flex flex-col sm:flex-row items-center gap-4 pointer-events-auto"
            >
                <Link href="/auth/register">
                    <Button className="h-12 px-8 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-base font-semibold shadow-[0_0_40px_-10px_rgba(37,99,235,0.5)] hover:shadow-[0_0_60px_-10px_rgba(37,99,235,0.6)] transition-all duration-300 group">
                        Começar grátis
                    </Button>
                </Link>
                <Link href="/demo">
                    <Button variant="ghost" className="h-12 px-6 rounded-full text-gray-400 hover:text-white hover:bg-white/5 text-base font-medium transition-all">
                        <Play className="w-4 h-4 mr-2" />
                        Ver o SDR em ação
                    </Button>
                </Link>
            </motion.div>
        </motion.div>
    );
}
