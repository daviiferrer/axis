"use client";

import { motion, AnimatePresence, useInView } from "framer-motion";
import { Phone, Video, MoreVertical, CheckCheck, Plus, Mic, ArrowDown } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { TextGenerateEffect } from "@/components/ui/visuals/text-generate-effect";


// Mock Data Generation
const NAMES = ["Mariana", "Carlos", "Fernanda", "Rafael", "Beatriz", "Gustavo", "Julia", "Lucas", "Ana", "Pedro", "Larissa", "Thiago", "Camila", "Bruno", "Patrícia", "Aline", "Felipe", "Renata", "Diego", "Carla"];

const FAQ_PAIRS = [
    // --- NÍVEL 1: SEGURANÇA & INFRAESTRUTURA (O Medo do Banimento) ---
    {
        q: "mano, mas e se o zap bloquear meu numero? ja perdi um chip assim",
        a: "Relaxa! A AXIS usa a API Oficial da Meta (Cloud API). Zero gambiarra, zero risco de banimento. Seu número tá blindado. �️",
        agentRole: "Consultor",
        agentName: "Roberto",
        thinking: [
            "⚠️ Risco detectado: banimento_whatsapp",
            "🛡️ Consultando Infra: API Oficial Meta (Verified)",
            "✅ Protocolo de Segurança: Blindagem Ativa"
        ]
    },
    {
        q: "precisa deixar celular ligado com qr code?",
        a: "Esquece isso! Somos nuvem pura. Seu celular pode tá desligado, sem bateria ou no fundo do mar, a AXIS continua vendendo. ☁️",
        agentRole: "Tech Lead",
        agentName: "Ana",
        thinking: [
            "🔌 Analisando arquitetura: Cloud vs Local",
            "⚡ Status do Servidor: 99.9% Uptime",
            "✅ Resposta: Independência de hardware"
        ]
    },

    // --- NÍVEL 2: VENDAS & ROI (Técnica SPIN) ---
    {
        q: "mas achei meio caro... tem ferramenta de 50 reais por ai",
        a: "Tem sim, mas quanto custa perder 1 cliente de 5k pq o bot barato travou? A AXIS se paga com UMA venda recuperada. 📉",
        agentRole: "Vendas",
        agentName: "Roberto",
        thinking: [
            "� Objeção de Preço: Comparativo de Mercado",
            "� Calculando Custo de Oportunidade (Churn)",
            "✅ Reenquadramento: Investimento vs Custo"
        ]
    },
    {
        q: "vcs garantem q vou vender mais?",
        a: "Olha, lead que é respondido em < 1 min converte 391% mais. A gente garante que ninguém fica no vácuo. O resto é com seu produto! �",
        agentRole: "Vendas",
        agentName: "Roberto",
        thinking: [
            "� Analisando métricas de Speed-to-Lead...",
            "� Benchmark Harvard: < 1 min = +391% Conversão",
            "✅ Argumento Baseado em Dados"
        ]
    },

    // --- NÍVEL 3: HUMANIZAÇÃO & EMPATIA (Quebrando a Robotização) ---
    {
        q: "e se o cliente mandar audio de 3 minutos chorando as pitanga?",
        a: "Eu ouço tudo! Transcrevo o áudio, entendo que ele tá frustrado (análise de sentimento) e respondo com empatia total. 🎧",
        agentRole: "Suporte",
        agentName: "Ana",
        thinking: [
            "🎤 Processando Áudio: Whisper V3 (OpenAI)",
            "🧠 Análise de Sentimento: Frustração Detectada",
            "✅ Ação: Resposta Empática e Acolhedora"
        ]
    },
    {
        q: "ele entende giria? tipo 'manda o pix'",
        a: "Entende sim! 'Manda o pix', 'qual a facada', 'tá salgado'... O modelo de linguagem pega o contexto e não trava igual robô antigo. 🧠",
        agentRole: "Tech Lead",
        agentName: "Ana",
        thinking: [
            "🗣️ Detectando Gírias Regionais (PT-BR)...",
            "� Interpretando Intenção: Solicitação de Pagamento",
            "✅ Resposta Contextualizada: Chave PIX"
        ]
    },

    // --- NÍVEL 4: VERTICAL SAÚDE (Clínicas e Consultórios) ---
    {
        q: "serve pra clinica? a recepcionista ta ficando doida",
        a: "Salva vidas em clínica! Confirmo consultas, mando preparo de exames e tiro dúvidas repetitivas. A recepcionista vai te agradecer. 🏥",
        agentRole: "Especialista",
        agentName: "Sofia",
        thinking: [
            "🏥 Identificando Nicho: Saúde/Clínica",
            "📉 Dor Principal: Sobrecarga Administrativa",
            "✅ Solução: Automação de Agendamento e Triagem"
        ]
    },
    {
        q: "e se o paciente não aparecer?",
        a: "Eu mando lembrete 24h antes pedindo confirmação. Se ele cancelar, já ofereço o horário vago pra lista de espera na hora! ♻️",
        agentRole: "Especialista",
        agentName: "Sofia",
        thinking: [
            "📉 Problema: No-Show (Absenteísmo)",
            "� Estratégia: Confirmação Ativa + Lista de Espera",
            "✅ Resultado: Otimização de Agenda"
        ]
    },

    // --- NÍVEL 5: VERTICAL IMOBILIÁRIA (Corretores e Lançamentos) ---
    {
        q: "sou corretor, o lead pergunta o preço e some",
        a: "Clássico. Eu faço a triagem antes: pergunto orçamento, região e urgência. Só passo pro seu whats pessoal quem quer comprar mesmo. 🏠",
        agentRole: "Especialista",
        agentName: "Pedro",
        thinking: [
            "🏠 Identificando Nicho: Mercado Imobiliário",
            "❄️ Problema: Leads Frios/Desqualificados",
            "✅ Solução: Funil de Qualificação Automático"
        ]
    },
    {
        q: "consegue agendar visita no stand?",
        a: "Consigo! Vejo sua agenda no Google Calendar, ofereço os horários livres e mando a localização do stand pro cliente. �",
        agentRole: "Especialista",
        agentName: "Pedro",
        thinking: [
            "📅 Integração: Google Calendar API",
            "📍 Ação: Enviar Localização (Google Maps)",
            "✅ Confirmação de Visita Automática"
        ]
    },

    // --- NÍVEL 6: VERTICAL E-COMMERCE (Varejo e Lojas) ---
    {
        q: "tenho loja no shopify, ele recupera carrinho?",
        a: "Integro nativo! O cliente abandonou? Eu chamo no zap: 'Oi Ju, vi que esqueceu o tênis... quer um cupom de 5% pra fechar agora?'. �",
        agentRole: "Vendas",
        agentName: "Lucas",
        thinking: [
            "� Integração: Shopify Webhooks",
            "⚡ Gatilho: Carrinho Abandonado (> 15min)",
            "✅ Ação: Oferta de Retenção Personalizada"
        ]
    },
    {
        q: "vcs mandam codigo de rastreio?",
        a: "Mando sim! Assim que o pedido sai, eu aviso o cliente. Isso diminui em 90% as perguntas de 'cadê meu pedido' no suporte. �",
        agentRole: "Suporte",
        agentName: "Ana",
        thinking: [
            "📦 Integração: ERP/Logística",
            "� Dor: Ticket de Suporte (WISMO)",
            "✅ Solução: Notificação Proativa de Status"
        ]
    },

    // --- NÍVEL 7: SUPORTE TÉCNICO & FUNCIONALIDADES (O "Tira-Teima") ---
    {
        q: "blz, mas é dificil configurar? sou pessimo com pc",
        a: "Zero código. Você sobe seus PDFs/Site, eu leio tudo e aprendo sozinho. Em 10 minutos seu agente tá pronto. ⏱️",
        agentRole: "Onboarding",
        agentName: "Ana",
        thinking: [
            "⚙️ Objeção: Complexidade Técnica",
            "� Recurso: RAG (Ingestão de Documentos)",
            "✅ Promessa: Setup em < 10 minutos"
        ]
    },
    {
        q: "posso intervir na conversa se precisar?",
        a: "Sempre! O painel da AXIS mostra tudo em tempo real. Você pode assumir a conversa (human takeover) com um clique. handshake",
        agentRole: "Suporte",
        agentName: "Ana",
        thinking: [
            "🤝 Funcionalidade: Human Handoff",
            "� Monitoramento: Real-time Dashboard",
            "✅ Controle: Transição Bot-Humano Trasparente"
        ]
    },
    {
        q: "dá pra integrar com meu CRM?",
        a: "Dá sim! RD Station, HubSpot, Pipedrive... O que você usa? A gente joga o lead lá dentro qualificado automaticamente. 🔄",
        agentRole: "Tech Lead",
        agentName: "Ana",
        thinking: [
            "🔄 Integração: Webhooks/API Rest",
            "🗂️ Destino: CRM (RD/HubSpot/Pipedrive)",
            "✅ Ação: Sincronização de Dados de Lead"
        ]
    },

    // --- NÍVEL 8: FECHAMENTO (O "Agora ou Nunca") ---
    {
        q: "posso testar antes de pagar?",
        a: "Deve! Liberei 7 dias grátis pra você. Clica no botão ali em cima e cria seu primeiro agente agora sem cartão. 🆓",
        agentRole: "Vendas",
        agentName: "Roberto",
        thinking: [
            "✅ Fechamento: Trial Gratuito (7 dias)",
            "💳 Risco: Zero (Sem Cartão de Crédito)",
            "🚀 CTA: Inscrição Imediata"
        ]
    }
];

const generateMessages = () => {
    const msgs: any[] = [];
    // Generate distinct sets of conversations
    for (let i = 0; i < 100; i++) {
        const pair = FAQ_PAIRS[i % FAQ_PAIRS.length];
        const name = NAMES[i % NAMES.length];

        // Lead Message
        msgs.push({
            id: `msg-${i}-lead`,
            type: 'lead',
            text: pair.q,
            sender: name,
            time: 'Agora'
        });

        // Bot Message (with agent persona)
        msgs.push({
            id: `msg-${i}-bot`,
            type: 'bot',
            text: pair.a,
            agentRole: pair.agentRole,
            agentName: pair.agentName,
            thinking: pair.thinking,
            time: 'Agora'
        });
    }
    return msgs;
};

const ALL_MESSAGES = generateMessages();

export function WhatsappDemo() {
    const [messages, setMessages] = useState<any[]>([]);
    const [isTyping, setIsTyping] = useState(false);
    const [currentThinking, setCurrentThinking] = useState<string | null>(null);
    const indexRef = useRef(3); // Track index without re-rendering loop

    const containerRef = useRef<HTMLDivElement>(null);
    const isInView = useInView(containerRef, { once: false, margin: "0px 0px -200px 0px" });

    // Initial Load
    useEffect(() => {
        setMessages(ALL_MESSAGES.slice(0, 3));
    }, []);

    // Infinite Feed Logic with Thinking + Typing Simulator
    useEffect(() => {
        if (!isInView) return; // Pause when not in view

        let timeout: NodeJS.Timeout;

        const playTurn = () => {
            if (!isInView) return; // Double check inside closure

            const currentIdx = indexRef.current;
            const nextMsg = ALL_MESSAGES[currentIdx % ALL_MESSAGES.length];

            // If it's a bot message, show thinking first
            if (nextMsg.type === 'bot' && nextMsg.thinking) {
                // Determine thinking steps (support both array and string for safety, though we updated data)
                const thinkingSteps = Array.isArray(nextMsg.thinking) ? nextMsg.thinking : [nextMsg.thinking];
                let stepIndex = 0;

                const playNextThinkingStep = () => {
                    if (stepIndex < thinkingSteps.length) {
                        setCurrentThinking(thinkingSteps[stepIndex]);
                        stepIndex++;
                        // Use a slightly longer delay to read the text (e.g. 1000ms)
                        // User asked for "0.5s", but we add a bit of buffer for the animation duration
                        timeout = setTimeout(playNextThinkingStep, 1500);
                    } else {
                        // Finished thinking
                        setCurrentThinking(null);

                        // Start Typing
                        setIsTyping(true);

                        // Then add the message
                        timeout = setTimeout(() => {
                            setIsTyping(false);
                            indexRef.current += 1;

                            setMessages((prev) => {
                                const newMsg = { ...nextMsg, id: `${nextMsg.id}-${Date.now()}` };
                                const newHistory = [...prev, newMsg];
                                if (newHistory.length > 7) {
                                    return newHistory.slice(newHistory.length - 7);
                                }
                                return newHistory;
                            });

                            // Next cycle
                            timeout = setTimeout(playTurn, 1200 + Math.random() * 500);
                        }, 600 + Math.random() * 300); // Typing duration
                    }
                };

                // Start the thinking sequence
                playNextThinkingStep();

            } else {
                // Lead message - just show typing briefly then add
                setIsTyping(false); // Leads "type" instantly for this demo speed
                indexRef.current += 1;

                setMessages((prev) => {
                    const newMsg = { ...nextMsg, id: `${nextMsg.id}-${Date.now()}` };
                    const newHistory = [...prev, newMsg];
                    if (newHistory.length > 7) {
                        return newHistory.slice(newHistory.length - 7);
                    }
                    return newHistory;
                });

                // Short pause then next
                timeout = setTimeout(playTurn, 800 + Math.random() * 400);
            }
        };

        // Start the loop
        timeout = setTimeout(playTurn, 1500);

        return () => clearTimeout(timeout);
    }, [isInView]);

    return (
        <motion.div
            ref={containerRef}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="pointer-events-auto relative z-20 w-full max-w-[300px] h-auto flex flex-col gap-4"
        >

            {/* Thinking Background Ambient Effect */}
            <AnimatePresence>
                {currentThinking && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.8 }}
                        className="absolute inset-0 -z-10 overflow-hidden pointer-events-none"
                    >
                        <motion.div
                            animate={{
                                background: [
                                    "radial-gradient(circle at 50% 120%, rgba(168, 85, 247, 0.4) 0%, transparent 50%)", // Purple hint from bottom
                                    "radial-gradient(circle at 10% 120%, rgba(59, 130, 246, 0.4) 0%, transparent 50%)", // Blue hint from left-bottom
                                    "radial-gradient(circle at 90% 120%, rgba(16, 185, 129, 0.4) 0%, transparent 50%)", // Emerald hint from right-bottom
                                ]
                            }}
                            transition={{
                                duration: 2.5,
                                repeat: Infinity,
                                repeatType: "mirror",
                                ease: "easeInOut"
                            }}
                            className="absolute inset-0 w-full h-full blur-3xl opacity-70"
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Floating Header Removed */}

            {/* Infinite Scroll Area */}
            <div
                className="flex flex-col gap-3 relative h-[380px] overflow-hidden justify-end pb-2"
                style={{
                    maskImage: 'linear-gradient(to bottom, transparent 0%, black 25%, black 100%)',
                    WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 25%, black 100%)'
                }}
            >

                <AnimatePresence mode="popLayout">
                    {messages.map((msg) => (
                        <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 50, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -20, scale: 0.95, transition: { duration: 0.5 } }}
                            transition={{ type: "spring", stiffness: 200, damping: 20 }}
                            layout
                            className={`flex flex-col max-w-[90%] z-10 ${msg.type === 'bot' ? 'self-start' : 'self-end items-end'}`}
                        >
                            <span className={`text-[9px] text-gray-500 mb-1 px-1 ${msg.type === 'bot' ? 'text-left' : 'text-right'}`}>
                                {msg.type === 'bot' ? `Áxis AI • ${msg.agentRole} ${msg.agentName}` : msg.sender}
                            </span>
                            <div className={`p-2.5 rounded-2xl max-w-full ${msg.type === 'bot' ? 'bg-gray-100 rounded-tl-sm text-gray-800 text-left' : 'bg-[#155dfc]/10 rounded-tr-sm text-gray-900 text-right'}`}>
                                <p className="text-[13px] font-normal leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                            </div>
                        </motion.div>
                    ))}

                    {/* Thinking Text - Text Generate Effect */}
                    {currentThinking && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="flex flex-col gap-1 self-start px-2 mt-2 max-w-[85%]"
                        >
                            <div className="flex items-center gap-2 mb-1">
                                <div className="relative flex h-1.5 w-1.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-purple-500"></span>
                                </div>
                                <span className="text-purple-500/80 text-[10px] uppercase tracking-wider font-semibold">
                                    Pensando
                                </span>
                            </div>

                            <div className="pl-3.5">
                                <TextGenerateEffect
                                    key={currentThinking}
                                    words={currentThinking}
                                    duration={0.3}
                                    staggerDelay={0.02}
                                    className="text-[11px] text-gray-500 font-light leading-snug italic"
                                />
                            </div>
                        </motion.div>
                    )}

                </AnimatePresence>
            </div>

        </motion.div>
    );
}
