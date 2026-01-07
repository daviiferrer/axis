"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

export function Header() {
    const { scrollY } = useScroll();

    // Transform values based on scroll
    // Opacity of the background increases with scroll
    const bgOpacity = useTransform(scrollY, [0, 50], [0, 0.2]); // 0 -> 20% opacity
    const backdropBlur = useTransform(scrollY, [0, 50], ["0px", "12px"]);
    const borderOpacity = useTransform(scrollY, [0, 50], [0, 0.05]); // Border fades in

    // Width animation for desktop: expands slightly or similar? 
    // Actually, keeping the "pill" shape logic is crucial.

    return (
        <div className="relative md:absolute top-6 md:top-8 left-0 right-0 z-50 w-full max-w-[1400px] mx-auto px-4 md:px-12 pointer-events-none flex justify-center md:block">
            <motion.header
                initial={{ y: -20, opacity: 0, filter: "blur(10px)" }}
                animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                transition={{ type: "spring", stiffness: 100, damping: 20, mass: 1, delay: 0.3 }}
                style={{
                    backgroundColor: useTransform(bgOpacity, (v) => `rgba(0, 0, 0, ${v})`),
                    backdropFilter: useTransform(backdropBlur, (v) => `blur(${v})`),
                    borderColor: useTransform(borderOpacity, (v) => `rgba(255, 255, 255, ${v})`)
                }}
                className="pointer-events-auto inline-flex md:inline-grid grid-cols-1 grid-rows-1 h-12 rounded-full border shadow-sm ring-1 ring-white/5 overflow-hidden w-[92vw] md:w-auto mt-4 md:mt-0"
            >
                {/* Phantom Text for Exact Width Sizing (Desktop Only) */}
                <div className="col-start-1 row-start-1 opacity-0 invisible select-none whitespace-nowrap text-[67px] font-bold tracking-[-0.04em] px-8 hidden md:flex items-center" aria-hidden="true">
                    Qualifique leads e feche vendas
                </div>

                {/* Real Header Content */}
                <div className="col-start-1 row-start-1 w-full h-full flex items-center justify-start px-8 z-10">
                    {/* Logo */}
                    <div className="flex items-center gap-2">
                        <Link href="/" className="relative group">
                            <Image
                                src="/logo.svg"
                                alt="AXIS Logo"
                                width={240}
                                height={80}
                                className="h-20 w-auto opacity-90 hover:opacity-100 transition-opacity invert"
                            />
                        </Link>
                    </div>
                </div>
            </motion.header >
        </div >
    );
}
