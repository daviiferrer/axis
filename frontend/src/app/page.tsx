"use client";

import Link from "next/link";
import Image from "next/image";
import { HeroText } from "@/components/landing/sections/hero/hero-text";
import { WhatsappDemo } from "@/components/landing/sections/hero/whatsapp-demo";
import { SolutionSection } from "@/components/landing/sections/solution-section";
import { DynamicHeader } from "../components/landing/layout/dynamic-header";

export default function Home() {
    return (
        <main className="w-full text-slate-900 selection:bg-blue-100 relative bg-white">
            <DynamicHeader />

            {/* 1. HERO SECTION (Restored) */}
            {/* 1. HERO SECTION (Restored) */}
            <section className="relative min-h-screen w-full flex flex-col overflow-hidden z-10">


                {/* Hero Content */}
                <div className="flex-1 flex items-center w-full max-w-[1400px] mx-auto px-4 md:px-12 relative z-10 pb-12 md:pb-48">
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
