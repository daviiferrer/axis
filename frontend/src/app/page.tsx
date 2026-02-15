"use client";

import { DynamicHeader } from "@/components/landing/layout/dynamic-header";
import { Hero } from "@/components/landing/sections/hero";
import { ConversationShowcase } from "@/components/landing/sections/conversation-showcase";

export default function Home() {
    return (
        <main className="w-full min-h-screen bg-white text-slate-900 selection:bg-blue-100">
            <DynamicHeader />
            <Hero />
            <ConversationShowcase />
            {/* Future sections (Features, Social Proof, etc.) will go here */}
        </main>
    );
}
