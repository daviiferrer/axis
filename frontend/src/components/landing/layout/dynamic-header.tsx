"use client";

import { cn } from "@/lib/utils";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

export function DynamicHeader() {
    return (
        <motion.header
            className={cn(
                "sticky top-0 z-[1000] w-full border-b",
                "backdrop-blur-xl supports-[backdrop-filter]:bg-white/60",
                "bg-white/85 border-white/40 shadow-sm py-3"
            )}
        >
            <div className="w-full max-w-[1400px] mx-auto px-4 md:px-12 flex justify-between items-center">
                <Link href="/" className="relative z-10 block hover:opacity-80 transition-opacity">
                    <Image
                        src="/assets/brand/logo.svg"
                        alt="AXIS Logo"
                        width={100}
                        height={32}
                        className="w-auto h-6"
                        priority
                    />
                </Link>

                <nav className="flex items-center gap-4">
                    <Link
                        href="/auth/login"
                        className={cn(
                            "rounded-full text-sm font-medium transition-all duration-300 border",
                            "bg-slate-900 text-white border-slate-900 px-4 py-1.5 shadow-md hover:bg-slate-800"
                        )}
                    >
                        Entrar
                    </Link>
                </nav>
            </div>
        </motion.header>
    );
}
