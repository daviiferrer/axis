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
import { MoreVertical, Play, Pause, Edit, Trash2, GitFork, Activity, MessageSquare, Users, TrendingUp } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { motion } from "framer-motion"

interface CampaignCardProps {
    campaign: Campaign
    onUpdate?: () => void
    index?: number
}

export function CampaignCard({ campaign, onUpdate, index = 0 }: CampaignCardProps) {
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

    // Verify connection status by inspecting the graph for configured Trigger Nodes
    const isConnected = (campaign.graph?.nodes || []).some((n: any) => n.type === 'trigger' && n.data?.sessionName);

    return (
        <motion.div
            layoutId={`campaign-card-${campaign.id}`}
            initial={false}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
            className={`
                group relative overflow-hidden rounded-3xl border transition-all duration-300 backdrop-blur-sm
                ${isActive
                    ? 'border-green-500/30 bg-white/60 hover:shadow-xl hover:shadow-green-500/10'
                    : 'border-gray-200 bg-white/40 hover:shadow-xl hover:shadow-gray-200/50'
                }
            `}
            onClick={() => router.push(`/app/campaigns/${campaign.id}/flow`)}
        >
            {/* Status Strip */}
            <div className={`absolute top-0 left-0 right-0 h-1.5 ${isActive ? 'bg-gradient-to-r from-green-400 to-emerald-500' : isPaused ? 'bg-yellow-400' : 'bg-gray-200'}`} />

            <div className="p-5 flex flex-col h-full cursor-pointer">
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            {isActive && (
                                <span className="relative flex h-2.5 w-2.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                                </span>
                            )}
                            <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">{campaign.name}</h3>
                        </div>
                        <p className="text-xs text-gray-500 font-medium">{campaign.type === 'outbound' ? 'PROSPECÇÃO ATIVA' : 'INBOUND RECEPTIVO'}</p>
                    </div>

                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-400 hover:text-gray-900"
                            onClick={handleStatusToggle}
                        >
                            {isActive ? <Pause size={16} /> : <Play size={16} />}
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-900">
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 rounded-xl">
                                <DropdownMenuLabel>Ações da Campanha</DropdownMenuLabel>
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

                {/* Description */}
                <p className="text-sm text-gray-600 line-clamp-2 mb-6 flex-grow">
                    {campaign.description || "Sem descrição. Adicione detalhes para organizar suas campanhas."}
                </p>

                {/* Stats Grid - Glass Effect */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="bg-white/50 rounded-xl p-2.5 text-center border border-gray-100/50 group-hover:border-blue-100/50 transition-colors">
                        <Users size={14} className="mx-auto text-gray-400 mb-1" />
                        <div className="font-bold text-gray-900 text-lg leading-none">{campaign.stats?.sent || 0}</div>
                        <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mt-0.5">Leads</div>
                    </div>
                    <div className="bg-white/50 rounded-xl p-2.5 text-center border border-gray-100/50 group-hover:border-blue-100/50 transition-colors">
                        <MessageSquare size={14} className="mx-auto text-blue-400 mb-1" />
                        <div className="font-bold text-blue-600 text-lg leading-none">{campaign.stats?.responded || 0}</div>
                        <div className="text-[10px] uppercase font-bold text-blue-400/70 tracking-wider mt-0.5">Ativos</div>
                    </div>
                    <div className="bg-white/50 rounded-xl p-2.5 text-center border border-gray-100/50 group-hover:border-green-100/50 transition-colors">
                        <TrendingUp size={14} className="mx-auto text-green-500 mb-1" />
                        <div className="font-bold text-green-600 text-lg leading-none">{campaign.stats?.converted || 0}</div>
                        <div className="text-[10px] uppercase font-bold text-green-500/70 tracking-wider mt-0.5">Vendas</div>
                    </div>
                </div>

                {/* Footer / Connect Status */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-50 text-xs mt-auto">
                    <span className={`
                        flex items-center gap-1.5 px-2 py-1 rounded-full font-medium
                        ${isConnected ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}
                    `}>
                        <Activity size={10} />
                        {isConnected ? 'Conectado' : 'Desconectado'}
                    </span>
                    <span className="text-gray-400 font-mono text-[10px]">{new Date(campaign.updated_at).toLocaleDateString()}</span>
                </div>
            </div>

            {/* Hover Gradient Shine */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/30 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 pointer-events-none" />
        </motion.div>
    )
}
