'use client'

import { useEffect, useState } from "react"
import { campaignService, Campaign } from "@/services/campaign"
import { CampaignCard } from "@/components/campaigns/campaign-card"
import { CampaignCreateDialog } from "@/components/campaigns/campaign-create-dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"

export default function CampaignsPage() {
    const [campaigns, setCampaigns] = useState<Campaign[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [search, setSearch] = useState("")

    const loadCampaigns = async () => {
        try {
            setIsLoading(true)
            const data = await campaignService.listCampaigns()
            setCampaigns(data)
        } catch (error) {
            console.error("Failed to load campaigns", error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        loadCampaigns()
    }, [])

    const filteredCampaigns = campaigns.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.description?.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="h-full flex flex-col font-inter bg-gray-50/50 p-8 space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">Gerenciador de Campanhas</h1>
                    <p className="text-muted-foreground">Crie e gerencie seus fluxos de automação do WhatsApp.</p>
                </div>
                <CampaignCreateDialog onSuccess={loadCampaigns} />
            </div>

            {/* Filters */}
            <div className="flex items-center space-x-2">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Buscar campanhas..."
                        className="pl-8 bg-white"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Grid */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="space-y-4 border rounded-xl p-4 bg-white">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-20 w-full" />
                            <div className="flex justify-between">
                                <Skeleton className="h-8 w-20" />
                                <Skeleton className="h-8 w-8 rounded-full" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : filteredCampaigns.length === 0 ? (
                <div className="flex flex-col items-center justify-center min-h-[400px] border-2 border-dashed rounded-xl bg-white p-8 text-center animate-in fade-in zoom-in duration-500">
                    <div className="bg-blue-50 p-4 rounded-full mb-4">
                        <Search className="h-8 w-8 text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-lg text-gray-900">Nenhuma campanha encontrada</h3>
                    <p className="text-muted-foreground max-w-sm my-2">
                        {search ? "Tente buscar com outros termos." : "Crie sua primeira campanha para começar a automatizar."}
                    </p>
                    {!search && <CampaignCreateDialog onSuccess={loadCampaigns} />}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {filteredCampaigns.map((campaign) => (
                        <CampaignCard
                            key={campaign.id}
                            campaign={campaign}
                            onUpdate={loadCampaigns}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
