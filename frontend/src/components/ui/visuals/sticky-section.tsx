"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";

interface StickySectionProps {
    children: React.ReactNode;
    className?: string;
    index?: number;
}

export function StickySection({ children, className = "bg-white", index = 0 }: StickySectionProps) {
    return (
        <div className="sticky top-0 h-screen flex flex-col justify-center overflow-hidden border-t border-black/5 shadow-2xl">
            <div className={`relative w-full h-full ${className}`}>
                {children}
            </div>
        </div>
    );
}
