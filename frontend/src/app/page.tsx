"use client";

import { DynamicHeader } from "@/components/landing/layout/dynamic-header";
import { Hero } from "@/components/landing/sections/hero";

export default function Home() {
    return (
        <main className="w-full min-h-screen bg-white text-slate-900 selection:bg-blue-100">
            <DynamicHeader />
            <Hero />
            {/* Future sections (Features, Social Proof, etc.) will go here */}
        </main>
    );
}
