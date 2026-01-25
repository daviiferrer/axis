"use client";

import Link from "next/link";
import Image from "next/image";
import { HeroText } from "@/components/landing/sections/hero/hero-text";
import { WhatsappDemo } from "@/components/landing/sections/hero/whatsapp-demo";
import { SolutionSection } from "@/components/landing/sections/solution-section";

export default function Home() {
    return (
        <main className="w-full text-slate-900 selection:bg-blue-100 relative bg-white">

            {/* 1. HERO SECTION (Restored) */}
            <section className="relative min-h-screen w-full flex flex-col pt-6 md:pt-12 overflow-hidden z-10">
                {/* Header */}
                <div className="w-full max-w-[1400px] mx-auto px-4 md:px-12 flex justify-between items-center relative z-50">
                    <Link href="/">
                        <Image src="/assets/brand/logo.svg" alt="AXIS Logo" width={120} height={40} className="h-8 md:h-10 w-auto" />
                    </Link>
                    <Link href="/auth/login" className="px-6 py-2 rounded-full bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl">
                        Entrar
                    </Link>
                </div>

                {/* Hero Content */}
                <div className="flex-1 flex items-center w-full max-w-[1400px] mx-auto px-4 md:px-12 relative z-10 pt-10 md:pt-0">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-center w-full">
                        <div className="md:col-span-7 lg:col-span-8 flex justify-center md:justify-start">
                            <HeroText />
                        </div>
                        <div className="md:col-span-5 lg:col-span-4 flex justify-end h-[500px] md:h-[600px] items-center relative">
                            <WhatsappDemo />
                        </div>
                    </div>
                </div>

                {/* Violet Glow (Hero Only Accent) */}
                <div className="absolute bottom-0 right-0 w-[800px] h-[800px] pointer-events-none z-0 opacity-20"
                    style={{ background: 'radial-gradient(ellipse at center, rgba(139, 92, 246, 0.3) 0%, transparent 70%)', filter: 'blur(80px)' }}
                />
            </section>

            {/* 2. THE SOLUTION (Context Cards / RevOps Platform) */}
            <SolutionSection />

        </main>
    );
}
