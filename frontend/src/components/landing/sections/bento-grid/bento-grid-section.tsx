"use client";

import { motion } from "framer-motion";
import { Zap, BarChart3, Puzzle, Globe, ShieldCheck, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/forms/button";
import { cn } from "@/lib/utils";

export function BentoGridSection() {
    return (
        <section className="relative w-full py-24 md:py-32 overflow-hidden bg-white border-t border-gray-100">

            <div className="max-w-[1400px] mx-auto px-4 md:px-12 relative z-10">
                {/* Header */}
                <div className="mb-16 md:mb-24 flex flex-col md:flex-row items-end justify-between gap-8">
                    <div className="max-w-2xl">
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className=" text-3xl md:text-5xl font-extrabold tracking-[-0.04em] text-gray-900 mb-6"
                        >
                            Controle total.{" "}
                            <span className="text-blue-600 drop-shadow-[0_0_20px_rgba(37,99,235,0.2)]">
                                Sem complexidade.
                            </span>
                        </motion.h2>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 }}
                            className="text-lg md:text-[22px] text-gray-600 font-extralight leading-relaxed"
                        >
                            Um ecossistema completo para escalar sua operação de vendas, integrado às ferramentas que você já usa.
                        </motion.p>
                    </div>
                </div>

                {/* Bento Grid */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-auto md:h-[600px]">

                    {/* Large Card: Analytics */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="md:col-span-8 md:row-span-2 h-full"
                    >
                        <Card className="h-full bg-gray-50/50 border-gray-100 shadow-sm hover:shadow-xl transition-all duration-500 group relative overflow-hidden flex flex-col justify-between">
                            <CardHeader className="relative z-10">
                                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mb-6 text-blue-600">
                                    <BarChart3 className="w-6 h-6 stroke-[2]" />
                                </div>
                                <CardTitle className=" text-2xl font-extrabold text-gray-900 mb-2">Analytics em Tempo Real</CardTitle>
                                <CardDescription className="text-gray-600 text-lg font-extralight max-w-md">Monitore conversão, tempo de resposta e qualidade dos leads direto no dashboard.</CardDescription>
                            </CardHeader>

                            {/* Abstract Chart UI */}
                            <div className="relative w-full h-[300px] mt-6 bg-white rounded-tl-[32px] border-t border-l border-gray-200 shadow-sm ml-6 mb-[-2px] p-6 flex flex-col gap-4 overflow-hidden">
                                <div className="flex items-end justify-between h-32 gap-2 mt-auto px-4 opacity-50">
                                    {[30, 45, 60, 40, 75, 55, 80, 70, 90, 65, 85].map((h, i) => (
                                        <div key={i} className="w-full bg-blue-600/20 rounded-t-sm" style={{ height: `${h}%` }} />
                                    ))}
                                </div>
                                <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent z-10" />
                            </div>

                            {/* Glow */}
                            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-100/40 blur-[80px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/2" />
                        </Card>
                    </motion.div>

                    {/* Small Card: Integrations */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 }}
                        className="md:col-span-4 h-full"
                    >
                        <Card className="h-full bg-white border-gray-100 shadow-sm hover:shadow-xl transition-all duration-500 group relative overflow-hidden flex flex-col">
                            <CardHeader className="relative z-10">
                                <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center mb-4 text-emerald-600">
                                    <Puzzle className="w-5 h-5 stroke-[2]" />
                                </div>
                                <CardTitle className=" text-xl font-extrabold text-gray-900">Integrações Nativas</CardTitle>
                                <CardDescription className="text-gray-600 text-base font-extralight">Conecte com seu CRM favorito em segundos.</CardDescription>
                            </CardHeader>
                            <CardContent className="mt-auto">
                                <div className="flex gap-3 flex-wrap">
                                    {['HubSpot', 'Salesforce', 'Pipedrive', 'Notion'].map((crm) => (
                                        <span key={crm} className="px-3 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-600 border border-gray-200">{crm}</span>
                                    ))}
                                </div>
                            </CardContent>
                            <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-emerald-50/50 blur-[60px] pointer-events-none" />
                        </Card>
                    </motion.div>

                    {/* Medium Card: Setup */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.4 }}
                        className="md:col-span-4 h-full"
                    >
                        <Card className="h-full bg-[#155dfc] border-blue-600 shadow-lg shadow-blue-600/20 hover:shadow-xl hover:shadow-blue-600/30 transition-all duration-500 group relative overflow-hidden text-white flex flex-col justify-center items-center text-center p-6">
                            <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center mb-6">
                                <Zap className="w-8 h-8 text-white fill-current" />
                            </div>
                            <h3 className=" text-2xl font-extrabold mb-2">Setup Relâmpago</h3>
                            <p className="text-blue-100 text-base font-light mb-6">Do zero ao primeiro agendamento em menos de 5 minutos.</p>
                            <Button className="bg-white text-blue-600 hover:bg-blue-50 border-none rounded-full px-6 font-bold shadow-lg">
                                Começar Agora <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>

                            {/* Inner Glow */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-blue-700/50 to-transparent pointer-events-none" />
                        </Card>
                    </motion.div>
                </div>
            </div>
            {/* Glows */}
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gray-50 opacity-60 blur-[100px] pointer-events-none translate-y-1/2 -translate-x-1/2" />
        </section>
    );
}
