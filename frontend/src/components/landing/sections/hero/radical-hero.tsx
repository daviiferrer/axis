"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { ArrowRight, Play } from "lucide-react";
import Link from "next/link";
import { useRef } from "react";

export function RadicalHero() {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end start"]
    });

    const yText = useTransform(scrollYProgress, [0, 1], [0, 200]);
    const opacityText = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

    return (
        <section ref={containerRef} className="relative min-h-[90vh] flex flex-col justify-center items-center bg-neutral-950 text-white overflow-hidden pt-20">
            {/* Background Texture - Grain */}
            <div className="absolute inset-0 bg-[url('/assets/noise.png')] opacity-[0.03] pointer-events-none" />

            {/* Background Abstract Shapes - Neon Green Glows */}
            <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-[#ccff00] rounded-full blur-[150px] opacity-[0.05] pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-[#ccff00] rounded-full blur-[150px] opacity-[0.03] pointer-events-none" />

            {/* Massive Typography Hero */}
            <motion.div
                style={{ y: yText, opacity: opacityText }}
                className="relative z-10 text-center px-4 max-w-[1400px] mx-auto flex flex-col items-center"
            >
                {/* Pre-headline Badge */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="mb-8 inline-flex items-center gap-2 px-4 py-2 rounded-none border border-neutral-800 bg-neutral-900/50 backdrop-blur-sm"
                >
                    <span className="w-2 h-2 bg-[#ccff00] rounded-full animate-pulse" />
                    <span className="text-sm font-mono text-neutral-400 uppercase tracking-widest">System Status: Predator Mode</span>
                </motion.div>

                {/* Main Headline - Broken Grid / Brutalist */}
                <h1 className="text-6xl md:text-[8rem] leading-[0.9] font-black tracking-tighter uppercase mb-8 mix-blend-screen">
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    >
                        Não perca
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                        className="text-transparent bg-clip-text bg-gradient-to-r from-[#ccff00] to-green-500"
                    >
                        mais vendas
                    </motion.div>
                </h1>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1, delay: 0.4 }}
                    className="text-xl md:text-2xl text-neutral-400 max-w-2xl mx-auto font-light leading-relaxed mb-12"
                >
                    A era do SDR humano acabou. O ÁXIS qualifica, nutre e agenda reuniões em <span className="text-white font-semibold">0 segundos</span>.
                    <br />
                    <span className="text-neutral-500 text-lg mt-2 block">Enquanto você dorme, ele fecha.</span>
                </motion.p>

                {/* Brutalist CTA Buttons */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.6 }}
                    className="flex flex-col md:flex-row gap-6 items-center"
                >
                    <Link
                        href="/auth/register"
                        className="group relative px-8 py-4 bg-[#ccff00] text-black font-bold text-lg uppercase tracking-wide hover:bg-[#bbe000] transition-colors overflow-hidden"
                    >
                        <span className="relative z-10 flex items-center gap-2">
                            Começar Caçada Grátis
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </span>
                        {/* Hover Effect */}
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 transform origin-bottom" />
                    </Link>

                    <button className="group flex items-center gap-3 px-8 py-4 border border-neutral-700 text-white font-mono hover:border-neutral-500 transition-colors">
                        <div className="w-8 h-8 rounded-full border border-current flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Play className="w-3 h-3 fill-current" />
                        </div>
                        <span className="uppercase text-sm tracking-widest">Ver Demo (1m)</span>
                    </button>
                </motion.div>
            </motion.div>

            {/* Scroll Indicator */}
            <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="absolute bottom-10 left-1/2 -translate-x-1/2 text-neutral-600 flex flex-col items-center gap-2"
            >
                <div className="w-[1px] h-12 bg-gradient-to-b from-transparent via-neutral-600 to-transparent" />
                <span className="text-[10px] uppercase tracking-[0.2em]">Scroll to Hunt</span>
            </motion.div>
        </section>
    );
}
