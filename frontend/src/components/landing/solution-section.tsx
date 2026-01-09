"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { CheckCircle2, Linkedin, MapPin, Search, Calendar, ShieldCheck, Activity, TrendingUp } from "lucide-react";
import { useRef } from "react";

// --- VISUAL 1: HARVEST ENGINE (Right Edge Fade) ---
function VisualHarvestShowcase() {
    const leads = [
        { name: "Ricardo M.", role: "CEO @ TechFin", source: "linkedin" },
        { name: "Amanda S.", role: "Founder @ Agência Bold", source: "instagram" },
        { name: "Hospital São Lucas", role: "Enterprise Leg", source: "maps" },
        { name: "Roberto D.", role: "Diretor Comercial", source: "linkedin" },
        { name: "Juliana P.", role: "Head de Growth", source: "linkedin" }, // Added item for density
    ];

    return (
        <div className="relative w-full h-full flex items-center justify-end pr-8 md:pr-0">
            {/* Edge Glow - Green Neon leaking from right */}
            <div className="absolute right-[-150px] top-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-cyan-500/30 blur-[120px] rounded-full -z-10" />

            {/* The Content - Staggered Grid leaning right */}
            <div className="flex flex-col gap-4 w-full max-w-md md:mr-[-50px]">
                {leads.map((lead, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, x: 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: i * 0.15 }}
                        className="relative bg-white/90 border border-cyan-200 p-4 rounded-xl flex items-center gap-4 hover:border-cyan-400 transition-colors shadow-lg shadow-cyan-900/5 backdrop-blur-md ml-auto w-[90%]"
                        style={{ marginRight: `${i * 20}px` }} // Waterfall effect to right
                    >
                        <div className="w-10 h-10 rounded-full bg-cyan-50 flex items-center justify-center border border-cyan-100 shrink-0">
                            {lead.source === 'linkedin' && <Linkedin className="w-5 h-5 text-cyan-600" />}
                            {lead.source === 'maps' && <MapPin className="w-5 h-5 text-cyan-600" />}
                            {lead.source === 'instagram' && <Search className="w-5 h-5 text-cyan-600" />}
                        </div>
                        <div>
                            <div className="text-gray-900 font-medium text-sm">{lead.name}</div>
                            <div className="text-gray-500 text-xs">{lead.role}</div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    )
}

// --- VISUAL 2: AGENT DNA (Left Edge Fade) ---
function VisualDNAShowcase() {
    return (
        <div className="relative w-full h-full flex items-center justify-start pl-8 md:pl-0">
            {/* Edge Glow - Purple leaking from left */}
            <div className="absolute left-[-150px] top-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-purple-500/30 blur-[120px] rounded-full -z-10" />

            <div className="relative w-full max-w-md md:ml-[50px] space-y-8">
                {/* The Waveform - Abstract representation */}
                <div className="flex items-center gap-2 h-32 ml-4">
                    {[...Array(12)].map((_, i) => (
                        <motion.div
                            key={i}
                            className="w-3 bg-gradient-to-t from-purple-500 to-pink-400 rounded-full shadow-[0_0_20px_rgba(168,85,247,0.4)]"
                            animate={{ height: ["20%", "70%", "30%", "80%", "20%"] }}
                            transition={{ duration: 1, repeat: Infinity, repeatType: "mirror", delay: i * 0.1 }}
                        />
                    ))}
                </div>

                {/* HUD Data Grid */}
                <div className="grid grid-cols-2 gap-4">
                    <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="bg-white/90 border border-purple-200 p-4 rounded-xl backdrop-blur-md shadow-lg shadow-purple-900/5">
                        <div className="text-purple-600 text-xs uppercase font-mono mb-1">Empatia</div>
                        <div className="text-gray-900 text-2xl font-bold">92%</div>
                    </motion.div>
                    <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="bg-white/90 border border-pink-200 p-4 rounded-xl backdrop-blur-md shadow-lg shadow-pink-900/5">
                        <div className="text-pink-600 text-xs uppercase font-mono mb-1">Timing</div>
                        <div className="text-gray-900 text-2xl font-bold">1.2s</div>
                    </motion.div>
                </div>
            </div>
        </div>
    )
}

// --- VISUAL 3: CALENDAR (Right Edge Fade) ---
function VisualCalendarShowcase() {
    const items = [
        { time: "09:00", title: "Reunião com Carlos", type: "Discovery" },
        { time: "11:00", title: "Demo com Agência X", type: "Demo" },
        { time: "14:30", title: "Fechamento Contrato", type: "Closing" },
        { time: "16:15", title: "Onboarding Cliente Y", type: "Onboarding" },
    ];

    return (
        <div className="relative w-full h-full flex items-center justify-end pr-8 md:pr-0">
            {/* Edge Glow - Green leaking from right */}
            <div className="absolute right-[-150px] top-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-green-500/30 blur-[120px] rounded-full -z-10" />

            <div className="space-y-4 w-full max-w-sm md:mr-[-20px]">
                {items.map((item, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, x: 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: i * 0.2 }}
                        className="relative bg-white/90 border border-green-200 p-4 rounded-2xl flex items-center gap-4 hover:border-green-400 transition-colors shadow-lg shadow-green-900/5 backdrop-blur-md"
                        style={{ marginRight: `${(items.length - i) * 15}px` }} // Reverse Waterfall
                    >
                        <div className="bg-green-50 text-green-600 font-mono text-xs font-bold px-2 py-1 rounded-md border border-green-200 shrink-0">
                            {item.time}
                        </div>
                        <div className="flex-1">
                            <div className="text-gray-900 font-medium text-sm">{item.title}</div>
                        </div>
                        <Calendar className="w-4 h-4 text-green-600 shrink-0" />
                    </motion.div>
                ))}
            </div>
        </div>
    )
}


export function SolutionSection() {
    return (
        <section className="relative w-full bg-transparent overflow-hidden">

            {/* ROW 1: HARVEST (Right Visual) */}
            <div className="relative w-full min-h-[700px] md:min-h-[600px] flex items-center">

                {/* Visual Layer - Absolute Full Width on Desktop */}
                <div className="absolute top-0 bottom-0 right-0 w-full md:w-[60%] z-0 overflow-visible hidden md:block"
                    style={{ maskImage: 'linear-gradient(to right, transparent 0%, black 40%)' }}>
                    <VisualHarvestShowcase />
                </div>
                {/* Mobile Visual */}
                <div className="md:hidden absolute top-0 w-full h-[400px] px-6 overflow-hidden">
                    <VisualHarvestShowcase />
                </div>

                {/* Content Layer */}
                <div className="max-w-[1240px] mx-auto w-full px-6 relative z-10 grid grid-cols-1 md:grid-cols-2 pt-[350px] md:pt-0">
                    <div className="md:pr-20">
                        <h3 className="font-[family-name:var(--font-jetbrains-mono)] text-4xl sm:text-5xl md:text-[60px] font-bold leading-[1.05] tracking-tight mb-8 text-gray-900">
                            Pipeline<br />
                            <span className="text-blue-600">Infinito.</span>
                        </h3>
                        <p className="text-lg md:text-xl text-gray-600 font-light leading-relaxed mb-8">
                            Nossa IA varre LinkedIn, Google Maps e Web 24/7. Ela encontra, valida e enriquece os contatos dos seus clientes ideais automaticamente.
                        </p>
                        <ul className="space-y-4">
                            <li className="flex items-center gap-3 text-gray-700 font-light">
                                <div className="p-1 rounded-full bg-blue-100"><CheckCircle2 className="text-blue-600 w-4 h-4" /></div>
                                <span>Dados enriquecidos com IA</span>
                            </li>
                            <li className="flex items-center gap-3 text-gray-700 font-light">
                                <div className="p-1 rounded-full bg-blue-100"><CheckCircle2 className="text-blue-600 w-4 h-4" /></div>
                                <span>Lista 100% validada (sem emails frios)</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>


            {/* ROW 2: DNA (Left Visual) */}
            <div className="relative w-full min-h-[700px] md:min-h-[600px] flex items-center">

                {/* Visual Layer - Left */}
                <div className="absolute top-0 bottom-0 left-0 w-full md:w-[60%] z-0 overflow-visible hidden md:block"
                    style={{ maskImage: 'linear-gradient(to left, transparent 0%, black 40%)' }}>
                    <VisualDNAShowcase />
                </div>
                {/* Mobile Visual */}
                <div className="md:hidden absolute top-0 w-full h-[400px] px-6 overflow-hidden">
                    <VisualDNAShowcase />
                </div>

                {/* Content Layer */}
                <div className="max-w-[1240px] mx-auto w-full px-6 relative z-10 grid grid-cols-1 md:grid-cols-2 pt-[350px] md:pt-0">
                    <div className="md:col-start-2 md:pl-20">
                        <h3 className="font-[family-name:var(--font-jetbrains-mono)] text-4xl sm:text-5xl md:text-[60px] font-bold leading-[1.05] tracking-tight mb-8 text-gray-900">
                            Negociação<br />
                            <span className="text-purple-600">Humana.</span>
                        </h3>
                        <p className="text-lg md:text-xl text-gray-600 font-light leading-relaxed mb-8">
                            Não é script. É psicologia. O ÁXIS entende ironia, timing e objeções, adaptando o tom da conversa para garantir confiança.
                        </p>
                        <ul className="space-y-4">
                            <li className="flex items-center gap-3 text-gray-700 font-light">
                                <div className="p-1 rounded-full bg-purple-100"><CheckCircle2 className="text-purple-600 w-4 h-4" /></div>
                                <span>Análise de sentimento em tempo real</span>
                            </li>
                            <li className="flex items-center gap-3 text-gray-700 font-light">
                                <div className="p-1 rounded-full bg-purple-100"><CheckCircle2 className="text-purple-600 w-4 h-4" /></div>
                                <span>Nunca parece um robô</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* ROW 3: CALENDAR (Right Visual) */}
            <div className="relative w-full min-h-[700px] md:min-h-[600px] flex items-center">

                {/* Visual Layer - Right */}
                <div className="absolute top-0 bottom-0 right-0 w-full md:w-[60%] z-0 overflow-visible hidden md:block"
                    style={{ maskImage: 'linear-gradient(to right, transparent 0%, black 40%)' }}>
                    <VisualCalendarShowcase />
                </div>
                {/* Mobile Visual */}
                <div className="md:hidden absolute top-0 w-full h-[400px] px-6 overflow-hidden">
                    <VisualCalendarShowcase />
                </div>

                {/* Content Layer */}
                <div className="max-w-[1240px] mx-auto w-full px-6 relative z-10 grid grid-cols-1 md:grid-cols-2 pt-[350px] md:pt-0">
                    <div className="md:pr-20">
                        <h3 className="font-[family-name:var(--font-jetbrains-mono)] text-4xl sm:text-5xl md:text-[60px] font-bold leading-[1.05] tracking-tight mb-8 text-gray-900">
                            Fechamento<br />
                            <span className="text-green-600">Automático.</span>
                        </h3>
                        <p className="text-lg md:text-xl text-gray-600 font-light leading-relaxed mb-8">
                            Da prospecção ao agendamento, sem você tocar no teclado. Sua equipe só entra na reunião para assinar o contrato.
                        </p>
                        <ul className="space-y-4">
                            <li className="flex items-center gap-3 text-gray-700 font-light">
                                <div className="p-1 rounded-full bg-green-100"><CheckCircle2 className="text-green-600 w-4 h-4" /></div>
                                <span>Sincronização direta com Google Calendar</span>
                            </li>
                            <li className="flex items-center gap-3 text-gray-700 font-light">
                                <div className="p-1 rounded-full bg-green-100"><CheckCircle2 className="text-green-600 w-4 h-4" /></div>
                                <span>Otimização para max conversão</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

        </section>
    );
}
