"use client";

import { motion } from "motion/react";
import { ArrowRight, CheckCircle2, Star, Zap } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

const TYPING_WORDS = ["vende 24/7", "qualifica leads", "agenda reuniões", "nunca dorme"];

export function HeroText() {
    const [wordIndex, setWordIndex] = useState(0);
    const [text, setText] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);

    // Typewriter Effect Logic
    useEffect(() => {
        const currentWord = TYPING_WORDS[wordIndex];
        const typeSpeed = isDeleting ? 40 : 80;

        const timer = setTimeout(() => {
            if (!isDeleting && text === currentWord) {
                setTimeout(() => setIsDeleting(true), 1500); // Pause before deleting
            } else if (isDeleting && text === "") {
                setIsDeleting(false);
                setWordIndex((prev) => (prev + 1) % TYPING_WORDS.length);
            } else {
                setText(currentWord.substring(0, text.length + (isDeleting ? -1 : 1)));
            }
        }, typeSpeed);

        return () => clearTimeout(timer);
    }, [text, isDeleting, wordIndex]);

    return (
        <div className="flex flex-col gap-6 max-w-4xl relative z-20 items-center md:items-start text-center md:text-left">
            {/* Live Activity Badge (Social Proof + Urgency) */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 self-center md:self-start px-3 py-1 rounded-full bg-blue-50/80 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 backdrop-blur-sm"
            >
                <div className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </div>
                <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                    <span className="font-bold">14 empresas</span> começaram a escalar hoje
                </span>
            </motion.div>

            {/* Dynamic Headline */}
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold tracking-tight text-gray-900 dark:text-white leading-tight md:leading-[1.1]">
                Sua equipe dorme. <br />
                <span className="whitespace-nowrap flex flex-wrap justify-center md:justify-start gap-x-1.5 md:gap-x-3 items-baseline">
                    <span>O ÁXIS</span>
                    <span className="relative inline-block text-left min-w-[2ch]">
                        {/* Invisible placeholder to reserve width for the longest string */}
                        <span className="invisible opacity-0 select-none" aria-hidden="true">agenda reuniões</span>

                        {/* Actual Typing Text overlay */}
                        <span className="absolute left-0 top-0 whitespace-nowrap text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-violet-600">
                            {text}<span className="animate-pulse text-blue-600">|</span>
                        </span>
                    </span>
                </span>
            </h1>

            {/* Subheadline (HIDDEN ON MOBILE) */}
            <p className="hidden md:block text-lg text-gray-600 dark:text-gray-300 leading-relaxed max-w-xl">
                Transforme seu WhatsApp em uma máquina de vendas autônoma.
                Responda em <span className="font-bold text-gray-900 dark:text-white">0 segundos</span>, aumente a conversão em <span className="font-bold text-gray-900 dark:text-white">391%</span> e nunca mais perca um lead por demora.
            </p>

            {/* Trust Signals (Micro-Social Proof) */}
            <div className="flex items-center justify-center md:justify-start gap-4 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex -space-x-2">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="w-8 h-8 rounded-full border-2 border-white dark:border-neutral-900 bg-gray-200" style={{ backgroundImage: `url(https://i.pravatar.cc/100?img=${i + 10})`, backgroundSize: 'cover' }}></div>
                    ))}
                    <div className="w-8 h-8 rounded-full border-2 border-white dark:border-neutral-900 bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700">+400</div>
                </div>
                <div className="flex flex-col items-start">
                    <div className="flex text-yellow-500">
                        <Star className="w-3 h-3 fill-current" />
                        <Star className="w-3 h-3 fill-current" />
                        <Star className="w-3 h-3 fill-current" />
                        <Star className="w-3 h-3 fill-current" />
                        <Star className="w-3 h-3 fill-current" />
                    </div>
                    <span>Líderes de Vendas confiam</span>
                </div>
            </div>

            {/* CTAs (High Contrast + Risk Reversal) */}
            <div className="flex flex-col sm:flex-row gap-3 mt-2 w-full sm:w-auto justify-center md:justify-start">
                <Link
                    href="/auth/register"
                    className="group flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-semibold text-base transition-all shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40 hover:-translate-y-1"
                >
                    <Zap className="w-4 h-4 fill-current" />
                    Começar Teste Grátis
                </Link>

                <Link
                    href="#demo"
                    className="flex items-center justify-center gap-2 px-6 py-2.5 bg-white dark:bg-neutral-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-neutral-700 rounded-full font-medium hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors"
                >
                    Ver Demonstração
                </Link>
            </div>

            <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-2 mt-2">
                <CheckCircle2 className="w-3 h-3 text-green-500" /> Sem cartão de crédito necessário
                <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                <CheckCircle2 className="w-3 h-3 text-green-500" /> Instalação em 2 minutos
            </p>
        </div>
    );
}
