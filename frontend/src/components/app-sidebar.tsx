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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LogOut, Settings, MessageSquare, Smartphone, Megaphone, Bot, CreditCard, Webhook, Shield, Building2, Check, ChevronsUpDown, Plus, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

export function AppSidebar() {
    const [companies, setCompanies] = useState<any[]>([]);
    const [loadingCompanies, setLoadingCompanies] = useState(false);
    const { user, signOut, refreshProfile } = useAuth();
    const [open, setOpen] = useState(false);
    const [isCompanyListOpen, setIsCompanyListOpen] = useState(false);
    const [isProfileListOpen, setIsProfileListOpen] = useState(false);
    const [isCreateCompanyOpen, setIsCreateCompanyOpen] = useState(false);
    const [newCompanyName, setNewCompanyName] = useState("");
    const [isCreatingCompany, setIsCreatingCompany] = useState(false);
    const [createError, setCreateError] = useState<string | null>(null);
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

    useEffect(() => {
        const fetchCompanies = async () => {
            if (!user) return;
            setLoadingCompanies(true);
            try {
                // Fetch companies via memberships to get role and ALL companies (owned + member)
                const { data: memberships, error } = await supabase
                    .from('memberships')
                    .select('role, company:companies(*)')
                    .eq('user_id', user.id);

                if (error) {
                    console.error("Error fetching companies:", error);
                    return;
                }

                if (memberships) {
                    // Map result to flat structure but keep role
                    const mappedCompanies = memberships.map((m: any) => ({
                        ...m.company,
                        role: m.role // Attach role to the company object for local use
                    })).filter((c: any) => c !== null); // Filter out any null companies if join failed

                    setCompanies(mappedCompanies);
                }
            } catch (error) {
                console.error("Error fetching companies:", error);
            } finally {
                setLoadingCompanies(false);
            }
        };

        fetchCompanies();
    }, [user]);

    const handleSwitchCompany = async (companyId: string) => {
        if (!user) return;
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ company_id: companyId })
                .eq('id', user.id);

            if (error) throw error;

            await refreshProfile();
            // Optional: window.location.reload() if deep context switch is needed immediately vs reactive
        } catch (error) {
            console.error("Error switching company:", error);
        }
    };

    const handleCreateCompany = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCompanyName.trim() || !user) return;

        setIsCreatingCompany(true);
        try {
            // 1. Create company
            const slug = newCompanyName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            const { data: company, error: companyError } = await supabase
                .from('companies')
                .insert({
                    name: newCompanyName,
                    slug: slug,
                    owner_id: user.id,
                    subscription_plan: 'free',
                    settings: {}
                })
                .select()
                .single();

            if (companyError) throw companyError;

            // 2. Create Membership (Owner)
            const { error: memberError } = await supabase
                .from('memberships')
                .insert({
                    user_id: user.id,
                    company_id: company.id,
                    role: 'owner',
                    status: 'active'
                });

            if (memberError) throw memberError;

            // 3. Switch to new company
            await handleSwitchCompany(company.id);
            setNewCompanyName("");
            setIsCreateCompanyOpen(false);

        } catch (error: any) {
            console.error("Error creating company:", error);
            // toast.error("Erro ao criar empresa");
        } finally {
            setIsCreatingCompany(false);
        }
    };

    const currentCompany = companies.find(c => c.id === (user as any)?.company_id) || companies[0];

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
                    {/* Company Switcher - Inline Collapsible */}
                    <div className="flex flex-col gap-1">
                        <div
                            className="cursor-pointer relative group"
                            onClick={() => {
                                if (!open) {
                                    setOpen(true);
                                    setIsCompanyListOpen(true);
                                } else {
                                    setIsCompanyListOpen(!isCompanyListOpen);
                                }
                            }}
                        >
                            <SidebarLink
                                link={{
                                    label: currentCompany?.name || "Minha Empresa",
                                    href: "#",
                                    icon: (
                                        <div className="h-7 w-7 shrink-0 rounded-md bg-blue-600 flex items-center justify-center text-white relative">
                                            {currentCompany?.logo_url ? (
                                                <Image
                                                    src={currentCompany.logo_url}
                                                    className="h-full w-full object-cover rounded-md"
                                                    width={50}
                                                    height={50}
                                                    alt="Company Logo"
                                                />
                                            ) : (
                                                <Building2 className="h-4 w-4" />
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
                            {isCompanyListOpen && open && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="overflow-hidden pl-2"
                                >
                                    <div className="flex flex-col gap-1 border-l-2 border-neutral-200 dark:border-neutral-700 ml-3 pl-3 py-2">
                                        <div className="text-xs font-semibold text-neutral-500 mb-2 px-2 uppercase tracking-wider">
                                            Alternar Empresa
                                        </div>
                                        {companies.map((company) => (
                                            <div
                                                key={company.id}
                                                onClick={() => {
                                                    handleSwitchCompany(company.id);
                                                    setIsCompanyListOpen(false);
                                                }}
                                                className={cn(
                                                    "flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-sm",
                                                    (user as any)?.company_id === company.id && "bg-neutral-100 dark:bg-neutral-800 font-medium"
                                                )}
                                            >
                                                <div className="h-8 w-8 rounded-sm bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold shrink-0">
                                                    {company.name.substring(0, 2).toUpperCase()}
                                                </div>
                                                <div className="flex flex-col overflow-hidden">
                                                    <span className="truncate text-neutral-700 dark:text-neutral-200 leading-tight">
                                                        {company.name}
                                                    </span>
                                                    <span className="text-[10px] text-neutral-400 font-medium capitalize truncate">
                                                        {company.role === 'owner' ? 'Proprietário' : 'Colaborador'}
                                                    </span>
                                                </div>
                                                {(user as any)?.company_id === company.id && (
                                                    <Check className="h-3 w-3 text-blue-600 ml-auto" />
                                                )}
                                            </div>
                                        ))}

                                        <div
                                            onClick={() => setIsCreateCompanyOpen(true)}
                                            className="flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-sm mt-1 text-blue-600"
                                        >
                                            <div className="h-8 w-8 rounded-sm border border-dashed border-blue-300 flex items-center justify-center text-blue-500 shrink-0">
                                                <Plus className="h-4 w-4" />
                                            </div>
                                            <span className="font-medium">Criar nova empresa</span>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <Dialog open={isCreateCompanyOpen} onOpenChange={setIsCreateCompanyOpen}>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>Criar Nova Empresa</DialogTitle>
                                <DialogDescription>
                                    Dê um nome para sua nova organização. Você será o proprietário.
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleCreateCompany} className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    {/* <Label htmlFor="name">Nome da Empresa</Label> */}
                                    <Input
                                        id="name"
                                        placeholder="Ex: Minha Agência"
                                        value={newCompanyName}
                                        onChange={(e: any) => setNewCompanyName(e.target.value)}
                                        className="col-span-3"
                                        autoFocus
                                    />
                                </div>
                                <DialogFooter>
                                    <Button type="button" variant="outline" onClick={() => setIsCreateCompanyOpen(false)}>
                                        Cancelar
                                    </Button>
                                    <Button type="submit" disabled={isCreatingCompany || !newCompanyName.trim()}>
                                        {isCreatingCompany && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Criar Empresa
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>

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
                                        <Link
                                            href="/app/settings/profile"
                                            className="flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-sm text-neutral-700 dark:text-neutral-200"
                                            onClick={() => setIsProfileListOpen(false)}
                                        >
                                            <Settings className="h-4 w-4" />
                                            <span>Configurações</span>
                                        </Link>
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
