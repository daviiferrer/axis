"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Clock, DollarSign, UserX } from "lucide-react";
import { NumberTicker } from "@/components/ui/number-ticker";
import { HeroText } from "@/components/landing/hero-text";
import { WhatsappDemo } from "@/components/landing/whatsapp-demo";

export default function Home() {
    return (
        <main className="w-full bg-[#080A10] text-white selection:bg-blue-500/30">
            {/* Hero Section */}
            <section className="relative min-h-screen w-full overflow-hidden flex flex-col md:block">
                {/* Radial Dot Texture - Motion.dev Style */}
                <div
                    className="absolute inset-0 z-0"
                    style={{
                        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)',
                        backgroundSize: '20px 20px',
                        maskImage: 'radial-gradient(ellipse 100% 80% at 50% 30%, black 0%, transparent 70%)',
                        WebkitMaskImage: 'radial-gradient(ellipse 100% 80% at 50% 30%, black 0%, transparent 70%)'
                    }}
                />

                {/* Logo */}
                {/* Header: Logo + Login */}
                <div className="absolute top-6 md:top-8 left-0 right-0 z-50 w-full max-w-[1400px] mx-auto px-4 md:px-12 pointer-events-none flex justify-between items-center">
                    <Link href="/" className="pointer-events-auto">
                        <Image
                            src="/assets/brand/axis-logo.svg"
                            alt="AXIS Logo"
                            width={240}
                            height={80}
                            className="h-16 md:h-24 w-auto opacity-90 hover:opacity-100 transition-opacity drop-shadow-[0_0_25px_rgba(255,255,255,0.15)]"
                        />
                    </Link>

                    <Link href="/auth/login" className="pointer-events-auto px-6 py-2.5 rounded-full bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-all text-sm font-medium backdrop-blur-sm">
                        Entrar
                    </Link>
                </div>

                {/* Main Layout Container - Absolute Overlay for Centering */}
                <div className="relative md:absolute md:inset-0 z-30 w-full max-w-[1400px] mx-auto px-4 md:px-12 pointer-events-none h-full flex flex-col justify-center items-center md:block gap-8 md:gap-0 pt-24 md:pt-0 pb-12 md:pb-0">
                    {/* Text Content - Animated */}
                    <div className="pointer-events-auto">
                        <HeroText />
                    </div>



                    {/* Whatsapp Demo - Animated */}
                    <WhatsappDemo />
                </div>

                {/* Violet Glow - Bottom Right Corner */}
                <div
                    className="absolute bottom-0 right-0 w-[500px] h-[500px] md:w-[1000px] md:h-[1000px] pointer-events-none z-5"
                    style={{
                        background: 'radial-gradient(ellipse 60% 60% at 100% 100%, rgba(139, 92, 246, 0.3) 0%, rgba(139, 92, 246, 0.12) 35%, rgba(139, 92, 246, 0.04) 60%, transparent 80%)',
                        filter: 'blur(100px)'
                    }}
                />

                {/* Bottom Fade Gradient - Smooth transition to next section */}
                <div
                    className="absolute bottom-0 left-0 right-0 h-48 pointer-events-none z-30"
                    style={{
                        background: 'linear-gradient(to bottom, transparent 0%, #080A10 70%, #080A10 100%)'
                    }}
                />
            </section>

            {/* O Problema Section */}
            <section className="min-h-screen bg-gradient-to-b from-[#080A10] via-[#0B0E14] to-[#0B0E14] relative z-40 pt-0 pb-0 px-4 md:px-12 flex flex-col items-center -mt-0 md:-mt-0">
                <div className="max-w-5xl mx-auto w-full text-center">
                    {/* Visual Connector - Subtle Down Arrow or Line */}
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        whileInView={{ opacity: 0.3, height: 48 }}
                        viewport={{ once: true, amount: 0.5 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="w-[1px] bg-gradient-to-b from-transparent to-red-500/50 mx-auto mb-8"
                    />

                    <motion.h2
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.5 }}
                        transition={{ duration: 0.7, ease: "easeOut" }}
                        className="font-[family-name:var(--font-jetbrains-mono)] text-4xl sm:text-5xl md:text-[60px] font-bold leading-[1.1] tracking-[-0.04em] mb-6 text-gray-100"
                    >
                        O custo de <span className="text-[#f64649]">não atender</span> agora
                    </motion.h2>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.5 }}
                        transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
                        className="font-[family-name:var(--font-jetbrains-mono)] text-gray-400 text-lg sm:text-xl md:text-[22px] font-extralight leading-relaxed mb-24 max-w-3xl mx-auto"
                    >
                        Cada minuto de espera é uma venda perdida. Entendemos suas dores.
                    </motion.p>

                    {/* Pain Points - Premium Cards */}
                    <motion.div
                        className="grid grid-cols-1 md:grid-cols-3 gap-[97px] -mt-12"
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: true, amount: 0.2 }}
                        variants={{
                            hidden: { opacity: 0 },
                            show: {
                                opacity: 1,
                                transition: {
                                    delayChildren: 0.2
                                }
                            }
                        }}
                        style={{
                            maskImage: 'linear-gradient(to bottom, black 0%, black 30%, transparent 90%)',
                            WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 30%, transparent 90%)'
                        }}
                    >
                        {/* Card 1 - Lead Esfria */}
                        <motion.div
                            variants={{
                                hidden: { opacity: 0, y: -50, filter: "blur(10px)" },
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
                            }}
                            className="relative group cursor-default"
                        >
                            <div
                                className="relative h-[700px] rounded-3xl p-10 overflow-hidden"
                                style={{ background: 'radial-gradient(circle at center, #12151D 30%, transparent 70%)' }}
                            >
                                {/* Radial Gradient Background */}
                                <div
                                    className="absolute inset-0 opacity-60"
                                    style={{
                                        background: 'radial-gradient(75% 75% at 50% 0%, #f64649 0%, transparent 100%)',
                                        filter: 'blur(100px)'
                                    }}
                                />
                                {/* Noise Texture */}
                                <div
                                    className="absolute inset-0 opacity-20 mix-blend-overlay"
                                    style={{
                                        backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' opacity=\'0.5\'/%3E%3C/svg%3E")'
                                    }}
                                />

                                {/* Content */}
                                <div className="relative z-10">
                                    <div className="absolute -right-8 -top-8 w-40 h-40 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-500">
                                        <Clock className="w-full h-full text-[#f64649]" strokeWidth={1} />
                                    </div>

                                    <motion.div
                                        className="text-6xl md:text-7xl font-black text-[#f64649] mb-4"
                                        initial={{ scale: 0.9 }}
                                        whileInView={{ scale: 1 }}
                                        viewport={{ once: true }}
                                    >
                                        <NumberTicker value={60} suffix="%" />
                                    </motion.div>

                                    <h3 className="text-xl font-bold text-white mb-3">dos leads esfriam</h3>
                                    <p className="text-gray-400/80 leading-relaxed text-sm">
                                        Leads não atendidos nos primeiros 5 minutos. Cada segundo conta no WhatsApp.
                                    </p>
                                </div>
                            </div>
                        </motion.div>

                        {/* Card 2 - Custo do SDR */}
                        <motion.div
                            variants={{
                                hidden: { opacity: 0, y: -50, filter: "blur(10px)" },
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
                            }}
                            className="relative group cursor-default"
                        >
                            <div
                                className="relative h-[700px] rounded-3xl p-10 overflow-hidden"
                                style={{ background: 'radial-gradient(circle at center, #12151D 30%, transparent 70%)' }}
                            >
                                {/* Radial Gradient Background */}
                                <div
                                    className="absolute inset-0 opacity-40"
                                    style={{
                                        background: 'radial-gradient(75% 75% at 50% 0%, #f64649 0%, transparent 100%)',
                                        filter: 'blur(40px)'
                                    }}
                                />
                                {/* Noise Texture */}
                                <div
                                    className="absolute inset-0 opacity-20 mix-blend-overlay"
                                    style={{
                                        backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' opacity=\'0.5\'/%3E%3C/svg%3E")'
                                    }}
                                />

                                {/* Content */}
                                <div className="relative z-10">
                                    <div className="absolute -right-8 -top-8 w-40 h-40 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-500">
                                        <DollarSign className="w-full h-full text-[#f64649]" strokeWidth={1} />
                                    </div>

                                    <motion.div
                                        className="text-6xl md:text-7xl font-black text-[#f64649] mb-4"
                                        initial={{ scale: 0.9 }}
                                        whileInView={{ scale: 1 }}
                                        viewport={{ once: true }}
                                    >
                                        24/7
                                    </motion.div>

                                    <h3 className="text-xl font-bold text-white mb-3">cobertura cara</h3>
                                    <p className="text-gray-400/80 leading-relaxed text-sm">
                                        Equipes para noites e fins de semana são ineficientes. Escalarexige automação.
                                    </p>
                                </div>
                            </div>
                        </motion.div>

                        {/* Card 3 - Follow-up Esquecido */}
                        <motion.div
                            variants={{
                                hidden: { opacity: 0, y: -50, filter: "blur(10px)" },
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
                            }}
                            className="relative group cursor-default"
                        >
                            <div
                                className="relative h-[700px] rounded-3xl p-10 overflow-hidden"
                                style={{ background: 'radial-gradient(circle at center, #12151D 30%, transparent 70%)' }}
                            >
                                {/* Radial Gradient Background */}
                                <div
                                    className="absolute inset-0 opacity-40"
                                    style={{
                                        background: 'radial-gradient(75% 75% at 50% 0%, #f64649 0%, transparent 100%)',
                                        filter: 'blur(40px)'
                                    }}
                                />
                                {/* Noise Texture */}
                                <div
                                    className="absolute inset-0 opacity-20 mix-blend-overlay"
                                    style={{
                                        backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' opacity=\'0.5\'/%3E%3C/svg%3E")'
                                    }}
                                />

                                {/* Content */}
                                <div className="relative z-10">
                                    <div className="absolute -right-8 -top-8 w-40 h-40 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-500">
                                        <UserX className="w-full h-full text-[#f64649]" strokeWidth={1} />
                                    </div>

                                    <motion.div
                                        className="text-6xl md:text-7xl font-black text-[#f64649] mb-4"
                                        initial={{ scale: 0.9 }}
                                        whileInView={{ scale: 1 }}
                                        viewport={{ once: true }}
                                    >
                                        <NumberTicker value={100} suffix="%" delay={0.2} />
                                    </motion.div>

                                    <h3 className="text-xl font-bold text-white mb-3">follow-ups perdidos</h3>
                                    <p className="text-gray-400/80 leading-relaxed text-sm">
                                        Humanos esquecem. Nossa IA garante que nenhum lead fique sem resposta.
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            </section >
        </main >
    );
}
