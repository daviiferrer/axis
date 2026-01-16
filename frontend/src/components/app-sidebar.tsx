"use client";
import React, { useState } from "react";
// forcing rebuild for sidebar update
import { Sidebar, SidebarBody, SidebarLink, useSidebar } from "@/components/ui/sidebar";
import Link from "next/link";
import { motion } from "motion/react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, Settings, MessageSquare, Smartphone, Megaphone, Bot, CreditCard, Webhook, Shield } from "lucide-react";

export function AppSidebar() {
    const { user, signOut } = useAuth();
    const [open, setOpen] = useState(false);

    const links = [
        {
            label: "Conversas",
            href: "/app/chats",
            icon: ({ isActive }: { isActive: boolean }) => (
                <MessageSquare
                    className={cn(
                        "h-5 w-5 shrink-0",
                        isActive ? "text-blue-600 fill-blue-600" : "text-neutral-700 dark:text-neutral-200"
                    )}
                    strokeWidth={0.5}
                />
            ),
        },
        {
            label: "Sessões",
            href: "/app/sessions",
            icon: ({ isActive }: { isActive: boolean }) => (
                <Smartphone
                    className={cn(
                        "h-5 w-5 shrink-0",
                        isActive ? "text-blue-600 fill-blue-600" : "text-neutral-700 dark:text-neutral-200"
                    )}
                    strokeWidth={0.5}
                />
            ),
        },
        {
            label: "Campanhas",
            href: "/app/campaigns",
            icon: ({ isActive }: { isActive: boolean }) => (
                <Megaphone
                    className={cn(
                        "h-5 w-5 shrink-0",
                        isActive ? "text-blue-600 fill-blue-600" : "text-neutral-700 dark:text-neutral-200"
                    )}
                    strokeWidth={0.5}
                />
            ),
        },
        {
            label: "Agentes",
            href: "/app/agents",
            icon: ({ isActive }: { isActive: boolean }) => (
                <Bot
                    className={cn(
                        "h-5 w-5 shrink-0",
                        isActive ? "text-blue-600 fill-blue-600" : "text-neutral-700 dark:text-neutral-200"
                    )}
                    strokeWidth={0.5}
                />
            ),
        },
        {
            label: "Faturamento",
            href: "/app/billing",
            icon: ({ isActive }: { isActive: boolean }) => (
                <CreditCard
                    className={cn(
                        "h-5 w-5 shrink-0",
                        isActive ? "text-blue-600 fill-blue-600" : "text-neutral-700 dark:text-neutral-200"
                    )}
                    strokeWidth={0.5}
                />
            ),
        },
        {
            label: "Webhooks",
            href: "/app/settings/webhooks",
            icon: ({ isActive }: { isActive: boolean }) => (
                <Webhook
                    className={cn(
                        "h-5 w-5 shrink-0",
                        isActive ? "text-blue-600 fill-blue-600" : "text-neutral-700 dark:text-neutral-200"
                    )}
                    strokeWidth={0.5}
                />
            ),
        },
        // Add more links as needed
    ];

    if ((user as any)?.is_super_admin) {
        links.push({
            label: "Admin Panel",
            href: "/app/admin",
            icon: ({ isActive }: { isActive: boolean }) => (
                <Shield
                    className={cn(
                        "h-5 w-5 shrink-0",
                        isActive ? "text-red-600 fill-red-600" : "text-neutral-700 dark:text-neutral-200"
                    )}
                    strokeWidth={0.5}
                />
            ),
        });
    }

    const handleLogout = () => {
        signOut();
    };

    return (
        <Sidebar open={open} setOpen={setOpen}>
            <SidebarBody className="justify-between gap-10">
                <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
                    {open ? <Logo /> : <LogoIcon />}
                    <div className="mt-8 flex flex-col gap-2">
                        {links.map((link, idx) => (
                            <SidebarLink key={idx} link={link} />
                        ))}
                    </div>
                </div>
                <div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <div className="cursor-pointer">
                                <SidebarLink
                                    link={{
                                        label: user?.user_metadata?.full_name || user?.email || "Usuário",
                                        href: "#",
                                        icon: (
                                            <div className="h-7 w-7 shrink-0 rounded-full bg-gray-200 overflow-hidden">
                                                {user?.user_metadata?.avatar_url ? (
                                                    <Image
                                                        src={user.user_metadata.avatar_url}
                                                        className="h-full w-full object-cover"
                                                        width={50}
                                                        height={50}
                                                        alt="Avatar"
                                                    />
                                                ) : (
                                                    <div className="h-full w-full flex items-center justify-center text-xs font-bold text-gray-500">
                                                        {(user?.email || "U").charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                            </div>
                                        ),
                                    }}
                                />
                            </div>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            className="w-56"
                            side="right"
                            align="end"
                            sideOffset={10}
                        >
                            <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                                <Settings className="mr-2 h-4 w-4" />
                                <span>Configurações</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={handleLogout}>
                                <LogOut className="mr-2 h-4 w-4" />
                                <span>Sair</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </SidebarBody>
        </Sidebar>
    );
}

export const Logo = () => {
    return (
        <Link
            href="#"
            className="font-normal flex space-x-2 items-center text-sm text-black py-1 relative z-20"
        >
            <div className="h-6 w-6 relative flex-shrink-0">
                <Image
                    src="/assets/brand/axis-logo-court.svg"
                    alt="Axis Logo"
                    fill
                    className="object-contain"
                />
            </div>
            <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="font-medium text-black dark:text-white whitespace-pre"
            >
            </motion.span>
        </Link>
    );
};

export const LogoIcon = () => {
    return (
        <Link
            href="#"
            className="font-normal flex space-x-2 items-center text-sm text-black py-1 relative z-20"
        >
            <div className="h-6 w-6 relative flex-shrink-0">
                <Image
                    src="/assets/brand/axis-logo-court.svg"
                    alt="Axis Logo"
                    fill
                    className="object-contain"
                />
            </div>
        </Link>
    );
};
