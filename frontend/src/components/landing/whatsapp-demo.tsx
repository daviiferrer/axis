"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Phone, Video, MoreVertical, CheckCheck, Plus, Mic, ArrowDown } from "lucide-react";
import { useEffect, useState, useRef } from "react";

// Mock Data Generation
const NAMES = ["Mariana", "Carlos", "Fernanda", "Rafael", "Beatriz", "Gustavo", "Julia", "Lucas", "Ana", "Pedro", "Larissa", "Thiago", "Camila", "Bruno", "Patrícia", "Aline", "Felipe", "Renata", "Diego", "Carla"];

const FAQ_PAIRS = [
    { q: "Vocês integram com anúncios do Face?", a: "Sim! Falo com seus leads do Meta Ads em segundos, aumentando a conversão na hora. ⚡" },
    { q: "E se o cliente mandar áudio?", a: "Eu ouço, transcrevo e respondo áudios de até 2 minutos com precisão humana! 🎙️" },
    { q: "Você sabe se o lead tá irritado?", a: "Tenho análise de sentimento. Se detectar frustração, chamo um humano na hora. 🧠" },
    { q: "O SDR humano assume quando?", a: "Quando o lead pede, quando a venda tá pronta ou se eu notar que precisa de ajuda. 🤝" },
    { q: "Funciona de madrugada?", a: "24/7! Não deixo nenhum lead esperando, seja domingo ou feriado. 🌙" },
    { q: "Consegue agendar reunião pra mim?", a: "Claro! Sincronizo com sua agenda e marco demos direto no chat. 📅" },
    { q: "E se o lead parar de responder?", a: "Faço follow-ups automáticos e naturais pra tentar recuperar o interesse dele. 🎣" },
    { q: "Dá pra mudar seu jeito de falar?", a: "100%. Posso ser formal, descontraído ou agressivo, do jeito que sua marca preferir. 🎯" },
    { q: "Precisa de cartão pra testar?", a: "Não! Você pode testar nossa tecnologia gratuitamente por 7 dias. 🆓" },
    { q: "Integra com HubSpot e Pipedrive?", a: "Sim, integração nativa. Tudo que acontece aqui vai pro seu CRM em tempo real. 🔄" },
    { q: "Qual o preço pra empresas?", a: "Começa em R$ 499/mês. Se quiser, te mostro a tabela completa agora! 💰" },
    { q: "Quantos leads atende ao mesmo tempo?", a: "Infinitos. Posso falar com 10 ou 10.000 pessoas simultaneamente sem filas. 🚀" },
    { q: "E se bloquearem meu chip?", a: "Usamos rotação de números e aquecimento IA para minimizar risco de bloqueio. 🛡️" },
    { q: "Você qualifica os leads antes?", a: "Sim! Só passo pro time comercial quem tem fit real com sua empresa. ✅" },
    { q: "Treino você com meus dados?", a: "Isso! Você sobe seus PDFs e site, e eu aprendo tudo sobre seu produto em minutos. 📚" },
    { q: "Serve pra clínica médica?", a: "Perfeito para agendar consultas, tirar dúvidas de preparo e confirmar presença. 🏥" },
    { q: "E pra imobiliária, funciona?", a: "Sim! Faço triagem de perfil, renda e agendo visitas aos imóveis automaticamente. 🏠" },
    { q: "Tem contrato de fidelidade?", a: "Zero fidelidade. Acreditamos na nossa entrega, você fica porque gera resultado! 🔓" },
    { q: "Atende em outros idiomas?", a: "Falo português, inglês e espanhol fluentemente, detectando o idioma do lead. 🌎" },
    { q: "Consigo ver as conversas depois?", a: "Tudo fica gravado no dashboard e no seu CRM pra auditoria e controle total. 📊" }
];

const generateMessages = () => {
    const msgs = [];
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

        // Bot Message
        msgs.push({
            id: `msg-${i}-bot`,
            type: 'bot',
            text: pair.a,
            sender: 'Áxis AI',
            time: 'Agora'
        });
    }
    return msgs;
};

const ALL_MESSAGES = generateMessages();

export function WhatsappDemo() {
    const [messages, setMessages] = useState<any[]>([]);
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const indexRef = useRef(3); // Track index without re-rendering loop

    // Initial Load
    useEffect(() => {
        setMessages(ALL_MESSAGES.slice(0, 3));
    }, []);

    // Infinite Feed Logic with Typing Simulator
    useEffect(() => {
        let timeout: NodeJS.Timeout;

        const playTurn = () => {
            // 1. Start Typing
            setIsTyping(true);

            // 2. Simulate Typing Duration
            timeout = setTimeout(() => {
                setIsTyping(false);

                // 3. Add Message
                const currentIdx = indexRef.current;
                indexRef.current += 1; // Increment outside setter to safe-guard against Strict Mode

                setMessages((prev) => {
                    const rawMsg = ALL_MESSAGES[currentIdx % ALL_MESSAGES.length];
                    const newMsg = { ...rawMsg, id: `${rawMsg.id}-${Date.now()}` };

                    const newHistory = [...prev, newMsg];
                    if (newHistory.length > 7) {
                        return newHistory.slice(newHistory.length - 7);
                    }
                    return newHistory;
                });

                // 4. Wait before next cycle (Idle time)
                timeout = setTimeout(playTurn, 1200 + Math.random() * 500);

            }, 600 + Math.random() * 400); // Typing duration
        };

        // Start the loop
        timeout = setTimeout(playTurn, 1500);

        return () => clearTimeout(timeout);
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="pointer-events-auto relative md:absolute md:top-1/2 md:-translate-y-1/2 md:mt-[5vh] right-0 lg:right-[5%] z-20 w-[300px] md:w-[340px] h-auto flex flex-col gap-4 font-sans"
        >
            {/* Floating Header */}
            <div className="bg-gradient-to-b from-[#0F1117]/80 to-transparent backdrop-blur-md p-3 rounded-t-2xl border-t border-x border-white/10 border-b-0 flex items-center justify-between relative z-30">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00A884] to-[#008f6f] flex items-center justify-center shadow-lg shadow-[#00A884]/20 relative overflow-hidden">
                        <svg viewBox="0 0 24 24" fill="white" className="w-6 h-6 relative z-10">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                        </svg>
                    </div>
                    <div className="flex flex-col justify-center">
                        <div className="flex items-center gap-2">
                            <span className="text-white font-bold text-sm">Áxis</span>
                            <span className="text-white/40 text-[11px] font-normal">Atendendo agora</span>
                        </div>
                        <span className="text-[#00A884] text-[10px] font-medium transition-all duration-300 min-h-[15px]">
                            {isTyping ? "digitando..." : "online"}
                        </span>
                    </div>
                </div>
            </div>

            {/* Infinite Scroll Area */}
            <div
                className="flex flex-col gap-3 relative h-[325px] overflow-hidden justify-end pb-2"
                style={{
                    maskImage: 'linear-gradient(to bottom, transparent 0%, black 25%, black 100%)',
                    WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 25%, black 100%)'
                }}
            >

                <AnimatePresence mode="popLayout">
                    {messages.map((msg, index) => (
                        <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 50, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -20, scale: 0.95, transition: { duration: 0.5 } }}
                            transition={{ type: "spring", stiffness: 200, damping: 20 }}
                            layout
                            className={`flex flex-col max-w-[90%] z-10 ${msg.type === 'bot' ? 'self-start' : 'self-end items-end'}`}
                        >
                            <span className={`text-[10px] text-gray-400/80 mb-1 px-1 ${msg.type === 'bot' ? 'text-left' : 'text-right'}`}>
                                {msg.sender}
                            </span>
                            <div className={`
                                p-3 rounded-2xl text-sm shadow-lg border relative backdrop-blur-md
                                ${msg.type === 'bot'
                                    ? 'bg-[#11141C]/60 text-gray-200 rounded-tl-sm border-white/5'
                                    : 'bg-[#005C4B]/60 text-white rounded-tr-sm border-[#005C4B]/30 shadow-[#005C4B]/10'}
                            `}>
                                <p>{msg.text}</p>
                                <span className="text-[9px] text-white/40 block text-right mt-1">{msg.time}</span>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

        </motion.div>
    );
}
