"use client";
import React, { useState, useEffect } from "react";
// forcing rebuild for sidebar update
import { Sidebar, SidebarBody, SidebarLink, useSidebar } from "@/components/ui/sidebar";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
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
import { LogOut, Settings, MessageSquare, Smartphone, Megaphone, Bot, CreditCard, Webhook, Shield, Calendar, ChevronsUpDown, Kanban as KanbanIcon, Users } from "lucide-react";

export function AppSidebar() {
    const { user, signOut } = useAuth();
    const [open, setOpen] = useState(false);
    const [isProfileListOpen, setIsProfileListOpen] = useState(false);
    const isDropdownOpenRef = React.useRef(false);

    const handleSetOpen = (val: boolean | ((prevState: boolean) => boolean)) => {
        if (typeof val === 'function') {
            setOpen((prev) => {
                const requestedState = val(prev);
                if (!requestedState && isDropdownOpenRef.current) {
                    return true;
                }
                return requestedState;
            });
        } else {
            if (!val && isDropdownOpenRef.current) {
                return;
            }
            setOpen(val);
        }
    };

    const handleDropdownOpenChange = (isOpen: boolean) => {
        isDropdownOpenRef.current = isOpen;
        if (isOpen) {
            setOpen(true);
        }
    };

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
            label: "Agendamentos",
            href: "/app/scheduling",
            icon: ({ isActive }: { isActive: boolean }) => (
                <Calendar
                    className={cn(
                        "h-5 w-5 shrink-0",
                        isActive ? "text-blue-600 fill-blue-600" : "text-neutral-700 dark:text-neutral-200"
                    )}
                    strokeWidth={0.5}
                />
            ),
        },
        {
            label: "Gestão (CRM)",
            href: "/app/leads", // Corrected path
            icon: ({ isActive }: { isActive: boolean }) => (
                <Users
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
            label: "Configurações",
            href: "/app/settings/profile",
            icon: ({ isActive }: { isActive: boolean }) => (
                <Settings
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

    if ((user as any)?.role === 'admin') {
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
        <Sidebar open={open} setOpen={handleSetOpen}>
            <SidebarBody className="justify-between gap-10">
                <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    <SidebarLogo open={open} setOpen={setOpen as any} />
                    <div className="mt-8 flex flex-col gap-2">
                        {links.map((link, idx) => (
                            <SidebarLink key={idx} link={link} />
                        ))}
                    </div>
                </div>
                <div className="flex flex-col gap-2">

                    {/* User Profile - Inline Collapsible */}
                    <div className="flex flex-col gap-1">
                        <div
                            className="cursor-pointer relative group"
                            onClick={() => {
                                if (!open) {
                                    setOpen(true);
                                    setIsProfileListOpen(true);
                                } else {
                                    setIsProfileListOpen(!isProfileListOpen);
                                }
                            }}
                        >
                            <SidebarLink
                                link={{
                                    label: user?.user_metadata?.full_name || user?.email || "Usuário",
                                    href: "#",
                                    icon: (
                                        <div className="h-7 w-7 shrink-0 rounded-full bg-gray-200 overflow-hidden relative">
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
                            {open && (
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-500">
                                    <ChevronsUpDown className="h-3 w-3" />
                                </div>
                            )}
                        </div>

                        {/* Collapsible List */}
                        <AnimatePresence>
                            {isProfileListOpen && open && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="overflow-hidden pl-2"
                                >
                                    <div className="flex flex-col gap-1 border-l-2 border-neutral-200 dark:border-neutral-700 ml-3 pl-3 py-2">
                                        <div className="text-xs font-semibold text-neutral-500 mb-2 px-2 uppercase tracking-wider">
                                            Minha Conta
                                        </div>

                                        <div
                                            onClick={() => {
                                                handleLogout();
                                                setIsProfileListOpen(false);
                                            }}
                                            className="flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/10 text-red-600 transition-colors text-sm"
                                        >
                                            <LogOut className="h-4 w-4" />
                                            <span>Sair</span>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </SidebarBody>
        </Sidebar>
    );
}

export const SidebarLogo = ({ open, setOpen }: { open: boolean; setOpen: React.Dispatch<React.SetStateAction<boolean>> }) => {
    return (
        <Link
            href="#"
            className="font-normal flex space-x-2 items-center text-sm text-black py-1 relative z-20"
            onClick={() => setOpen(!open)}
        >
            <motion.div
                initial={false}
                animate={{
                    width: open ? "8rem" : "1.6rem",
                }}
                transition={{
                    duration: 0.2,
                    ease: "easeInOut",
                }}
                className="h-6 relative overflow-hidden flex-shrink-0"
            >
                <div className="absolute top-0 left-0 h-full w-32">
                    <Image
                        src="/assets/brand/logo.svg"
                        alt="Axis Logo"
                        fill
                        className="object-contain object-left"
                        priority
                    />
                </div>
            </motion.div>
        </Link>
    );
};
