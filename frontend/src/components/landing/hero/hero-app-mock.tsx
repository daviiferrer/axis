"use client";

import { useState, useEffect, useRef } from "react";
import { motion, useMotionValue, useTransform, useMotionTemplate, AnimatePresence } from "framer-motion";
import {
    MoreVertical,
    CheckCheck,
    Mic,
    Paperclip,
    Sparkles,
    BrainCircuit,
    ChevronLeft
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { SentimentDisplay } from "@/components/SentimentSlider/SentimentDisplay";
import { useSentimentColors } from "@/components/SentimentSlider/useSentimentColors";
import { Reasoning, ReasoningContent, ReasoningTrigger } from "@/components/ai/reasoning";

// --- Types ---
interface MockMessage {
    id: string;
    body: string;
    fromMe: boolean;
    isAi?: boolean;
    author?: string;
    timestamp: number;
    ack?: number;
}

interface ScenarioStep {
    type: 'user' | 'ai' | 'typing' | 'thinking';
    text?: string;
    thinkingText?: string;
    delay?: number;
    duration?: number;
    sentiment?: number;
}

interface ChatScenario {
    id: string;
    name: string;
    initials: string;
    color: string;
    initialMessage: string;
    steps: ScenarioStep[];
}

// --- Scenarios: Multiple clients being handled ---
const SCENARIOS: ChatScenario[] = [
    {
        id: 'imobiliaria',
        name: 'Ana Souza',
        initials: 'AS',
        color: 'bg-blue-100 text-blue-600',
        initialMessage: "Olá, vi o anúncio do apartamento no Jardins. Ainda está disponível?",
        steps: [
            { type: 'thinking', thinkingText: "Analisando intenção do lead... Imóvel: Apt Jardins. Verificando disponibilidade no CRM...", duration: 2000 },
            { type: 'typing', duration: 1200 },
            { type: 'ai', text: "Olá Ana! Sim, está disponível! É um apartamento de 120m² com 3 suítes e varanda gourmet. Você busca para moradia ou investimento?", sentiment: 3 },
            { type: 'user', text: "Moradia mesmo. Preciso de 3 quartos.", delay: 2500 },
            { type: 'thinking', thinkingText: "Lead qualificado: busca moradia, 3 quartos. Match com unidade 804. Preparando agendamento...", duration: 1800 },
            { type: 'typing', duration: 1000 },
            { type: 'ai', text: "Perfeito! A unidade 804 tem exatamente 3 suítes. Posso agendar uma visita para amanhã às 14h?", sentiment: 5 },
        ]
    },
    {
        id: 'advocacia',
        name: 'Dr. Roberto Almeida',
        initials: 'RA',
        color: 'bg-purple-100 text-purple-600',
        initialMessage: "Bom dia, preciso agendar uma consulta sobre uma questão trabalhista urgente.",
        steps: [
            { type: 'thinking', thinkingText: "Classificando: Direito Trabalhista. Urgência detectada. Verificando agenda do Dr. Marcos...", duration: 2200 },
            { type: 'typing', duration: 1500 },
            { type: 'ai', text: "Bom dia Dr. Roberto! Para agilizar, poderia me enviar o número do processo? Assim já preparo um resumo para o especialista.", sentiment: 3 },
            { type: 'user', text: "Claro, é o processo nº 0023456-78.2024.5.15.0001.", delay: 3000 },
            { type: 'thinking', thinkingText: "Processo localizado via API TJ. Vara do Trabalho de Campinas. Horário disponível: Quinta 15h.", duration: 2500 },
            { type: 'typing', duration: 1000 },
            { type: 'ai', text: "Localizado! Agendei sua consulta para quinta-feira às 15h com o Dr. Marcos, especialista em trabalhista. Enviei a confirmação por e-mail.", sentiment: 4 },
        ]
    },
    {
        id: 'varejo',
        name: 'Carla Mendes',
        initials: 'CM',
        color: 'bg-pink-100 text-pink-600',
        initialMessage: "Oi! Vocês têm o vestido vermelho que vi no Instagram? Quero o tamanho M.",
        steps: [
            { type: 'thinking', thinkingText: "Origem: Instagram. Produto: vestido vermelho. Consultando estoque em tempo real...", duration: 1800 },
            { type: 'typing', duration: 800 },
            { type: 'ai', text: "Oi Carla! Achei o vestido. Tenho o último M em estoque! Quer que eu separe para você?", sentiment: 4 },
            { type: 'user', text: "Sim, por favor! Posso passar aí hoje às 17h?", delay: 2000 },
            { type: 'thinking', thinkingText: "Reserva confirmada. Gerando link de pagamento com PIX...", duration: 1500 },
            { type: 'typing', duration: 800 },
            { type: 'ai', text: "Separado! Gerado link de pagamento via PIX com 5% de desconto. Esperamos você às 17h! 💜", sentiment: 5 },
        ]
    }
];

export function HeroAppMock() {
    const [activeIdx, setActiveIdx] = useState(0);
    const [messages, setMessages] = useState<MockMessage[]>([]);
    const [view, setView] = useState<'list' | 'chat'>('chat');
    const [isTyping, setIsTyping] = useState(false);
    const [thinkingText, setThinkingText] = useState<string | null>(null);
    const [sentiment, setSentiment] = useState(2);
    const scrollRef = useRef<HTMLDivElement>(null);

    const scenario = SCENARIOS[activeIdx];

    const { headerBgColor, bodyGradientStart } = useSentimentColors(sentiment);
    const scrollTop = useMotionValue(0);
    const distBottom = useMotionValue(100);
    const maskTopColor = useTransform(scrollTop, [0, 60], ["black", "transparent"]);
    const maskBottomColor = useTransform(distBottom, [0, 60], ["black", "transparent"]);
    // Reduced bottom fade to 40px so reasoning bubble is visible
    const maskImage = useMotionTemplate`linear-gradient(to bottom, ${maskTopColor} 0px, black 100px, black calc(100% - 40px), ${maskBottomColor} 100%)`;

    // --- Cursor State ---
    const [cursorPos, setCursorPos] = useState({ x: -100, y: -100 }); // Start off-screen
    const [showCursor, setShowCursor] = useState(false);
    const [isHovering, setIsHovering] = useState(false); // To simulate hover effect on button

    // Helper to move cursor
    const moveCursorTo = async (x: number, y: number, duration = 1000) => {
        setShowCursor(true);
        // We use simple timeout for mock, in real framing use controls
        setCursorPos({ x, y });
        await new Promise(r => setTimeout(r, duration));
    };

    // --- Scenario Runner ---
    useEffect(() => {
        let timeout: NodeJS.Timeout;
        let stepIdx = 0;
        let cancelled = false;

        const initMsg: MockMessage = {
            id: 'init-' + scenario.id,
            body: scenario.initialMessage,
            fromMe: false,
            timestamp: Date.now() / 1000,
            ack: 3
        };

        const startSimulation = async () => {
            // Initial setup
            setMessages([initMsg]);
            setSentiment(2);
            setIsTyping(false);
            setThinkingText(null);
            setShowCursor(false);

            // Move cursor away initially or keeping it from previous

            if (activeIdx > 0) {
                // Simulate navigation ONLY after the first scenario
                setView('list');
                // Move cursor to "Chat" area (approximate center for visual)
                await new Promise(r => setTimeout(r, 500));
                if (!cancelled) setView('chat');
            } else {
                setView('chat');
            }

            await new Promise(r => setTimeout(r, 1000));
            if (!cancelled) runConversationSteps();
        };

        const runConversationSteps = () => {
            const nextStep = () => {
                if (cancelled || stepIdx >= scenario.steps.length) {
                    // Script Finished. Prepare to switch.
                    const nextIdx = (activeIdx + 1) % SCENARIOS.length;

                    const switchTimeout = setTimeout(async () => {
                        if (cancelled) return;

                        // 1. Show List (Mobile) or Focus Sidebar (Desktop)
                        setView('list');

                        // 2. Animate Cursor to the next chat item
                        // Calculate rough Y position based on index (Header ~130px + Item ~80px * index)
                        // Adjust these values based on visual layout
                        const startY = 140;
                        const itemHeight = 76;
                        const targetY = startY + (nextIdx * itemHeight);
                        const targetX = 180; // Center of sidebar width (340px)

                        await moveCursorTo(targetX, targetY, 1200);
                        if (cancelled) return;

                        // 3. Simulate Hover
                        setIsHovering(true);
                        await new Promise(r => setTimeout(r, 300));

                        // 4. Click!
                        // Maybe add a small scale down/up effect on cursor here if possible, 
                        // or just switch immediately visually
                        if (cancelled) return;

                        setActiveIdx(nextIdx);
                        setIsHovering(false);

                        // 5. Hide Cursor or move slightly
                        // setCursorPos({ x: targetX + 20, y: targetY + 20 }); // drift

                    }, 3000); // Wait a bit after reading last message before starting move

                    timeout = switchTimeout;
                    return;
                }

                const step = scenario.steps[stepIdx];

                if (step.type === 'thinking') {
                    setThinkingText(step.thinkingText || "Analisando...");
                    timeout = setTimeout(() => {
                        if (!cancelled) {
                            setThinkingText(null);
                            stepIdx++;
                            nextStep();
                        }
                    }, step.duration || 2000);
                } else if (step.type === 'typing') {
                    setIsTyping(true);
                    timeout = setTimeout(() => {
                        if (!cancelled) {
                            setIsTyping(false);
                            stepIdx++;
                            nextStep();
                        }
                    }, step.duration || 1000);
                } else {
                    const msg: MockMessage = {
                        id: `${scenario.id}-${stepIdx}-${Date.now()}`,
                        body: step.text!,
                        fromMe: step.type === 'ai',
                        isAi: step.type === 'ai',
                        author: step.type === 'ai' ? 'ÁXIS' : undefined,
                        timestamp: Date.now() / 1000,
                        ack: step.type === 'ai' ? 3 : undefined
                    };

                    timeout = setTimeout(() => {
                        if (!cancelled) {
                            setMessages(prev => [...prev, msg]);
                            if (step.sentiment !== undefined) setSentiment(step.sentiment);
                            stepIdx++;
                            nextStep();
                            if (scrollRef.current) {
                                scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
                            }
                        }
                    }, step.delay || 0);
                }
            };
            nextStep();
        }

        startSimulation();

        return () => {
            cancelled = true;
            clearTimeout(timeout);
        };
    }, [activeIdx]);

    // Force scroll 
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
        }
    }, [messages, thinkingText, isTyping]);


    return (
        <div className="w-full max-w-5xl mx-auto h-[600px] mt-12 relative z-10 rounded-t-2xl overflow-hidden border-x border-t border-gray-200/50 bg-white flex">

            {/* Simulated Cursor */}
            <motion.div
                className="absolute z-[100] pointer-events-none drop-shadow-2xl"
                initial={{ x: -100, y: -100, opacity: 0 }}
                animate={{
                    x: cursorPos.x,
                    y: cursorPos.y,
                    opacity: showCursor ? 1 : 0,
                    scale: isHovering ? 0.9 : 1
                }}
                transition={{
                    type: "spring",
                    damping: 25,
                    stiffness: 150,
                    opacity: { duration: 0.2 }
                }}
            >
                <div className="relative">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-black fill-black"
                        style={{ filter: "drop-shadow(0px 2px 4px rgba(0,0,0,0.2))" }}
                    >
                        <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
                        <path d="M13 13l6 6" />
                    </svg>
                    {/* Optional: Add a name tag if we want "User" */}
                </div>
            </motion.div>

            {/* List View: Visible on Desktop OR when view='list' on mobile */}
            <div className={`
                flex flex-col shrink-0 bg-white border-r border-gray-100 z-20 
                absolute md:relative inset-0 md:inset-auto md:w-[340px] md:min-w-[280px]
                transition-transform duration-500 ease-in-out
                ${view === 'list' ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            `}>
                <div className="p-4 pb-2 bg-white z-10">
                    <h2 className="text-xl font-bold tracking-tight text-gray-900 mb-3">Conversas</h2>
                    <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-1 scrollbar-hide">
                        {[
                            { id: 'ALL', label: 'Todas' },
                            { id: 'PROSPECTING', label: 'Prospectando' },
                            { id: 'QUALIFIED', label: 'Qualificado' },
                        ].map((tab, i) => (
                            <button
                                key={tab.id}
                                className={`px-3 h-6 rounded-full text-[11px] font-medium transition-all duration-200 whitespace-nowrap ${i === 0
                                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                                    : 'bg-gray-100 text-gray-600'
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex-1 overflow-hidden p-2 space-y-1">
                    <AnimatePresence mode="popLayout">
                        {SCENARIOS.map((chat, idx) => {
                            const isActive = idx === activeIdx;
                            return (
                                <motion.div
                                    key={chat.id}
                                    layout
                                    className={`p-3 rounded-xl flex gap-3 cursor-default transition-all duration-500 relative overflow-hidden ${isActive
                                        ? "bg-blue-50/50 border border-blue-100/50"
                                        : "bg-white" // Removed hover effect as cursor is now fake
                                        } 
                                        ${idx === (activeIdx + 1) % SCENARIOS.length && isHovering ? "bg-gray-50" : ""} 
                                    `}
                                >
                                    {isActive && (
                                        <motion.div
                                            layoutId="activeIndicator"
                                            className="absolute left-0 top-3 bottom-3 w-1 bg-blue-500 rounded-r-full"
                                        />
                                    )}
                                    <Avatar className="size-10 shrink-0">
                                        <AvatarFallback className={chat.color}>
                                            {chat.initials}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 overflow-hidden">
                                        <div className="flex justify-between items-center mb-0.5">
                                            <span className={`font-semibold text-sm ${isActive ? "text-gray-900" : "text-gray-500"}`}>
                                                {chat.name}
                                            </span>
                                            <span className="text-[10px] text-gray-400">
                                                {isActive ? "Agora" : "5 min"}
                                            </span>
                                        </div>
                                        <p className={`text-xs truncate ${isActive ? "text-gray-600 font-medium" : "text-gray-400"}`}>
                                            {isActive
                                                ? (thinkingText ? "🧠 Analisando..." : isTyping ? "Digitando..." : messages[messages.length - 1]?.body)
                                                : chat.initialMessage}
                                        </p>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            </div>

            {/* Chat View: Slide over on Mobile */}
            <div className={`
                flex-1 bg-white relative flex flex-col min-w-0 z-30
                absolute md:relative inset-0 md:inset-auto
                transition-transform duration-500 ease-in-out
                ${view === 'chat' ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
            `}>
                <motion.div
                    className="h-16 w-full shrink-0 px-4 md:px-6 flex items-center justify-between sticky top-0 z-50 transition-colors backdrop-blur-md"
                    style={{ backgroundColor: headerBgColor }}
                >
                    <div className="flex items-center gap-2 md:gap-3">
                        {/* Mobile Back Button - Visual Only in Mock */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="md:hidden -ml-2 text-gray-500"
                            onClick={() => setView('list')} // Allow manual click to list (for testing)
                        >
                            <ChevronLeft className="size-5" />
                        </Button>

                        <Avatar className="size-8 md:size-9 ring-2 ring-white/50 shadow-sm">
                            <AvatarFallback className={scenario.color}>
                                {scenario.initials}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                            <motion.h2
                                key={scenario.name}
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="font-semibold text-sm text-gray-900 leading-tight"
                            >
                                {scenario.name}
                            </motion.h2>
                            <span className="text-[10px] md:text-xs text-green-600 font-medium flex items-center gap-1">
                                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                Online
                            </span>
                        </div>
                    </div>

                    {/* Sentiment Display - Scaled for mobile */}
                    <div className="flex-1 flex justify-center mx-2 md:mx-4 z-10">
                        <div className="relative h-10 w-full max-w-[160px] md:max-w-[280px] flex items-center justify-center scale-90 md:scale-100 origin-center">
                            <SentimentDisplay value={sentiment} variant="header" />
                        </div>
                    </div>

                    <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-900 hidden md:flex">
                        <MoreVertical className="size-5" />
                    </Button>
                </motion.div>

                {/* Messages Area */}
                <div className="flex-1 min-h-0 relative flex flex-col">

                    <motion.div
                        className="flex-1 overflow-y-auto px-4 sm:px-6 pt-6 pb-20 z-10 scrollbar-hide flex flex-col gap-4 pointer-events-none"
                        ref={scrollRef}
                    >
                        {/* Removed mt-auto so messages start here (TOP) by default */}
                        <AnimatePresence initial={false}>
                            {messages.map((msg) => (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className={`w-full max-w-3xl mx-auto flex items-end gap-2 ${msg.fromMe ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`flex flex-col ${msg.fromMe ? 'items-end' : 'items-start'} max-w-[85%] sm:max-w-[70%]`}>
                                        {msg.fromMe ? (
                                            <span className="text-[10px] text-gray-400 mb-1 px-1">
                                                {msg.isAi ? <>{msg.author}, IA, Atendente</> : <>Você, Humano, Admin</>}
                                            </span>
                                        ) : null}

                                        <div className={`p-2.5 rounded-2xl text-left ${msg.fromMe
                                            ? 'bg-[#155dfc]/10 rounded-tr-sm text-gray-900'
                                            : 'bg-gray-100 rounded-tl-sm text-gray-800'
                                            }`}>
                                            <p className="text-[13px] font-normal leading-relaxed whitespace-pre-wrap break-words">{msg.body}</p>
                                            <div className="flex items-center justify-end gap-1 mt-1 opacity-60">
                                                <span className="text-[10px] text-gray-500">
                                                    {new Date(msg.timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                                {msg.fromMe && (
                                                    <CheckCheck className={`size-3 ${msg.ack && msg.ack >= 3 ? 'text-blue-500' : 'text-gray-400'}`} />
                                                )}
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



                        {/* AI Reasoning Bubble */}
                        <AnimatePresence>
                            {thinkingText && (
                                <motion.div
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -8 }}
                                    className="w-full max-w-3xl mx-auto flex items-end gap-2 justify-end"
                                >
                                    <div className="flex flex-col items-end max-w-[85%] sm:max-w-[70%]">
                                        <span className="text-[10px] text-gray-400 mb-1 px-1">
                                            ÁXIS, IA, Atendente
                                        </span>
                                        <Reasoning defaultOpen={false} isStreaming={true}>
                                            <ReasoningTrigger className="text-xs text-violet-600" />
                                            <ReasoningContent className="text-xs text-gray-500">
                                                {thinkingText}
                                            </ReasoningContent>
                                        </Reasoning>
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
                                    className="w-full max-w-3xl mx-auto flex items-end gap-2 justify-end"
                                >
                                    <div className="flex flex-col items-end">
                                        <div className="px-3 py-2 rounded-2xl rounded-tr-sm bg-gray-100 text-gray-400 flex items-center gap-1">
                                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
                                        </div>
                                    </div>
                                    <Avatar className="size-6 shrink-0 mb-1 opacity-70">
                                        <AvatarFallback className="bg-gray-300 text-white text-[8px] font-bold">ÁX</AvatarFallback>
                                    </Avatar>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </div>

                {/* Input Area (Mocked same as real) */}
                <div className="absolute bottom-0 w-full p-3 sm:p-4 bg-transparent z-20 pointer-events-none">
                    <div className="max-w-3xl mx-auto relative flex items-center gap-2 pointer-events-auto">
                        <div className="flex-1 bg-gray-50 border border-gray-200 rounded-full h-12 px-2 flex items-center transition-all gap-1 shadow-lg shadow-black/5 bg-white/80 backdrop-blur-sm">
                            <Button variant="ghost" className="p-2 hover:bg-gray-200/50 rounded-full shrink-0 text-gray-400" type="button">
                                <Paperclip className="size-5" />
                            </Button>
                            <span className="flex-1 text-sm text-gray-400 px-2">Digite sua mensagem...</span>
                            <Button variant="ghost" className="p-2 rounded-full shrink-0 text-gray-400 hover:bg-gray-200/50" type="button">
                                <Mic className="size-5" />
                            </Button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
