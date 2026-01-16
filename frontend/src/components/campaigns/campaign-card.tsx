'use client'

import { Campaign, campaignService } from "@/services/campaign"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
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
import { MoreVertical, Play, Pause, Edit, Trash2, GitFork, Activity } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"

// Verify sonner import. Step 11 listed sonner.
// Assuming standard usage.

interface CampaignCardProps {
    campaign: Campaign
    onUpdate?: () => void
}

export function CampaignCard({ campaign, onUpdate }: CampaignCardProps) {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)

    const handleStatusToggle = async () => {
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

    const handleDelete = async () => {
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

    const statusColors = {
        draft: "bg-gray-100 text-gray-800",
        active: "bg-green-100 text-green-800",
        paused: "bg-yellow-100 text-yellow-800",
        archived: "bg-red-100 text-red-800",
    }

    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div className="space-y-1">
                    <CardTitle className="text-lg font-semibold">{campaign.name}</CardTitle>
                    <CardDescription className="line-clamp-1">
                        {campaign.description || "Sem descrição"}
                    </CardDescription>
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Menu</span>
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => router.push(`/app/campaigns/${campaign.id}/flow`)}>
                            <GitFork className="mr-2 h-4 w-4" />
                            Editar Fluxo
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleStatusToggle}>
                            {campaign.status === 'active' ? (
                                <><Pause className="mr-2 h-4 w-4" /> Pausar</>
                            ) : (
                                <><Play className="mr-2 h-4 w-4" /> Iniciar</>
                            )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600" onClick={handleDelete}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </CardHeader>
            <CardContent>
                <div className="flex items-center gap-2 mb-4">
                    <Badge variant="secondary" className={statusColors[campaign.status]}>
                        {campaign.status.toUpperCase()}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                        Sessão: {campaign.session_id ? 'Conectada' : 'Nenhuma'}
                    </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-sm">
                    <div className="bg-gray-50 p-2 rounded">
                        <div className="font-bold text-gray-900">{campaign.stats?.sent || 0}</div>
                        <div className="text-xs text-gray-500">Enviados</div>
                    </div>
                    <div className="bg-gray-50 p-2 rounded">
                        <div className="font-bold text-blue-600">{campaign.stats?.responded || 0}</div>
                        <div className="text-xs text-gray-500">Respostas</div>
                    </div>
                    <div className="bg-gray-50 p-2 rounded">
                        <div className="font-bold text-green-600">{campaign.stats?.converted || 0}</div>
                        <div className="text-xs text-gray-500">Conv.</div>
                    </div>
                </div>
            </CardContent>
            <CardFooter className="pt-2">
                <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => router.push(`/app/campaigns/${campaign.id}/flow`)}
                >
                    <GitFork className="mr-2 h-4 w-4" />
                    Abrir Construtor
                </Button>
            </CardFooter>
        </Card>
    )
}
