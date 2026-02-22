'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import {
    MessageSquare,
    Smartphone,
    Megaphone,
    Calendar,
    Users,
    CreditCard,
    Settings,
    Webhook,
    Shield,
    BarChart3
} from 'lucide-react';

export function MobileBottomNav() {
    const { user } = useAuth();
    const pathname = usePathname();

    const links = [
        {
            label: "Início",
            href: "/app/dashboard",
            icon: BarChart3,
        },
        {
            label: "Conversas",
            href: "/app/chats",
            icon: MessageSquare,
        },
        {
            label: "Sessões",
            href: "/app/sessions",
            icon: Smartphone,
        },
        {
            label: "Campanhas",
            href: "/app/campaigns",
            icon: Megaphone,
        },
        {
            label: "Agendamentos",
            href: "/app/scheduling",
            icon: Calendar,
        },
        {
            label: "CRM",
            href: "/app/leads",
            icon: Users,
        },
        {
            label: "Faturamento",
            href: "/app/billing",
            icon: CreditCard,
        },
        {
            label: "Ajustes",
            href: "/app/settings/profile",
            icon: Settings,
        },
        {
            label: "Webhooks",
            href: "/app/settings/webhooks",
            icon: Webhook,
        },
    ];

    if ((user as any)?.role === 'admin') {
        links.push({
            label: "Admin",
            href: "/app/admin",
            icon: Shield,
        });
    }

    return (
        <div className="fixed bottom-0 left-0 z-50 w-full h-16 bg-white dark:bg-neutral-900 border-t border-gray-200 dark:border-neutral-800 md:hidden">
            <div className="flex h-full max-w-lg mx-auto overflow-x-auto overflow-y-hidden snap-x snap-mandatory scrollbar-hide no-scrollbar items-center px-2 py-1 gap-2">
                {links.map((link, idx) => {
                    const isActive = pathname === link.href || (pathname?.startsWith(link.href) && link.href !== "#" && link.href !== "/");
                    const Icon = link.icon;
                    return (
                        <Link
                            key={idx}
                            href={link.href}
                            prefetch={true}
                            className="snap-start snap-always shrink-0 flex flex-col items-center justify-center min-w-[72px] h-full px-2"
                        >
                            <div className={cn(
                                "flex items-center justify-center w-8 h-8 rounded-full mb-1 transition-colors",
                                isActive ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600" : "text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                            )}>
                                <Icon className={cn("w-5 h-5", isActive ? "fill-blue-600 font-bold" : "")} />
                            </div>
                            <span className={cn(
                                "text-[10px] font-medium transition-colors text-center w-full truncate",
                                isActive ? "text-blue-600" : "text-neutral-500 dark:text-neutral-400"
                            )}>
                                {link.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
