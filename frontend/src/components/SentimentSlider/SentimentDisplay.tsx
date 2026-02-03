"use client";

import React, { useEffect, useState, useRef } from 'react';
import {
    motion,
    useMotionValue,
    useTransform,
    useSpring,
    AnimatePresence
} from 'framer-motion';
import {
    MoodAngry,
    MoodSkeptical,
    MoodNeutral,
    MoodHappy,
    MoodExcited
} from './SentimentIcons';

// Configuration for B2B Context
const moodConfig = [
    {
        component: MoodAngry,
        color: '#DC2626',
        label: 'Crítico',
        b2bTitle: 'Risco de Churn',
        b2bDesc: 'Cliente demonstrou forte insatisfação. Requer intervenção imediata.'
    },
    {
        component: MoodSkeptical,
        color: '#F59E0B',
        label: 'Cético',
        b2bTitle: 'Objeções Detectadas',
        b2bDesc: 'Cliente tem dúvidas sobre valor ou funcionalidade. Necessário nutrir.'
    },
    {
        component: MoodNeutral,
        color: '#EAB308',
        label: 'Neutro',
        b2bTitle: 'Em Qualificação',
        b2bDesc: 'Interação transacional padrão. Sem sinais fortes de compra ou risco.'
    },
    {
        component: MoodHappy,
        color: '#84CC16',
        label: 'Engajado',
        b2bTitle: 'Interesse Validado',
        b2bDesc: 'Cliente vê valor na solução. Bom momento para aprofundar.'
    },
    {
        component: MoodExcited,
        color: '#10B981',
        label: 'Comprador',
        b2bTitle: 'Sinal de Compra',
        b2bDesc: 'Alta intenção de fechamento detectada. Prepare o contrato!'
    },
];

interface SentimentDisplayProps {
    value: number;
    onManualSelect?: (index: number) => void;
    variant?: 'default' | 'header';
}

export function SentimentDisplay({ value, onManualSelect, variant = 'default' }: SentimentDisplayProps) {
    const motionValue = useMotionValue(value);
    const [activePopup, setActivePopup] = useState<number | null>(null);

    // Close popup on outside click (simple implementation)
    useEffect(() => {
        const handleClick = () => setActivePopup(null);
        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, []);

    useEffect(() => {
        motionValue.set(value);
    }, [value, motionValue]);

    const smoothValue = useSpring(motionValue, {
        stiffness: 300,
        damping: 30,
        mass: 0.8
    });

    const bgColor = useTransform(
        smoothValue,
        [0, 1, 2, 3, 4],
        ['#FEF2F2', '#FFFBEB', '#FEFCE8', '#F0FDF4', '#ECFDF5']
    );

    const accentColor = useTransform(
        smoothValue,
        [0, 1, 2, 3, 4],
        moodConfig.map(m => m.color)
    );

    const isHeader = variant === 'header';

    return (
        <motion.div
            className={`relative flex items-center justify-center transition-colors duration-0 ${isHeader ? 'w-full' : 'w-full h-full flex-col'}`}
            style={{ backgroundColor: isHeader ? 'transparent' : bgColor }}
            onClick={(e) => e.stopPropagation()} // Prevent closing popup when clicking inside
        >

            {/* Emojis Container */}
            <div className={`flex items-end justify-center ${isHeader ? 'gap-4 h-auto' : 'gap-[25px] h-64 px-8'}`}>
                {moodConfig.map((mood, index) => {
                    return (
                        <div key={index} className="relative group">
                            <EmojiItem
                                index={index}
                                smoothValue={smoothValue}
                                component={mood.component}
                                onClick={() => {
                                    // Always allow popup toggle
                                    setActivePopup(activePopup === index ? null : index);

                                    // Only trigger selection change if handler exists
                                    if (onManualSelect) {
                                        onManualSelect(index);
                                    }
                                }}
                                variant={variant}
                                interactive={true} // Always allow visual interaction (hover/click for popup)
                            />

                            {/* B2B Popup / Floating Menu - Always show if activePopup matches, regardless of manual select */}
                            <AnimatePresence>
                                {activePopup === index && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        className="absolute top-14 left-1/2 -translate-x-1/2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 p-4 z-50 text-left pointer-events-none"
                                        style={{ pointerEvents: 'auto' }}
                                    >
                                        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white rotate-45 border-t border-l border-gray-100" />
                                        <div className="relative z-10">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: mood.color }} />
                                                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Nível {index}</span>
                                            </div>
                                            <h3 className="font-bold text-gray-900 text-sm mb-1">{mood.b2bTitle}</h3>
                                            <p className="text-xs text-gray-500 leading-relaxed">{mood.b2bDesc}</p>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    );
                })}
            </div>

        </motion.div>
    );
}

// Sub-component for individual Emoji animation
function EmojiItem({ index, smoothValue, component: Icon, onClick, variant, interactive }: {
    index: number,
    smoothValue: any,
    component: any,
    onClick: () => void,
    variant: 'default' | 'header',
    interactive: boolean
}) {
    const isHeader = variant === 'header';

    const distance = useTransform(smoothValue, (v: number) => {
        return Math.abs(v - index);
    });

    // In header mode, we still want the "iPhone dock" effect but subtler
    // Base scale is smaller (w-8 vs w-24), but the pop effect is relative
    const scaleRange = isHeader ? [1.5, 1.0, 0.7] : [1.7, 0.9, 0.75];
    const yRange = isHeader ? [-8, 0, 4] : [-50, 0, 10];

    // Header icons base size
    const baseWidth = isHeader ? 'w-8' : 'w-24';

    const scale = useTransform(distance, [0, 1, 2], scaleRange);
    const y = useTransform(distance, [0, 1, 2], yRange);
    const opacity = useTransform(distance, [0, 0.8, 1.5], [1, 0.8, 0.4]);
    const zIndex = useTransform(distance, (d) => (d < 0.5 ? 10 : 1));

    return (
        <motion.div
            onClick={(e) => {
                e.stopPropagation();
                if (interactive) onClick();
            }}
            className={`relative ${interactive ? 'cursor-pointer' : 'cursor-default'} flex flex-col items-center justify-end ${baseWidth} will-change-transform`}
            style={{
                scale,
                y,
                opacity,
                zIndex
            }}
        >
            <motion.div
                className="w-full h-full"
                whileHover={interactive ? { scale: 1.15 } : undefined} // Apply hover scale multiplicatively only if interactive
                whileTap={interactive ? { scale: 0.95 } : undefined}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
                <Icon className="w-full h-full drop-shadow-sm filter" />
            </motion.div>
        </motion.div>
    )
}
