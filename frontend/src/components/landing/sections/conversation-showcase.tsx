"use client";

import { motion, AnimatePresence, useInView } from "framer-motion";
import {
    Play, Check, CheckCheck, Send, MoreVertical, Phone, Video, Image as ImageIcon, Sparkles, Mic, Paperclip, Smile,
    BrainCircuit, X, MessageCircle, Laptop, Scale, GraduationCap, MapPin, Home, Calendar, FileText, Clock,
    ShoppingBag, Tag, Truck, AlertTriangle, User, Target, Webhook, Key, Search, UserCheck, Stethoscope, Code, MousePointer2
} from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollReveal } from "@/components/ui/visuals/scroll-reveal";
import { TextGenerateEffect } from "@/components/ui/visuals/text-generate-effect";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────
interface ScenarioStep {
    type: "user" | "ai" | "typing_user" | "thinking";
    text?: string;
    thinkingSteps?: { icon: React.ReactNode, text: string }[];
    delay?: number;
    duration?: number;
    sentiment?: "positive" | "neutral" | "negative" | "urgency" | "curiosity";
}

interface ChatScenario {
    id: string;
    name: string;
    initials: string;
    color: string;
    icon: React.ReactNode;
    label: string;
    campaignName: string;
    funnelStage: string;
    aiCost: string;
    avatar: string;
    initialMessage: string;
    steps: ScenarioStep[];
}

// ─────────────────────────────────────────────────────────────
// 6 Rich Scenarios — 8+ messages each
// ─────────────────────────────────────────────────────────────
const SCENARIOS: ChatScenario[] = [
    {
        id: "imobiliaria",
        name: "Ana Souza",
        initials: "AS",
        color: "bg-emerald-100 text-emerald-600",
        icon: <Home className="size-3.5" />,
        label: "Imobiliária",
        campaignName: "Lançamento Jardins",
        funnelStage: "Agendamento",
        aiCost: "R$ 0,45",
        avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&c=thumb",
        initialMessage: "Olá! Vi o anúncio do Lançamento Jardins. Ainda tem unidades disponíveis?",
        steps: [
            {
                type: "thinking",
                thinkingSteps: [
                    { icon: <Search className="size-3" />, text: "Consultando estoque atual..." },
                    { icon: <MapPin className="size-3" />, text: "Verificando unidades com vista" },
                    { icon: <UserCheck className="size-3" />, text: "Personalizando oferta" }
                ],
                duration: 2500
            },
            { type: "ai", text: "Olá! Temos sim, mas as unidades com vista para o parque estão saindo rápido! 🏃‍♂️" },
            { type: "ai", text: "Você prefere andar alto ou baixo?" },
            { type: "typing_user", duration: 1500 },
            { type: "user", text: "Prefiro andar alto e sol da manhã", delay: 0, sentiment: "positive" },
            {
                type: "thinking",
                thinkingSteps: [
                    { icon: <Home className="size-3" />, text: "Filtrando: Andar alto + Sol manhã" },
                    { icon: <Tag className="size-3" />, text: "Unidade 154 disponível" },
                    { icon: <Calendar className="size-3" />, text: "Sugerindo visita" }
                ],
                duration: 2000
            },
            { type: "ai", text: "Perfeito! Tenho a unidade 154 no 15º andar, sol da manhã e vista livre. ☀️" },
            { type: "ai", text: "Posso agendar uma visita para você conhecer o decorado amanhã?" },
        ],
    },
    {
        id: "saude",
        name: "Dr. Ricardo",
        initials: "DR",
        color: "bg-blue-100 text-blue-600",
        icon: <Stethoscope className="size-3.5" />,
        label: "Saúde / Clínica",
        campaignName: "Clareamento",
        funnelStage: "Qualificado",
        aiCost: "R$ 0,28",
        avatar: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=150&h=150&c=thumb",
        initialMessage: "Boa tarde, gostaria de saber o valor do clareamento dental.",
        steps: [
            {
                type: "thinking",
                thinkingSteps: [
                    { icon: <FileText className="size-3" />, text: "Identificando tratamento: Clareamento" },
                    { icon: <UserCheck className="size-3" />, text: "Protocolo de triagem iniciado" },
                    { icon: <MessageCircle className="size-3" />, text: "Formulando resposta empática" }
                ],
                duration: 2200
            },
            { type: "ai", text: "Boa tarde! O valor varia conforme a técnica ideal para você (laser ou caseiro). 😁" },
            { type: "ai", text: "Você já fez algum clareamento antes ou tem sensibilidade?" },
            { type: "typing_user", duration: 1800 },
            { type: "user", text: "Nunca fiz, mas tenho um pouco de sensibilidade", delay: 0, sentiment: "neutral" },
            {
                type: "thinking",
                thinkingSteps: [
                    { icon: <AlertTriangle className="size-3" />, text: "Alerta: Sensibilidade detectada" },
                    { icon: <Stethoscope className="size-3" />, text: "Recomendação: Laser terapêutico" },
                    { icon: <Calendar className="size-3" />, text: "Verificando agenda Dr. Ricardo" }
                ],
                duration: 2000
            },
            { type: "ai", text: "Entendi. Nesse caso, usamos um protocolo especial com laser terapêutico para zerar a sensibilidade. 🛡️" },
            { type: "ai", text: "O Dr. Ricardo tem um horário para avaliação gratuita quinta às 14h. Pode ser?" },
        ],
    },
    {
        id: "varejo",
        name: "Loja Estilo",
        initials: "LE",
        color: "bg-rose-100 text-rose-600",
        icon: <ShoppingBag className="size-3.5" />,
        label: "Varejo",
        campaignName: "Coleção Verão",
        funnelStage: "Carrinho Abandonado",
        aiCost: "R$ 0,15",
        avatar: "https://images.unsplash.com/photo-1554519934-e32b1629d9ee?w=150&h=150&c=thumb",
        initialMessage: "Tem esse vestido vermelho no tamanho M?",
        steps: [
            {
                type: "thinking",
                thinkingSteps: [
                    { icon: <Search className="size-3" />, text: "Buscando SKU: Vestido Vermelho" },
                    { icon: <CheckCheck className="size-3" />, text: "Estoque M: 3 unidades" },
                    { icon: <Truck className="size-3" />, text: "Cálculo de frete preparado" }
                ],
                duration: 1800
            },
            { type: "ai", text: "Oi! Temos sim, restam apenas 3 unidades no M! ❤️" },
            { type: "ai", text: "Ele veste super bem. Quer que eu separe um para você?" },
            { type: "typing_user", duration: 1600 },
            { type: "user", text: "Que maravilha! Vocês têm bolsa que combina?", delay: 0, sentiment: "positive" },
            {
                type: "thinking",
                thinkingSteps: [
                    { icon: <ShoppingBag className="size-3" />, text: "Cross-sell: Acessórios" },
                    { icon: <Target className="size-3" />, text: "Match: Clutch Vermelha" },
                    { icon: <Tag className="size-3" />, text: "Gerando oferta combo" }
                ],
                duration: 1500
            },
            { type: "ai", text: "Temos a bolsa clutch vermelha que é a cara desse vestido! R$89,90." },
            { type: "ai", text: "Quer que eu adicione no pedido com frete grátis? 🔥" },
        ],
    },
    {
        id: "advocacia",
        name: "Fernanda Costa",
        initials: "FC",
        color: "bg-purple-100 text-purple-600",
        icon: <Scale className="size-3.5" />,
        label: "Advocacia",
        campaignName: "Trabalhista Google",
        funnelStage: "Triagem Concluída",
        aiCost: "R$ 0,60",
        avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&c=thumb",
        initialMessage: "Bom dia, preciso de uma consulta sobre uma questão trabalhista urgente",
        steps: [
            {
                type: "thinking",
                thinkingSteps: [
                    { icon: <Scale className="size-3" />, text: "Classificando: Trabalhista" },
                    { icon: <AlertTriangle className="size-3" />, text: "Prioridade: Alta/Urgente" },
                    { icon: <Calendar className="size-3" />, text: "Checando plantão jurídico" }
                ],
                duration: 2200
            },
            { type: "ai", text: "Bom dia Fernanda! 👋" },
            { type: "ai", text: "Para agilizar, pode me contar brevemente o que aconteceu? Assim já direciono para o especialista certo." },
            { type: "typing_user", duration: 2500 },
            { type: "user", text: "Fui demitida sem justa causa e não recebi as verbas rescisórias", delay: 0, sentiment: "negative" },
            {
                type: "thinking",
                thinkingSteps: [
                    { icon: <FileText className="size-3" />, text: "Tema: Rescisão Indireta" },
                    { icon: <UserCheck className="size-3" />, text: "Selecionando Dra. Patrícia" },
                    { icon: <CheckCheck className="size-3" />, text: "Validando disponibilidade" }
                ],
                duration: 2000
            },
            { type: "ai", text: "Entendo a situação, Fernanda." },
            { type: "ai", text: "A Dra. Patrícia, especialista em Trabalhista, tem horário quinta às 15h. Primeira consulta é cortesia. Confirmo?" },
            { type: "typing_user", duration: 1500 },
            { type: "user", text: "Confirma! Preciso levar algum documento?", delay: 0, sentiment: "neutral" },
            { type: "ai", text: "Ótimo! ✅" },
            { type: "ai", text: "Ótimo! ✅" },
            { type: "ai", text: "Traga: CTPS, últimos 3 holerites, e o termo de rescisão (se recebeu). Enviei a localização do escritório 📍" },
        ],
    },
    {
        id: "educacao",
        name: "Lucas Oliveira",
        initials: "LO",
        color: "bg-amber-100 text-amber-600",
        icon: <GraduationCap className="size-3.5" />,
        label: "Educação",
        campaignName: "E-book Python",
        funnelStage: "Inscrito Aula",
        aiCost: "R$ 0,33",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&c=thumb",
        initialMessage: "Oi, quero saber mais sobre o curso de programação. Quanto custa?",
        steps: [
            {
                type: "thinking",
                thinkingSteps: [
                    { icon: <Search className="size-3" />, text: "Contexto: Curso Programação" },
                    { icon: <User className="size-3" />, text: "Perfil: Iniciante" },
                    { icon: <Tag className="size-3" />, text: "Calculando oferta dinâmica" }
                ],
                duration: 1800
            },
            { type: "ai", text: "Oi Lucas! 🚀" },
            { type: "ai", text: "Nosso curso de programação tem 3 trilhas. Você tem alguma experiência prévia ou está começando do zero?" },
            { type: "typing_user", duration: 1800 },
            { type: "user", text: "Começando do zero! Quero mudar de carreira", delay: 0, sentiment: "curiosity" },
            {
                type: "thinking",
                thinkingSteps: [
                    { icon: <Target className="size-3" />, text: "Match: Trilha Full-Stack" },
                    { icon: <Tag className="size-3" />, text: "Aplicando: Bolsa 40%" },
                    { icon: <Video className="size-3" />, text: "Liberando aula experimental" }
                ],
                duration: 1500
            },
            { type: "ai", text: "Perfeito! Recomendo a trilha Full-Stack Jr (6 meses)." },
            { type: "ai", text: "Está com bolsa de 40%: de R$497 por R$297/mês. Quer assistir uma aula grátis?" },
            { type: "typing_user", duration: 1500 },
            { type: "user", text: "Quero sim! E tem certificado?", delay: 0, sentiment: "positive" },
            { type: "ai", text: "Tem certificado reconhecido pelo MEC! 🎓" },
            { type: "ai", text: "Tem certificado reconhecido pelo MEC! 🎓" },
            { type: "ai", text: "Enviei o link da aula experimental no seu e-mail. Começa em 5 min! 🔥" },
        ],
    },
    {
        id: "saas",
        name: "Pedro Santana",
        initials: "PS",
        color: "bg-cyan-100 text-cyan-600",
        icon: <Laptop className="size-3.5" />,
        label: "SaaS / Tech",
        campaignName: "API Waitlist",
        funnelStage: "Onboarding",
        aiCost: "R$ 0,12",
        avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&c=thumb",
        initialMessage: "Vocês têm API? Preciso integrar com meu sistema",
        steps: [
            {
                type: "thinking",
                thinkingSteps: [
                    { icon: <Code className="size-3" />, text: "Detectado: Developer Persona" },
                    { icon: <Webhook className="size-3" />, text: "Intent: Integração API" },
                    { icon: <FileText className="size-3" />, text: "Separando docs técnicas" }
                ],
                duration: 2000
            },
            { type: "ai", text: "Oi Pedro! Sim, temos API REST completa com webhooks." },
            { type: "ai", text: "Qual stack vocês usam? Assim envio o SDK certo." },
            { type: "typing_user", duration: 2000 },
            { type: "user", text: "Node.js com TypeScript. Preciso de webhook pra cada msg recebida", delay: 0, sentiment: "neutral" },
            {
                type: "thinking",
                thinkingSteps: [
                    { icon: <Laptop className="size-3" />, text: "Match SDK: @axis/node" },
                    { icon: <Webhook className="size-3" />, text: "Config: Evento message.received" },
                    { icon: <Key className="size-3" />, text: "Gerando API Key Sandbox" }
                ],
                duration: 1800
            },
            { type: "ai", text: "Perfeito! Enviei o link do SDK Node.js + TypeScript." },
            { type: "ai", text: "O webhook `message.received` dispara em tempo real. Criei uma API Key de teste pra você 🔑" },
            { type: "typing_user", duration: 1600 },
            { type: "user", text: "Top! E pra enviar msgs pro cliente via API?", delay: 0, sentiment: "curiosity" },
            { type: "ai", text: "POST /api/v1/messages com body { to, text }. Rate limit: 80 msg/s." },
            { type: "ai", text: "Documentação completa: docs.axis.ai 📖 Quer uma call de onboarding técnico?" },
        ],
    },
];

// ─────────────────────────────────────────────────────────────
// Message Type
// ─────────────────────────────────────────────────────────────
interface ChatMessage {
    id: string;
    body: string;
    fromMe: boolean;
    isAi?: boolean;
    timestamp: number;
}

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────
export function ConversationShowcase() {
    const [activeIdx, setActiveIdx] = useState(0);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isUserTyping, setIsUserTyping] = useState(false);
    const [thinkingSteps, setThinkingSteps] = useState<{ icon: React.ReactNode, text: string }[]>([]);
    const [currentThinkStep, setCurrentThinkStep] = useState(0);
    const [unreadCounts, setUnreadCounts] = useState<Record<number, number>>({});

    // Cursor Animation State
    const [cursorIdx, setCursorIdx] = useState(0);
    const [isClicking, setIsClicking] = useState(false);

    const scrollRef = useRef<HTMLDivElement>(null);
    const sectionRef = useRef<HTMLDivElement>(null);
    const isInView = useInView(sectionRef, { once: false, margin: "0px 0px -100px 0px" });
    const cancelledRef = useRef(false);

    const scenario = SCENARIOS[activeIdx];

    // Auto-scroll on new messages
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
        }
    }, [messages, thinkingSteps, isUserTyping]);

    // Simulate unread badges
    useEffect(() => {
        if (!isInView) return;
        const interval = setInterval(() => {
            setUnreadCounts((prev) => {
                const next = { ...prev };
                const randomIdx = Math.floor(Math.random() * SCENARIOS.length);
                if (randomIdx !== activeIdx) {
                    next[randomIdx] = (next[randomIdx] || 0) + 1;
                }
                return next;
            });
        }, 3500 + Math.random() * 2000);
        return () => clearInterval(interval);
    }, [isInView, activeIdx]);

    // ─── Scenario Runner ───
    useEffect(() => {
        if (!isInView) return;

        cancelledRef.current = false;
        let timeouts: NodeJS.Timeout[] = [];

        const clearAll = () => timeouts.forEach(clearTimeout);

        const schedule = (fn: () => void, ms: number) => {
            const t = setTimeout(() => {
                if (!cancelledRef.current) fn();
            }, ms);
            timeouts.push(t);
            return t;
        };

        // Reset state
        setMessages([]);
        setThinkingSteps([]);
        setIsUserTyping(false);
        setCurrentThinkStep(0);

        // Clear unread for this chat
        setUnreadCounts((prev) => {
            const next = { ...prev };
            delete next[activeIdx];
            return next;
        });

        // Add initial message
        const initMsg: ChatMessage = {
            id: `init-${scenario.id}-${Date.now()}`,
            body: scenario.initialMessage,
            fromMe: false,
            timestamp: Date.now() / 1000,
        };

        schedule(() => setMessages([initMsg]), 300);

        // Run steps sequentially
        let elapsed = 800;
        const steps = scenario.steps;

        for (let i = 0; i < steps.length; i++) {
            const step = steps[i];

            if (step.type === "thinking") {
                const stepsArr = step.thinkingSteps || [];
                const stepDuration = (step.duration || 2000) / stepsArr.length;

                // Show thinking container
                const thinkStart = elapsed;
                schedule(() => {
                    setThinkingSteps(stepsArr);
                    setCurrentThinkStep(0);
                }, thinkStart);

                // Animate through each step
                for (let s = 0; s < stepsArr.length; s++) {
                    schedule(() => setCurrentThinkStep(s), thinkStart + s * stepDuration + 200);
                }

                // Clear thinking
                elapsed += (step.duration || 2000) + 200;
                schedule(() => {
                    setThinkingSteps([]);
                    setCurrentThinkStep(0);
                }, elapsed);

            } else if (step.type === "typing_user") {
                schedule(() => setIsUserTyping(true), elapsed);
                elapsed += step.duration || 1000;
                schedule(() => setIsUserTyping(false), elapsed);

            } else if (step.type === "user") {
                elapsed += step.delay || 1500;
                const userElapsed = elapsed;
                schedule(() => {
                    setMessages((prev) => [
                        ...prev,
                        {
                            id: `user-${i}-${Date.now()}`,
                            body: step.text!,
                            fromMe: false,
                            timestamp: Date.now() / 1000,
                        },
                    ]);
                }, userElapsed);
                elapsed += 400;

            } else if (step.type === "ai") {
                const aiElapsed = elapsed + 200;
                schedule(() => {
                    setMessages((prev) => [
                        ...prev,
                        {
                            id: `ai-${i}-${Date.now()}`,
                            body: step.text!,
                            fromMe: true,
                            isAi: true,
                            timestamp: Date.now() / 1000,
                        },
                    ]);
                }, aiElapsed);
                elapsed = aiElapsed + 600;
            }
        }

        // Auto-advance to next scenario with cursor animation
        const nextIdx = (activeIdx + 1) % SCENARIOS.length;

        // 1. Move cursor to next item
        schedule(() => setCursorIdx(nextIdx), elapsed + 2000); // Wait a bit after chat finishes

        // 2. Click animation (down)
        schedule(() => setIsClicking(true), elapsed + 2800); // 800ms travel time

        // 3. Change chat (on click release/finish) & Reset click
        schedule(() => {
            setIsClicking(false);
            setActiveIdx(nextIdx);
        }, elapsed + 3000); // 200ms click hold

        return () => {
            cancelledRef.current = true;
            clearAll();
        };
    }, [activeIdx, isInView]);

    return (
        <section
            ref={sectionRef}
            id="demo"
            className="relative w-full py-16 md:py-24 bg-gradient-to-b from-white via-slate-50/80 to-white overflow-hidden"
        >
            {/* Background decorative */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-blue-500/[0.03] rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-violet-500/[0.03] rounded-full blur-3xl" />
            </div>

            {/* ─── Headline ─── */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 mb-10 md:mb-16 relative z-10">
                <ScrollReveal width="100%">
                    <div className="text-center">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 border border-blue-100 bg-blue-50 text-blue-700 text-[10px] sm:text-xs font-bold tracking-[0.15em] uppercase mb-5 rounded-full">
                            <MessageCircle className="w-3 h-3" />
                            Demonstração ao Vivo
                        </div>
                        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 mb-4 md:mb-6 tracking-tight leading-[1.1]">
                            Veja a ÁXIS{" "}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-violet-600">
                                em Ação
                            </span>
                        </h2>
                        <p className="text-base sm:text-lg md:text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed font-light">
                            6 nichos diferentes, 1 inteligência. Veja como a IA conversa
                            com empatia, qualifica e fecha — em tempo real.
                        </p>
                    </div>
                </ScrollReveal>
            </div>

            {/* ─── Niche Tabs (Mobile: horizontal scroll, Desktop: inside sidebar) ─── */}
            <div className="md:hidden max-w-6xl mx-auto px-4 mb-4 relative z-10">
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
                    {SCENARIOS.map((s, idx) => (
                        <button
                            key={s.id}
                            onClick={() => setActiveIdx(idx)}
                            className={`
                                snap-start flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-300 shrink-0
                                ${idx === activeIdx
                                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                                    : "bg-white text-slate-500 border border-slate-200 hover:border-slate-300"
                                }
                            `}
                        >
                            {s.icon}
                            {s.label}
                            {unreadCounts[idx] && idx !== activeIdx ? (
                                <span className="ml-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center font-bold animate-pulse">
                                    {unreadCounts[idx]}
                                </span>
                            ) : null}
                        </button>
                    ))}
                </div>
            </div>

            {/* ─── Chat Container ─── */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
                <ScrollReveal width="100%" mode="fade-up" delay={0.15}>
                    <div className="relative pt-10 pb-10 md:py-20 px-2 bg-transparent w-full">
                        <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-3/4 h-1/3 blur-[5rem] animate-image-glow"></div>

                        <div className="relative w-full rounded-2xl md:rounded-3xl overflow-hidden border border-slate-200/60 bg-white shadow-2xl shadow-slate-200/50 flex flex-col md:flex-row"
                            style={{ height: "700px" }}
                        >

                            {/* ─── Sidebar (Desktop only) ─── */}
                            <div className="hidden md:flex flex-col w-[300px] lg:w-[340px] shrink-0 border-r border-slate-100 bg-slate-50/50">
                                {/* Sidebar Header */}
                                <div className="p-4 pb-3 border-b border-slate-100">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-lg font-bold text-slate-900 tracking-tight">Conversas</h3>
                                        <div className="flex items-center gap-1">
                                            <span className="relative flex h-2 w-2">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                                            </span>
                                            <span className="text-[10px] text-green-600 font-medium">6 ativos</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
                                        {["Todas", "Prospectando", "Qualificado"].map((tab, i) => (
                                            <button
                                                key={tab}
                                                className={`px-3 py-1 rounded-full text-[10px] font-medium transition-all duration-200 whitespace-nowrap ${i === 0
                                                    ? "bg-blue-600 text-white shadow-sm"
                                                    : "bg-white text-slate-500 border border-slate-200"
                                                    }`}
                                            >
                                                {tab}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Chat List */}
                                <div className="flex-1 overflow-y-auto p-2 space-y-1 relative">
                                    <AnimatePresence mode="popLayout">
                                        {SCENARIOS.map((chat, idx) => {
                                            const isActive = idx === activeIdx;
                                            const unread = unreadCounts[idx] || 0;
                                            return (
                                                <motion.button
                                                    key={chat.id}
                                                    layout
                                                    // onClick={() => setActiveIdx(idx)} // Disabled manual interaction
                                                    className={`
                                                        w-full p-2.5 rounded-xl flex gap-3 text-left transition-all duration-300 relative overflow-hidden group pointer-events-none
                                                        ${isActive
                                                            ? "bg-white border border-blue-100 shadow-sm"
                                                            : "bg-transparent border border-transparent"
                                                        }
                                                    `}
                                                >
                                                    {isActive && (
                                                        <motion.div
                                                            layoutId="showcaseActiveIndicator"
                                                            className="absolute left-0 top-3 bottom-3 w-1 bg-blue-500 rounded-r-full"
                                                        />
                                                    )}
                                                    <Avatar className="size-11 shrink-0 border border-slate-100">
                                                        <AvatarImage src={chat.avatar} alt={chat.name} className="object-cover" />
                                                        <AvatarFallback className={chat.color}>
                                                            {chat.initials}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                                                        <div className="flex items-center justify-between mb-0.5">
                                                            <span className={`text-sm font-bold truncate ${isActive ? "text-slate-900" : "text-slate-700"}`}>
                                                                {chat.name}
                                                            </span>
                                                            <span className="text-[10px] text-slate-400 shrink-0 ml-2">
                                                                {isActive ? "Agora" : `${idx + 2}min`}
                                                            </span>
                                                        </div>

                                                        <div className="flex items-center gap-1.5 mb-1.5">
                                                            <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md truncate max-w-[120px]">
                                                                {chat.campaignName}
                                                            </span>
                                                        </div>

                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${chat.funnelStage.includes("Qualificado") || chat.funnelStage.includes("Agendada") || chat.funnelStage.includes("Checkout") || chat.funnelStage.includes("Confirmado")
                                                                    ? "bg-green-50 text-green-600 border border-green-100"
                                                                    : "bg-blue-50 text-blue-600 border border-blue-100"
                                                                    }`}>
                                                                    {chat.funnelStage}
                                                                </span>
                                                                <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                                                                    <BrainCircuit className="size-2.5" />
                                                                    {chat.aiCost}
                                                                </span>
                                                            </div>

                                                            {unread > 0 && !isActive && (
                                                                <motion.span
                                                                    initial={{ scale: 0 }}
                                                                    animate={{ scale: 1 }}
                                                                    className="shrink-0 w-4 h-4 rounded-full bg-blue-600 text-white text-[9px] flex items-center justify-center font-bold shadow-sm shadow-blue-500/30"
                                                                >
                                                                    {unread}
                                                                </motion.span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </motion.button>
                                            );
                                        })}
                                    </AnimatePresence>

                                    {/* Fake Cursor */}
                                    <motion.div
                                        className="absolute left-0 top-0 pointer-events-none z-50 text-slate-900 drop-shadow-xl"
                                        animate={{
                                            y: cursorIdx * 64 + 36, // Precise item height (60px) + gap (4px) + offset
                                            x: 220, // Position over the name/message area
                                            scale: isClicking ? 0.9 : 1
                                        }}
                                        initial={{ x: 220, y: 36 }}
                                        transition={{
                                            // Smooth movement
                                            y: { type: "spring", stiffness: 100, damping: 20 },
                                            x: { duration: 0 }, // lock x
                                            scale: { duration: 0.1 }
                                        }}
                                    >
                                        <MousePointer2 className="size-5 fill-slate-900 text-slate-50 relative z-50" />
                                        {isClicking && (
                                            <span className="absolute -top-2 -left-2 size-8 bg-slate-400/20 rounded-full animate-ping" />
                                        )}
                                    </motion.div>
                                </div>
                            </div>

                            {/* ─── Chat Area ─── */}
                            <div className="flex-1 min-w-0 flex flex-col bg-white relative">
                                {/* Chat Header */}
                                <div className="h-14 sm:h-16 w-full shrink-0 px-4 sm:px-6 flex items-center justify-between border-b border-slate-100 bg-white/80 backdrop-blur-sm z-10">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="size-8 sm:size-9 ring-2 ring-white shadow-sm">
                                            <AvatarImage src={scenario.avatar} alt={scenario.name} className="object-cover" />
                                            <AvatarFallback className={scenario.color}>
                                                {scenario.initials}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col min-w-0">
                                            <AnimatePresence mode="wait">
                                                <motion.h3
                                                    key={scenario.name}
                                                    initial={{ opacity: 0, y: 4 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -4 }}
                                                    className="font-semibold text-sm text-slate-900 leading-tight truncate"
                                                >
                                                    {scenario.name}
                                                </motion.h3>
                                            </AnimatePresence>
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                                <span className="text-[10px] sm:text-xs text-green-600 font-medium">Online</span>
                                                <span className="text-[10px] text-slate-300 mx-0.5">•</span>
                                                <span className="inline-flex items-center gap-0.5 text-[10px] text-slate-400 font-medium">
                                                    <Sparkles className="size-2.5 text-violet-500" />
                                                    IA Ativa
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-900 hidden sm:flex">
                                        <MoreVertical className="size-5" />
                                    </Button>
                                </div>

                                {/* Messages */}
                                <div
                                    ref={scrollRef}
                                    className="flex-1 overflow-y-auto px-3 sm:px-6 pt-4 sm:pt-6 pb-20 flex flex-col gap-3 sm:gap-4 scrollbar-hide"
                                    style={{
                                        maskImage: "linear-gradient(to bottom, transparent 0%, black 3%, black 90%, transparent 100%)",
                                        WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 3%, black 90%, transparent 100%)",
                                    }}
                                >
                                    <AnimatePresence initial={false}>
                                        {messages.map((msg) => (
                                            <motion.div
                                                key={msg.id}
                                                initial={{ opacity: 0, y: 16, scale: 0.96 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                transition={{ type: "spring" as const, stiffness: 300, damping: 25 }}
                                                className={`w-full flex items-end gap-2 ${msg.fromMe ? "justify-end" : "justify-start"}`}
                                            >
                                                {!msg.fromMe && (
                                                    <Avatar className="size-6 shrink-0 mb-1">
                                                        <AvatarImage src={scenario.avatar} alt={scenario.name} className="object-cover" />
                                                        <AvatarFallback className={`${scenario.color} text-[8px] font-bold`}>
                                                            {scenario.initials}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                )}
                                                <div className={`flex flex-col ${msg.fromMe ? "items-end" : "items-start"} max-w-[85%] sm:max-w-[70%]`}>
                                                    {msg.fromMe && (
                                                        <span className="text-[10px] text-slate-400 mb-1 px-1 flex items-center gap-1">
                                                            <Sparkles className="size-2.5 text-violet-500" />
                                                            ÁXIS IA
                                                        </span>
                                                    )}
                                                    <div
                                                        className={`p-3 rounded-2xl text-left ${msg.fromMe
                                                            ? "bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-tr-sm shadow-lg shadow-blue-600/10"
                                                            : "bg-slate-100 rounded-tl-sm text-slate-800"
                                                            }`}
                                                    >
                                                        <p className="text-[13px] sm:text-sm font-normal leading-relaxed whitespace-pre-wrap break-words">
                                                            {msg.body}
                                                        </p>
                                                        <div className="flex items-center justify-between gap-2 mt-1">
                                                            {/* Sentiment Badge for User Messages */}
                                                            {!msg.fromMe && (msg as any).sentiment && (
                                                                <span className="text-[10px] bg-white/50 px-1.5 py-0.5 rounded-full flex items-center gap-1 text-slate-500 font-medium" title="Análise de Sentimento">
                                                                    {(() => {
                                                                        switch ((msg as any).sentiment) {
                                                                            case "positive": return "😊 Positivo";
                                                                            case "negative": return "😠 Negativo";
                                                                            case "urgency": return "🚨 Urgente";
                                                                            case "curiosity": return "🤔 Curioso";
                                                                            case "neutral": return "😐 Neutro";
                                                                            default: return "";
                                                                        }
                                                                    })()}
                                                                </span>
                                                            )}
                                                            <div className="flex items-center gap-1 opacity-60 ml-auto">
                                                                <span className={`text-[10px] ${msg.fromMe ? "text-blue-200" : "text-slate-400"}`}>
                                                                    {new Date(msg.timestamp * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                                                </span>
                                                                {msg.fromMe && (
                                                                    <CheckCheck className="size-3 text-blue-200" />
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                {msg.fromMe && (
                                                    <Avatar className="size-6 shrink-0 mb-1">
                                                        <AvatarFallback className="bg-blue-600 text-white text-[8px] font-bold">ÁX</AvatarFallback>
                                                    </Avatar>
                                                )}
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>

                                    {/* Thinking Animation */}
                                    <AnimatePresence>
                                        {thinkingSteps.length > 0 && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 12 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -8 }}
                                                className="w-full flex items-end gap-2 justify-end"
                                            >
                                                <div className="space-y-1">
                                                    {thinkingSteps.map((step, idx) => (
                                                        <motion.div
                                                            key={`think-${idx}`}
                                                            initial={{ opacity: 0, x: 10 }}
                                                            animate={{
                                                                opacity: idx <= currentThinkStep ? 1 : 0.4,
                                                                x: 0,
                                                                scale: 1
                                                            }}
                                                            transition={{ duration: 0.3 }}
                                                            className={`flex items-center gap-2 text-[11px] sm:text-xs font-medium ${idx <= currentThinkStep
                                                                ? "text-violet-600"
                                                                : "text-slate-300"
                                                                }`}
                                                        >
                                                            <span className={idx <= currentThinkStep ? "text-violet-500" : "opacity-50"}>
                                                                {step.icon}
                                                            </span>
                                                            {step.text}
                                                        </motion.div>
                                                    ))}
                                                </div>
                                                <Avatar className="size-6 shrink-0 mb-1 opacity-80">
                                                    <AvatarFallback className="bg-violet-100 text-violet-600 text-[8px] font-bold">🧠</AvatarFallback>
                                                </Avatar>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* User Typing Indicator (Left Side, Minimalist) */}
                                    <AnimatePresence>
                                        {isUserTyping && (
                                            <motion.div
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -10 }}
                                                className="w-full flex items-center justify-start gap-2 pl-1"
                                            >
                                                <Avatar className="size-6 shrink-0 opacity-60">
                                                    <AvatarImage src={scenario.avatar} className="object-cover grayscale" />
                                                    <AvatarFallback className="bg-slate-100 text-[8px] text-slate-400">
                                                        {scenario.initials}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex items-center gap-1">
                                                    <motion.span
                                                        animate={{ y: [0, -3, 0] }}
                                                        transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut", delay: 0 }}
                                                        className="w-1.5 h-1.5 bg-slate-300 rounded-full"
                                                    />
                                                    <motion.span
                                                        animate={{ y: [0, -3, 0] }}
                                                        transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut", delay: 0.1 }}
                                                        className="w-1.5 h-1.5 bg-slate-300 rounded-full"
                                                    />
                                                    <motion.span
                                                        animate={{ y: [0, -3, 0] }}
                                                        transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
                                                        className="w-1.5 h-1.5 bg-slate-300 rounded-full"
                                                    />
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>


                                </div>

                                {/* Input Area (Visual) */}
                                <div className="absolute bottom-0 w-full p-3 sm:p-4 bg-gradient-to-t from-white via-white/95 to-transparent z-20 pointer-events-none">
                                    <div className="max-w-3xl mx-auto relative flex items-center gap-2">
                                        <div className="flex-1 bg-white border border-slate-200 rounded-full h-11 sm:h-12 px-2 flex items-center gap-1 shadow-lg shadow-black/5 backdrop-blur-sm">
                                            <Button variant="ghost" className="p-2 hover:bg-slate-100 rounded-full shrink-0 text-slate-400" type="button">
                                                <Paperclip className="size-4 sm:size-5" />
                                            </Button>
                                            <span className="flex-1 text-xs sm:text-sm text-slate-400 px-2">Digite sua mensagem...</span>
                                            <Button variant="ghost" className="p-2 rounded-full shrink-0 text-slate-400 hover:bg-slate-100" type="button">
                                                <Mic className="size-4 sm:size-5" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Bottom Fade Overlays - Inside Container for proper masking */}
                            <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none z-50"></div>
                        </div>
                    </div>
                </ScrollReveal>
            </div>
        </section>
    );
}
