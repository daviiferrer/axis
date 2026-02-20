'use client'

import { Campaign, campaignService, CampaignSettings } from "@/services/campaign"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/overlay/dropdown-menu"
import { MoreVertical, Play, Pause, Trash2, GitFork, PhoneOutgoing, ArrowDownLeft, Clock, Settings, Moon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useMemo, useEffect } from "react"
import { toast } from "sonner"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { CampaignSettingsPanel } from "./campaign-settings-panel"

interface CampaignCardProps {
    campaign: Campaign
    onUpdate?: () => void
    index?: number
}

/**
 * Checks if the current time is within configured business hours (client-side mirror of backend logic).
 */
function isWithinBusinessHours(bh: CampaignSettings['businessHours']): boolean {
    if (!bh || !bh.enabled) return true; // If disabled, always "active" (24/7)

    try {
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: bh.timezone || 'America/Sao_Paulo',
            hour: 'numeric',
            weekday: 'short',
            hour12: false,
        });
        const parts = formatter.formatToParts(new Date());
        const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0');
        const weekdayStr = parts.find(p => p.type === 'weekday')?.value || '';
        const dayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
        const dayNum = dayMap[weekdayStr] ?? new Date().getDay();

        const isWorkDay = (bh.workDays || [1, 2, 3, 4, 5]).includes(dayNum);
        const isWorkingHour = hour >= (bh.start ?? 8) && hour < (bh.end ?? 20);
        return isWorkDay && isWorkingHour;
    } catch {
        return true; // Fallback: assume within hours
    }
}

export function CampaignCard({ campaign, onUpdate, index = 0 }: CampaignCardProps) {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [showSettings, setShowSettings] = useState(false)
    const [currentTime, setCurrentTime] = useState(Date.now())

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(Date.now()), 60000)
        return () => clearInterval(timer)
    }, [])

    const handleStatusToggle = async (e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            setIsLoading(true)
            const newStatus = campaign.status === 'active' ? 'paused' : 'active'
            await campaignService.updateStatus(campaign.id, newStatus)
            toast.success(`Campanha ${newStatus === 'active' ? 'iniciada' : 'pausada'} com sucesso`)
            onUpdate?.()
        } catch (error) {
            toast.error("Erro ao atualizar status")
        } finally {
            setIsLoading(false)
        }
    }

    const handleDelete = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm("Tem certeza que deseja excluir esta campanha?")) return
        try {
            setIsLoading(true)
            await campaignService.deleteCampaign(campaign.id)
            toast.success("Campanha excluída")
            onUpdate?.()
        } catch (error) {
            toast.error("Erro ao excluir campanha")
        } finally {
            setIsLoading(false)
        }
    }

    const isActive = campaign.status === 'active';
    const hasBH = !!campaign.settings?.businessHours;
    const withinHours = useMemo(() => {
        if (!hasBH) return true;
        return isWithinBusinessHours(campaign.settings!.businessHours);
    }, [campaign.settings, hasBH, currentTime]);

    // Real operating status: active AND within business hours
    const isOperating = isActive && withinHours;
    const isOutsideHours = isActive && !withinHours && hasBH && campaign.settings!.businessHours.enabled;


    return (
        <>
            <motion.div
                layoutId={`campaign-card-${campaign.id}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                    "group relative overflow-hidden rounded-2xl border bg-white transition-all duration-300 h-full flex flex-col",
                    isOperating
                        ? "border-green-200 shadow-sm hover:shadow-lg hover:border-green-300"
                        : isOutsideHours
                            ? "border-amber-200 shadow-sm hover:shadow-md hover:border-amber-300"
                            : "border-gray-200 shadow-sm hover:shadow-md hover:border-blue-200"
                )}
                onClick={() => router.push(`/app/campaigns/${campaign.id}/flow`)}
            >
                <div className="p-5 flex flex-col h-full cursor-pointer relative z-10">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-3">
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                                <span className={cn(
                                    "flex h-2 w-2 rounded-full",
                                    isOperating
                                        ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"
                                        : isOutsideHours
                                            ? "bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.4)]"
                                            : "bg-gray-300"
                                )} />
                                {/* Outside hours badge */}
                                {isOutsideHours && (
                                    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 text-[10px] font-bold uppercase tracking-wider">
                                        <Moon size={10} />
                                        Fora do horário
                                    </div>
                                )}
                            </div>
                            <h3 className="font-bold text-gray-900 text-lg leading-tight group-hover:text-blue-600 transition-colors line-clamp-1">
                                {campaign.name}
                            </h3>
                        </div>

                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-gray-400 hover:text-gray-900 rounded-full hover:bg-gray-100"
                                onClick={handleStatusToggle}
                                title={isActive ? "Pausar" : "Iniciar"}
                            >
                                {isActive ? <Pause size={16} /> : <Play size={16} />}
                            </Button>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-900 rounded-full hover:bg-gray-100">
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48 rounded-xl">
                                    <DropdownMenuItem onClick={() => router.push(`/app/campaigns/${campaign.id}/flow`)}>
                                        <GitFork className="mr-2 h-4 w-4" /> Editar Fluxo
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={(e) => {
                                        e.stopPropagation();
                                        setShowSettings(true);
                                    }}>
                                        <Settings className="mr-2 h-4 w-4" /> Configurações
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={handleDelete}>
                                        <Trash2 className="mr-2 h-4 w-4" /> Excluir
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-gray-500 line-clamp-2 mb-4 flex-grow leading-relaxed">
                        {campaign.description || "Sem descrição definida."}
                    </p>

                    {/* Business Hours Schedule */}
                    {campaign.settings?.businessHours && (
                        <div className={cn(
                            "flex items-center gap-2 mb-4 px-3 py-2 rounded-lg",
                            isOutsideHours ? "bg-amber-50" : "bg-gray-50"
                        )}>
                            <Clock size={13} className={cn(
                                isOutsideHours ? "text-amber-500" :
                                    campaign.settings.businessHours.enabled ? "text-blue-500" : "text-gray-400"
                            )} />
                            {campaign.settings.businessHours.enabled ? (
                                <span className="text-xs text-gray-600">
                                    <span className={cn(
                                        "font-semibold",
                                        isOutsideHours ? "text-amber-700" : "text-gray-800"
                                    )}>
                                        {String(campaign.settings.businessHours.start).padStart(2, '0')}h - {String(campaign.settings.businessHours.end).padStart(2, '0')}h
                                    </span>
                                    {' · '}
                                    {[{ v: 1, l: 'Seg' }, { v: 2, l: 'Ter' }, { v: 3, l: 'Qua' }, { v: 4, l: 'Qui' }, { v: 5, l: 'Sex' }, { v: 6, l: 'Sáb' }, { v: 0, l: 'Dom' }]
                                        .filter(d => campaign.settings?.businessHours.workDays.includes(d.v))
                                        .map(d => d.l).join(', ')}
                                </span>
                            ) : (
                                <span className="text-xs text-gray-500">Funciona 24/7</span>
                            )}
                        </div>
                    )}

                    {/* Main Stats */}
                    <div className="flex items-center gap-4 pt-4 border-t border-gray-50 mt-auto">
                        {(campaign.stats?.revenue || 0) > 0 ? (
                            <div className="flex flex-col">
                                <span className="text-xs text-green-600/70 font-medium">Receita</span>
                                <span className="text-lg font-bold text-green-600">
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(campaign.stats?.revenue || 0)}
                                </span>
                            </div>
                        ) : (
                            <div className="flex flex-col">
                                <span className="text-xs text-gray-400 font-medium">Leads</span>
                                <span className="text-lg font-bold text-gray-900">{campaign.stats?.total || 0}</span>
                            </div>
                        )}

                        <div className="flex flex-col">
                            <span className="text-xs text-gray-400 font-medium">Custo AI</span>
                            <span className="text-lg font-bold text-gray-900">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(campaign.stats?.ai_cost || 0)}
                            </span>
                        </div>

                        {(campaign.stats?.roi || 0) !== 0 ? (
                            <div className="flex flex-col">
                                <span className="text-xs text-purple-600/70 font-medium">ROI</span>
                                <span className="text-lg font-bold text-purple-600">{campaign.stats?.roi}%</span>
                            </div>
                        ) : (
                            <div className="flex flex-col">
                                <span className="text-xs text-gray-400 font-medium">Respostas</span>
                                <span className="text-lg font-bold text-gray-900">{campaign.stats?.responded || 0}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Hover Overlay */}
                <div className="absolute inset-0 z-0 bg-gray-50/50 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </motion.div>

            {/* Settings Panel */}
            <CampaignSettingsPanel
                campaignId={campaign.id}
                open={showSettings}
                onClose={() => {
                    setShowSettings(false);
                    onUpdate?.();
                }}
            />
        </>
    )
}
