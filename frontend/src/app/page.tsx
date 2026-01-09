"use client";

import Image from "next/image";
import Link from "next/link";
import { HeroText } from "@/components/landing/hero-text";
import { WhatsappDemo } from "@/components/landing/whatsapp-demo";
import { ProblemSection } from "@/components/landing/problem-section";
import { SolutionSection } from "@/components/landing/solution-section";
import { DynamicBackground } from "@/components/ui/dynamic-background";

export default function Home() {
    return (
        <main className="w-full text-gray-900 selection:bg-blue-100 relative">
            <DynamicBackground />

            {/* Hero Section */}
            <section className="relative min-h-screen w-full overflow-hidden flex flex-col md:block bg-transparent">

                {/* Header: Logo + Login */}
                <div className="absolute top-6 md:top-8 left-0 right-0 z-50 w-full max-w-[1400px] mx-auto px-4 md:px-12 pointer-events-none flex justify-between items-center">
                    <Link href="/" className="pointer-events-auto">
                        <Image
                            src="/assets/brand/axis-logo.svg"
                            alt="AXIS Logo"
                            width={240}
                            height={80}
                            className="h-16 md:h-24 w-auto opacity-90 hover:opacity-100 transition-opacity drop-shadow-[0_0_25px_rgba(255,255,255,0.15)]"
                        />
                    </Link>

                    <Link href="/auth/login" className="pointer-events-auto px-6 py-2.5 rounded-full bg-gray-100 border border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-200 transition-all text-sm font-medium backdrop-blur-sm">
                        Entrar
                    </Link>
                </div>

                {/* Main Layout Container - Grid for Perfect Alignment */}
                <div className="relative z-30 w-full max-w-[1400px] mx-auto px-4 md:px-12 grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-center h-full pt-32 md:pt-28 pb-12 md:pb-0">
                    {/* Left Column: Text Content */}
                    <div className="flex flex-col items-center md:items-start justify-center w-full md:col-span-7 lg:col-span-8">
                        <HeroText />
                    </div>

                    {/* Right Column: Whatsapp Demo */}
                    <div className="hidden md:flex flex-col items-center md:items-end justify-center w-full relative h-[600px] md:col-span-5 lg:col-span-4">
                        <WhatsappDemo />
                    </div>
                    {/* Mobile Only: Show Whatsapp Demo below text */}
                    <div className="md:hidden flex flex-col items-center justify-center w-full mt-8">
                        <WhatsappDemo />
                    </div>
                </div>

                {/* Violet Glow - Bottom Right Corner - Reduced opacity for blend */}
                <div
                    className="absolute bottom-0 right-0 w-[500px] h-[500px] md:w-[1000px] md:h-[1000px] pointer-events-none z-5"
                    style={{
                        background: 'radial-gradient(ellipse 60% 60% at 100% 100%, rgba(139, 92, 246, 0.1) 0%, rgba(139, 92, 246, 0.05) 35%, rgba(139, 92, 246, 0.01) 60%, transparent 80%)',
                        filter: 'blur(100px)'
                    }}
                />
            </section>

            {/* O Problema Section */}
            <section className="relative min-h-[80vh] bg-transparent z-40 py-40 px-4 md:px-12 flex flex-col items-center">
                {/* Ambient Glow: Red (Pain) */}
                <div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] pointer-events-none -z-10"
                    style={{
                        background: 'radial-gradient(circle, rgba(255, 0, 0, 0.05) 0%, transparent 60%)',
                        filter: 'blur(120px)'
                    }}
                />

                <div className="w-full max-w-[1400px] mx-auto">
                    <ProblemSection />
                </div>
            </section>

            {/* A Solução Section */}
            <section className="relative py-40 z-30">
                {/* Ambient Glow: Emerald (Solution) */}
                <div
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[1000px] pointer-events-none -z-10"
                    style={{
                        background: 'radial-gradient(circle, rgba(16, 185, 129, 0.05) 0%, transparent 60%)',
                        filter: 'blur(120px)'
                    }}
                />
                {/* Visual Fade Mask */}
                <div className="w-full" style={{ maskImage: 'linear-gradient(to bottom, transparent, black 5%, black 95%, transparent)' }}>
                    <SolutionSection />
                </div>
            </section>
        </main>
    );
}
