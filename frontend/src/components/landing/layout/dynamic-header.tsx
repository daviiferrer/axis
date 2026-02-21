"use client";

import { cn } from "@/lib/utils";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { AnimatedLogo } from "@/components/brand/animated-logo";
import { useAuth } from "@/context/AuthContext";

export function DynamicHeader() {
    const { scrollY } = useScroll();
    const [isScrolled, setIsScrolled] = useState(false);
    const { user, loading } = useAuth();

    useMotionValueEvent(scrollY, "change", (latest) => {
        const previous = scrollY.getPrevious() ?? 0;
        if (latest > 10 && !isScrolled) {
            setIsScrolled(true);
        } else if (latest <= 10 && isScrolled) {
            setIsScrolled(false);
        }
    });

    return (
        <motion.header
            className={cn(
                "sticky top-0 z-[1000] w-full transition-all duration-300 ease-in-out",
                isScrolled
                    ? "bg-white/80 backdrop-blur-md border-b border-slate-200/50 shadow-sm py-3"
                    : "bg-transparent border-b border-transparent shadow-none py-5"
            )}
        >
            <div className="w-full max-w-[1400px] mx-auto px-4 md:px-12 flex justify-between items-center">
                <Link href="/" className="relative z-10 block hover:opacity-80 transition-opacity">
                    <AnimatedLogo />
                </Link>

                <nav className="flex items-center gap-6">
                    <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
                        <Link href="#features" className="hover:text-blue-600 transition-colors">Funcionalidades</Link>
                        <Link href="#pricing" className="hover:text-blue-600 transition-colors">Preços</Link>
                    </div>

                    {(!loading && user) ? (
                        <Link
                            href="/app"
                            className={cn(
                                "rounded-full text-sm font-bold transition-all duration-300 border flex items-center gap-2",
                                "bg-slate-900 text-white border-slate-900 px-5 py-2 shadow-lg hover:bg-slate-800 hover:scale-105"
                            )}
                        >
                            Acessar Dashboard
                        </Link>
                    ) : (
                        <Link
                            href="/auth/login"
                            className={cn(
                                "rounded-full text-sm font-bold transition-all duration-300 border",
                                "bg-blue-600 text-white border-blue-600 px-5 py-2 shadow-lg shadow-blue-600/20 hover:bg-blue-700 hover:scale-105"
                            )}
                        >
                            Login
                        </Link>
                    )}
                </nav>
            </div>
        </motion.header>
    );
}
