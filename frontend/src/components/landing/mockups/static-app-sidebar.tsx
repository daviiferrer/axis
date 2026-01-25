"use client";
import React, { useState } from "react";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import Link from "next/link";
import { motion } from "motion/react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import {
    MessageSquare, Smartphone, Megaphone, Bot, CreditCard, Webhook,
    Shield, Building2, Check, ChevronsUpDown, Plus, Settings, LogOut
} from "lucide-react";

// MOCK DATA for Static Presentation
const MOCK_COMPANY = {
    name: "ÁXIS Demo",
    logo_url: "/assets/brand/logo-icon.svg", // Fallback if no logo
    role: "owner"
};

const MOCK_USER = {
    name: "Visitante",
    email: "demo@axis.ai",
    avatar_url: null
};

export function StaticAppSidebar() {
    const [open, setOpen] = useState(true); // Always open for demo

    // Static Links matching the real app
    const links = [
        {
            label: "Conversas",
            href: "#",
            icon: (
                <MessageSquare className="h-5 w-5 shrink-0 text-blue-600 fill-blue-600" strokeWidth={0.5} />
            ),
        },
        {
            label: "Sessões",
            href: "#",
            icon: (
                <Smartphone className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" strokeWidth={0.5} />
            ),
        },
        {
            label: "Campanhas",
            href: "#",
            icon: (
                <Megaphone className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" strokeWidth={0.5} />
            ),
        },
        {
            label: "Agentes",
            href: "#",
            icon: (
                <Bot className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" strokeWidth={0.5} />
            ),
        },
        {
            label: "Faturamento",
            href: "#",
            icon: (
                <CreditCard className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" strokeWidth={0.5} />
            ),
        },
    ];

    return (
        <div className="h-[600px] w-full flex flex-col md:flex-row bg-gray-100/50 dark:bg-neutral-800 flex-1 border border-neutral-200 dark:border-neutral-700 overflow-hidden rounded-2xl pointer-events-none select-none">
            <Sidebar open={true} setOpen={() => { }}>
                <SidebarBody className="justify-between gap-10">
                    <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                        {/* Static Logo */}
                        <div className="font-normal flex space-x-2 items-center text-sm text-black py-1 relative z-20">
                            <motion.div
                                initial={{ width: "8rem" }}
                                animate={{ width: "8rem" }}
                                className="h-6 relative overflow-hidden flex-shrink-0"
                            >
                                <div className="absolute top-0 left-0 h-full w-32">
                                    {/* Render placeholder text or image if asset missing */}
                                    <div className="text-xl font-bold tracking-tight">ÁXIS</div>
                                </div>
                            </motion.div>
                        </div>

                        <div className="mt-8 flex flex-col gap-2">
                            {links.map((link, idx) => (
                                <div key={idx} className="flex items-center justify-start gap-2 group/sidebar py-2">
                                    {link.icon}
                                    <span className="text-neutral-700 dark:text-neutral-200 text-sm group-hover/sidebar:translate-x-1 transition duration-150 whitespace-pre inline-block !p-0 !m-0">
                                        {link.label}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Static User Profile */}
                    <div className="flex flex-col gap-2 opacity-50">
                        <div className="flex items-center gap-2 p-2">
                            <div className="h-7 w-7 shrink-0 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-500">
                                D
                            </div>
                            <div className="text-sm">Demo User</div>
                        </div>
                    </div>
                </SidebarBody>
            </Sidebar>

            {/* Content Area Mockup */}
            <div className="flex flex-1 bg-white dark:bg-neutral-900 border-l border-neutral-200 p-8">
                <div className="flex flex-col gap-8 w-full">
                    {/* Dashboard Header */}
                    <div className="flex items-center justify-between">
                        <h2 className="text-3xl font-bold text-slate-900">Dashboard</h2>
                        <div className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium">
                            Nova Campanha +
                        </div>
                    </div>

                    {/* Stats Grid Mockup */}
                    <div className="grid grid-cols-4 gap-4">
                        {[
                            { label: "Leads Ativos", val: "1,204", icon: "👥" },
                            { label: "Conversão", val: "32%", icon: "📈" },
                            { label: "Agendamentos", val: "84", icon: "📅" },
                            { label: "Receita (Est.)", val: "R$ 42k", icon: "💰" }
                        ].map((stat, i) => (
                            <div key={i} className="p-4 border rounded-xl bg-slate-50">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm text-slate-500">{stat.label}</span>
                                    <span>{stat.icon}</span>
                                </div>
                                <div className="text-2xl font-bold">{stat.val}</div>
                            </div>
                        ))}
                    </div>

                    {/* Main Chart Placeholder */}
                    <div className="h-64 w-full bg-slate-50 rounded-xl border border-dashed border-slate-200 flex items-center justify-center text-slate-400">
                        <span className="text-sm">Área do Gráfico de Performance (Em Tempo Real)</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
