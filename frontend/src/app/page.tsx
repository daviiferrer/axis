"use client";


import Link from "next/link";
import Image from "next/image";
import { HeroText } from "@/components/landing/sections/hero/hero-text";
import { WhatsappDemo } from "@/components/landing/sections/hero/whatsapp-demo";
import { DynamicBackground } from "@/components/ui/visuals/dynamic-background";

export default function Home() {
    return (
        <main className="w-full text-gray-900 selection:bg-blue-100 relative">
            <DynamicBackground />

            {/* Hero Section */}
            <section className="relative min-h-screen w-full overflow-hidden flex flex-col md:block bg-transparent mb-0">
                {/* Header: Logo + Login */}
                <div className="absolute top-6 md:top-8 left-0 right-0 z-50 w-full max-w-[1400px] mx-auto px-4 md:px-12 pointer-events-none flex justify-between items-center">
                    {/* Logo - Restored & Scaled Up */}
                    <Link href="/" className="pointer-events-auto">
                        <Image
                            src="/assets/brand/axis-logo.svg"
                            alt="AXIS Logo"
                            width={240}
                            height={80}
                            className="h-16 md:h-20 w-auto opacity-90 hover:opacity-100 transition-opacity"
                        />
                    </Link>

                    {/* Login CTA - Smaller Pill Shape */}
                    <Link
                        href="/auth/login"
                        className="pointer-events-auto px-6 py-2 rounded-full bg-white text-gray-900 text-sm font-medium hover:bg-gray-100 transition-all shadow-sm border border-gray-200"
                    >
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
                    className="absolute bottom-0 right-0 w-[500px] h-[500px] md:w-[1000px] md:h-[1000px] pointer-events-none z-5 will-change-transform"
                    style={{
                        background: 'radial-gradient(ellipse 60% 60% at 100% 100%, rgba(139, 92, 246, 0.1) 0%, rgba(139, 92, 246, 0.05) 35%, rgba(139, 92, 246, 0.01) 60%, transparent 80%)',
                        filter: 'blur(60px)'
                    }}
                />
            </section>
        </main>
    );
}
