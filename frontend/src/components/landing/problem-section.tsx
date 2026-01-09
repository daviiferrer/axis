"use client";

import { motion } from "framer-motion";

export function ProblemSection() {
    return (
        <section className="relative w-full bg-transparent overflow-hidden">
            <div className="max-w-[1240px] mx-auto relative z-10">

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.5 }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-32"
                >
                    <h2 className="font-[family-name:var(--font-jetbrains-mono)] text-4xl sm:text-5xl md:text-[60px] font-bold leading-[1.1] tracking-[-0.04em] mb-6 text-gray-900">
                        O custo oculto da ineficiência.
                    </h2>
                    <p className="text-gray-600 text-lg sm:text-xl md:text-[22px] font-extralight max-w-3xl mx-auto leading-relaxed">
                        Sua operação sangra dinheiro em três lugares invisíveis.
                    </p>
                </motion.div>

                {/* The 'Anti-Grid' - Fluid Layout */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 relative">

                    {/* ITEM 1: PIPELINE (Cyan Blob) */}
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: 0.1 }}
                        className="relative flex flex-col items-center text-center space-y-6 md:mt-0"
                    >
                        {/* Organic Shape */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-cyan-100 rounded-full blur-[80px] -z-10 mix-blend-multiply" />

                        {/* Metric */}
                        <div className="text-[100px] leading-none font-bold text-transparent bg-clip-text bg-gradient-to-b from-cyan-400 to-blue-600 tracking-tighter opacity-20">
                            Vazio
                        </div>

                        {/* Text Content */}
                        <div className="relative z-10 max-w-xs mx-auto mt-[-40px]">
                            <h3 className="text-2xl font-bold text-gray-900 mb-4">Pipeline Faminto</h3>
                            <p className="text-gray-600 text-lg leading-relaxed font-light">
                                Depender de indicação ou ads caros é instável.
                                <br />
                                <span className="text-cyan-600 font-medium text-sm mt-2 block">Sem prospecção ativa, a meta não bate.</span>
                            </p>
                        </div>
                    </motion.div>

                    {/* ITEM 2: BAD BOTS (Red Blob) - Staggered Down */}
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                        className="relative flex flex-col items-center text-center space-y-6 md:mt-24" // Staggered
                    >
                        {/* Organic Shape */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-red-100 rounded-full blur-[80px] -z-10 mix-blend-multiply" />

                        {/* Metric */}
                        <div className="text-[100px] leading-none font-bold text-transparent bg-clip-text bg-gradient-to-b from-red-400 to-red-600 tracking-tighter opacity-20">
                            Spam
                        </div>

                        {/* Text Content */}
                        <div className="relative z-10 max-w-xs mx-auto mt-[-40px]">
                            <h3 className="text-2xl font-bold text-gray-900 mb-4">Leads Queimados</h3>
                            <p className="text-gray-600 text-lg leading-relaxed font-light">
                                Automação burra trata CEO como número.
                                <br />
                                <span className="text-red-600 font-medium text-sm mt-2 block">Um "oi sumido" errado destrói sua marca.</span>
                            </p>
                        </div>
                    </motion.div>


                    {/* ITEM 3: FOLLOW UP (Pink Blob) - Staggered Up */}
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: 0.5 }}
                        className="relative flex flex-col items-center text-center space-y-6 md:mt-8"
                    >
                        {/* Organic Shape */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-pink-100 rounded-full blur-[80px] -z-10 mix-blend-multiply" />

                        {/* Metric */}
                        <div className="text-[100px] pt-4 leading-none font-bold text-transparent bg-clip-text bg-gradient-to-b from-pink-400 to-purple-600 tracking-tighter opacity-20">
                            Vácuo
                        </div>

                        {/* Text Content */}
                        <div className="relative z-10 max-w-xs mx-auto mt-[-40px]">
                            <h3 className="text-2xl font-bold text-gray-900 mb-4">O Cemitério de Leads</h3>
                            <p className="text-gray-600 text-lg leading-relaxed font-light">
                                Humanos esquecem. Sem follow-up infinito, você deixa 60% da receita na mesa.
                                <br />
                                <span className="text-pink-600 font-medium text-sm mt-2 block">Dinheiro esquecido no CRM.</span>
                            </p>
                        </div>
                    </motion.div>

                </div>
            </div>
        </section>
    );
}
