"use client";

import { motion, AnimatePresence, useInView } from "motion/react";
import {
    CheckCheck,
    Mic,
    Paperclip,
    MoreVertical,
    ChevronLeft,
    Sparkles,
    BrainCircuit,
    Building2,
    Stethoscope,
    ShoppingBag,
    Scale,
    GraduationCap,
    Laptop,
    MessageCircle,
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
    type: "user" | "ai" | "typing" | "thinking";
    text?: string;
    thinkingSteps?: string[];
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
        color: "bg-blue-100 text-blue-600",
        icon: <Building2 className="size-3.5" />,
        label: "Imobiliária",
        campaignName: "Lançamento Jardins",
        funnelStage: "Visita Agendada",
        aiCost: "R$ 0,45",
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&c=thumb",
        initialMessage: "Olá, vi o anúncio do apartamento no Jardins. Ainda está disponível?",
        steps: [
            { type: "thinking", thinkingSteps: ["⚡ Analisando intenção do lead...", "🏠 Imóvel: Apt Jardins 120m²", "✅ Verificando disponibilidade no CRM"], duration: 2500 },
            { type: "typing", duration: 900 },
            { type: "ai", text: "Olá Ana! 😊" },
            { type: "typing", duration: 500 },
            { type: "ai", text: "Sim, está disponível! É um apartamento de 120m² com 3 suítes e varanda gourmet." },
            { type: "typing", duration: 600 },
            { type: "ai", text: "Você busca para moradia ou investimento?" },
            { type: "user", text: "Moradia mesmo. Preciso de 3 quartos pelo menos", delay: 2200, sentiment: "neutral" },
            { type: "thinking", thinkingSteps: ["🎯 Lead qualificado: moradia, 3 quartos", "📋 Match: Unidade 804 (3 suítes)", "📅 Verificando agenda de visitas..."], duration: 2000 },
            { type: "typing", duration: 800 },
            { type: "ai", text: "Perfeito! A unidade 804 tem exatamente 3 suítes com closet." },
            { type: "typing", duration: 600 },
            { type: "ai", text: "Posso agendar uma visita para amanhã às 14h?" },
            { type: "user", text: "Pode ser! Mas qual o valor?", delay: 1800, sentiment: "curiosity" },
            { type: "thinking", thinkingSteps: ["💰 Consultando tabela de preços...", "📊 Condição especial: Lançamento (-8%)"], duration: 1500 },
            { type: "typing", duration: 700 },
            { type: "ai", text: "A tabela está em R$ 1.2M, mas como é lançamento temos condição especial de -8%." },
            { type: "typing", duration: 800 },
            { type: "ai", text: "Vou enviar a apresentação completa! 📎" },
            { type: "typing", duration: 500 },
            { type: "ai", text: "Visita confirmada pra amanhã 14h! ✅" },
        ],
    },
    {
        id: "clinica",
        name: "Dr. Roberto Lima",
        initials: "RL",
        color: "bg-emerald-100 text-emerald-600",
        icon: <Stethoscope className="size-3.5" />,
        label: "Saúde",
        campaignName: "Retorno Pacientes",
        funnelStage: "Confirmado",
        aiCost: "R$ 0,22",
        avatar: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=150&h=150&c=thumb",
        initialMessage: "Preciso agendar uma consulta com o cardiologista urgente",
        steps: [
            { type: "thinking", thinkingSteps: ["🏥 Classificando: Cardiologia", "⚠️ Urgência detectada", "📅 Verificando agenda Dr. Marcos..."], duration: 2200 },
            { type: "typing", duration: 1000 },
            { type: "ai", text: "Olá Dr. Roberto! Entendo a urgência." },
            { type: "typing", duration: 600 },
            { type: "ai", text: "O Dr. Marcos tem uma vaga amanhã às 8h (encaixe). Posso confirmar?" },
            { type: "user", text: "Perfeito, confirma. Preciso levar algum exame?", delay: 1800, sentiment: "positive" },
            { type: "thinking", thinkingSteps: ["📋 Consultando protocolo pré-consulta...", "🔬 Exames recomendados: ECG + Hemograma"], duration: 1800 },
            { type: "typing", duration: 800 },
            { type: "ai", text: "Confirmado! ✅" },
            { type: "typing", duration: 500 },
            { type: "ai", text: "Se puder, traga ECG e hemograma recentes. Caso não tenha, fazemos na hora." },
            { type: "typing", duration: 700 },
            { type: "ai", text: "Enviei localização e preparo por aqui 📍" },
            { type: "user", text: "Obrigado! E o convênio Unimed cobre?", delay: 2000 },
            { type: "typing", duration: 600 },
            { type: "ai", text: "Sim! Aceitamos Unimed, Bradesco Saúde e SulAmérica. Só trazer a carteirinha atualizada. Até amanhã! 🩺" },
        ],
    },
    {
        id: "varejo",
        name: "Carla Mendes",
        initials: "CM",
        color: "bg-pink-100 text-pink-600",
        icon: <ShoppingBag className="size-3.5" />,
        label: "Varejo",
        campaignName: "Instagram Promo",
        funnelStage: "Checkout Enviado",
        aiCost: "R$ 0,18",
        avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&c=thumb",
        initialMessage: "Oi! Vocês têm o vestido vermelho que vi no Instagram? Quero o tamanho M",
        steps: [
            { type: "thinking", thinkingSteps: ["📸 Origem: Instagram Ads", "👗 Produto: Vestido Vermelho SKU-2847", "📦 Consultando estoque em tempo real..."], duration: 1800 },
            { type: "typing", duration: 700 },
            { type: "ai", text: "Oi Carla! Tem sim! 😎" },
            { type: "typing", duration: 500 },
            { type: "ai", text: "A Sapatilha Comfort (Preta/37) está com 20% OFF hoje. De R$ 129 por R$ 103,20." },
            { type: "typing", duration: 600 },
            { type: "ai", text: "Quer reservar?" },
            { type: "user", text: "Nossa, quero sim! Vocês entregam hoje ainda?", delay: 1800, sentiment: "positive" },
            { type: "thinking", thinkingSteps: ["🚚 Calculando frete: Centro", "🕒 Previsão: Hoje até 18h", "💳 Gerando link de pagamento..."], duration: 1600 },
            { type: "typing", duration: 600 },
            { type: "ai", text: "Separado! 🎉" },
            { type: "typing", duration: 500 },
            { type: "ai", text: "Gerado link de pagamento via PIX com 5% de desconto. Esperamos você às 17h! 💜" },
            { type: "user", text: "Que maravilha! Vocês têm bolsa que combina?", delay: 2000, sentiment: "positive" },
            { type: "thinking", thinkingSteps: ["🛍️ Cross-sell: Acessórios compatíveis", "🎯 Recomendação: Bolsa Clutch Vermelha"], duration: 1500 },
            { type: "typing", duration: 700 },
            { type: "ai", text: "Temos a bolsa clutch vermelha que é a cara desse vestido! R$89,90." },
            { type: "typing", duration: 600 },
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
            { type: "thinking", thinkingSteps: ["⚖️ Classificando: Direito Trabalhista", "⚠️ Urgência detectada", "📅 Verificando agenda especialistas..."], duration: 2200 },
            { type: "typing", duration: 1200 },
            { type: "ai", text: "Bom dia Fernanda! 👋" },
            { type: "typing", duration: 800 },
            { type: "ai", text: "Para agilizar, pode me contar brevemente o que aconteceu? Assim já direciono para o especialista certo." },
            { type: "user", text: "Fui demitida sem justa causa e não recebi as verbas rescisórias", delay: 2500, sentiment: "negative" },
            { type: "thinking", thinkingSteps: ["📋 Caso: Rescisão + Verbas", "👨‍⚖️ Especialista: Dra. Patrícia (Trabalhista)", "📅 Horário disponível: Quinta 15h"], duration: 2000 },
            { type: "typing", duration: 900 },
            { type: "ai", text: "Entendo a situação, Fernanda." },
            { type: "typing", duration: 600 },
            { type: "ai", text: "A Dra. Patrícia, especialista em Trabalhista, tem horário quinta às 15h. Primeira consulta é cortesia. Confirmo?" },
            { type: "user", text: "Confirma! Preciso levar algum documento?", delay: 1800, sentiment: "neutral" },
            { type: "typing", duration: 700 },
            { type: "ai", text: "Ótimo! ✅" },
            { type: "typing", duration: 500 },
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
            { type: "thinking", thinkingSteps: ["🎓 Lead: Curso de Programação", "💡 Perfil: Iniciante (sem menção a XP)", "📊 Preparando oferta personalizada..."], duration: 1800 },
            { type: "typing", duration: 900 },
            { type: "ai", text: "Oi Lucas! 🚀" },
            { type: "typing", duration: 600 },
            { type: "ai", text: "Nosso curso de programação tem 3 trilhas. Você tem alguma experiência prévia ou está começando do zero?" },
            { type: "user", text: "Começando do zero! Quero mudar de carreira", delay: 2000, sentiment: "curiosity" },
            { type: "thinking", thinkingSteps: ["🎯 Trilha recomendada: Full-Stack Jr", "💰 Plano: 12x R$297 (bolsa 40%)", "📹 Preparando aula experimental..."], duration: 1500 },
            { type: "typing", duration: 800 },
            { type: "ai", text: "Perfeito! Recomendo a trilha Full-Stack Jr (6 meses)." },
            { type: "typing", duration: 600 },
            { type: "ai", text: "Está com bolsa de 40%: de R$497 por R$297/mês. Quer assistir uma aula grátis?" },
            { type: "user", text: "Quero sim! E tem certificado?", delay: 1800, sentiment: "positive" },
            { type: "typing", duration: 600 },
            { type: "ai", text: "Tem certificado reconhecido pelo MEC! 🎓" },
            { type: "typing", duration: 500 },
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
            { type: "thinking", thinkingSteps: ["💻 Perfil: Técnico / Desenvolvedor", "🔗 Interesse: API + Integração", "📖 Preparando documentação..."], duration: 2000 },
            { type: "typing", duration: 1000 },
            { type: "ai", text: "Oi Pedro! Sim, temos API REST completa com webhooks." },
            { type: "typing", duration: 700 },
            { type: "ai", text: "Qual stack vocês usam? Assim envio o SDK certo." },
            { type: "user", text: "Node.js com TypeScript. Preciso de webhook pra cada msg recebida", delay: 2200, sentiment: "neutral" },
            { type: "thinking", thinkingSteps: ["📦 SDK: @axis/node-sdk v3.2", "🔗 Webhooks: message.received event", "📋 Gerando API Key de teste..."], duration: 1800 },
            { type: "typing", duration: 700 },
            { type: "ai", text: "Perfeito! Enviei o link do SDK Node.js + TypeScript." },
            { type: "typing", duration: 600 },
            { type: "ai", text: "O webhook `message.received` dispara em tempo real. Criei uma API Key de teste pra você 🔑" },
            { type: "user", text: "Top! E pra enviar msgs pro cliente via API?", delay: 1800, sentiment: "curiosity" },
            { type: "typing", duration: 600 },
            { type: "ai", text: "POST /api/v1/messages com body { to, text }. Rate limit: 80 msg/s." },
            { type: "typing", duration: 700 },
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
    const [isTyping, setIsTyping] = useState(false);
    const [thinkingSteps, setThinkingSteps] = useState<string[]>([]);
    const [currentThinkStep, setCurrentThinkStep] = useState(0);
    const [unreadCounts, setUnreadCounts] = useState<Record<number, number>>({});
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
    }, [messages, isTyping, thinkingSteps]);

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
        setIsTyping(false);
        setThinkingSteps([]);
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
                const stepsArr = step.thinkingSteps || ["Analisando..."];
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

            } else if (step.type === "typing") {
                schedule(() => setIsTyping(true), elapsed);
                elapsed += step.duration || 1000;
                schedule(() => setIsTyping(false), elapsed);

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

        // Auto-advance to next scenario
        schedule(() => {
            setActiveIdx((prev) => (prev + 1) % SCENARIOS.length);
        }, elapsed + 3500);

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
                    <div className="relative w-full rounded-2xl md:rounded-3xl overflow-hidden border border-slate-200/60 bg-white shadow-2xl shadow-slate-200/50 flex flex-col md:flex-row"
                        style={{ minHeight: "min(75vh, 700px)" }}
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
                            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                                <AnimatePresence mode="popLayout">
                                    {SCENARIOS.map((chat, idx) => {
                                        const isActive = idx === activeIdx;
                                        const unread = unreadCounts[idx] || 0;
                                        return (
                                            <motion.button
                                                key={chat.id}
                                                layout
                                                onClick={() => setActiveIdx(idx)}
                                                className={`
                                                        w-full p-2.5 rounded-xl flex gap-3 text-left cursor-pointer transition-all duration-300 relative overflow-hidden group
                                                        ${isActive
                                                        ? "bg-white border border-blue-100 shadow-sm"
                                                        : "bg-transparent border border-transparent hover:bg-slate-100/50"
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
                                            <div className="flex flex-col items-end max-w-[85%] sm:max-w-[70%]">
                                                <span className="text-[10px] text-slate-400 mb-1 px-1 flex items-center gap-1">
                                                    <BrainCircuit className="size-2.5 text-violet-500 animate-pulse" />
                                                    Pensando...
                                                </span>
                                                <div className="px-3 py-2.5 rounded-2xl rounded-tr-sm bg-gradient-to-r from-violet-50 to-blue-50 border border-violet-100/50">
                                                    <div className="space-y-1">
                                                        {thinkingSteps.map((step, idx) => (
                                                            <motion.p
                                                                key={`${step}-${idx}`}
                                                                initial={{ opacity: 0, x: 8 }}
                                                                animate={{
                                                                    opacity: idx <= currentThinkStep ? 1 : 0.2,
                                                                    x: 0,
                                                                }}
                                                                transition={{ duration: 0.3, delay: idx * 0.1 }}
                                                                className={`text-[11px] sm:text-xs font-mono leading-snug ${idx <= currentThinkStep ? "text-violet-700" : "text-slate-300"
                                                                    }`}
                                                            >
                                                                {step}
                                                            </motion.p>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                            <Avatar className="size-6 shrink-0 mb-1">
                                                <AvatarFallback className="bg-violet-600 text-white text-[8px] font-bold">ÁX</AvatarFallback>
                                            </Avatar>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Typing Indicator */}
                                <AnimatePresence>
                                    {isTyping && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            className="w-full flex items-end gap-2 justify-end"
                                        >
                                            <div className="flex flex-col items-end">
                                                <div className="px-4 py-2.5 rounded-2xl rounded-tr-sm bg-blue-50 flex items-center gap-1.5">
                                                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" />
                                                </div>
                                            </div>
                                            <Avatar className="size-6 shrink-0 mb-1 opacity-70">
                                                <AvatarFallback className="bg-blue-300 text-white text-[8px] font-bold">ÁX</AvatarFallback>
                                            </Avatar>
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
                    </div>
                </ScrollReveal>
            </div>
        </section>
    );
}
