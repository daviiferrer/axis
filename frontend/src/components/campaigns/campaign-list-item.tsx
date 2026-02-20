'use client'

import { Campaign, campaignService } from "@/services/campaign"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/overlay/dropdown-menu"
import { MoreHorizontal, Play, Pause, Edit, Trash2, GitFork, Activity, Calendar, MessageSquare, TrendingUp, Users } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface CampaignListItemProps {
    campaign: Campaign
    onUpdate?: () => void
}

export function CampaignListItem({ campaign, onUpdate }: CampaignListItemProps) {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)

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
    const isPaused = campaign.status === 'paused';
    // Verify connection status
    const isConnected = (campaign.graph?.nodes || []).some((n: any) => n.type === 'trigger' && n.data?.sessionName);

    return (
        <div
            onClick={() => router.push(`/app/campaigns/${campaign.id}/flow`)}
            className="group flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl hover:shadow-md hover:border-blue-200 transition-all cursor-pointer"
        >
            {/* Left: Icon & Info */}
            <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                    isActive ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"
                )}>
                    {isActive ? <Activity size={20} /> : <Pause size={20} />}
                </div>

                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900 truncate">{campaign.name}</h3>
                        {isConnected && (
                            <span className="flex h-2 w-2 rounded-full bg-green-500" title="Conectado" />
                        )}
                    </div>
                    <div className="flex text-xs text-gray-500 mt-0.5">
                        {new Date(campaign.created_at).toLocaleDateString()}
                    </div>
                </div>
            </div>

            {/* Middle: Stats (Hidden on small screens) */}
            <div className="hidden md:flex items-center gap-8 px-8 border-l border-r border-gray-100 mx-4">
                <div className="flex flex-col items-center w-20">
                    <span className="text-lg font-bold text-gray-900">{campaign.stats?.sent || 0}</span>
                    <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Leads</span>
                </div>
                {(campaign.stats?.responded || 0) > 0 && (
                    <div className="flex flex-col items-center w-20">
                        <span className="text-lg font-bold text-blue-600">{campaign.stats?.responded}</span>
                        <span className="text-[10px] text-blue-600/70 font-medium uppercase tracking-wide">Ativos</span>
                    </div>
                )}
                {(campaign.stats?.converted || 0) > 0 && (
                    <div className="flex flex-col items-center w-20">
                        <span className="text-lg font-bold text-green-600">{campaign.stats?.converted}</span>
                        <span className="text-[10px] text-green-600/70 font-medium uppercase tracking-wide">Vendas</span>
                    </div>
                )}
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <Button
                    variant={isActive ? "outline" : "default"}
                    size="sm"
                    className={cn(
                        "h-8 text-xs gap-1.5 min-w-[90px] hidden sm:flex",
                        isActive
                            ? "border-amber-200 text-amber-700 hover:bg-amber-50 hover:text-amber-800"
                            : "bg-green-600 hover:bg-green-700 text-white shadow-sm shadow-green-200"
                    )}
                    onClick={handleStatusToggle}
                >
                    {isActive ? (
                        <><Pause size={12} fill="currentColor" /> Pausar</>
                    ) : (
                        <><Play size={12} fill="currentColor" /> Iniciar</>
                    )}
                </Button>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-900">
                            <MoreHorizontal size={16} />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 rounded-xl">
                        <DropdownMenuItem onClick={() => router.push(`/app/campaigns/${campaign.id}/flow`)}>
                            <GitFork className="mr-2 h-4 w-4" /> Editar Fluxo
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={handleDelete}>
                            <Trash2 className="mr-2 h-4 w-4" /> Excluir
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    )
}
