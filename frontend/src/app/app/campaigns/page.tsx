'use client'

import { useState } from "react"
import useSWR from "swr"
import { campaignService, Campaign } from "@/services/campaign"
import { CampaignCard } from "@/components/campaigns/campaign-card"
import { CampaignListItem } from "@/components/campaigns/campaign-list-item"
import { CampaignCreateDialog } from "@/components/campaigns/campaign-create-dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { Search, Filter, LayoutGrid, List as ListIcon, Plus } from "lucide-react"
import { Input } from "@/components/ui/input"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/forms/select"
import { cn } from "@/lib/utils"

export default function CampaignsPage() {
    const [search, setSearch] = useState("")
    const [filterStatus, setFilterStatus] = useState<string>('all') // all | active | paused | draft
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
    const [sortBy, setSortBy] = useState<string>('newest')

    // Use SWR for campaigns - leverages prefetched data
    const { data: campaigns = [], isLoading, mutate } = useSWR(
        'campaigns',
        () => campaignService.listCampaigns(),
        {
            revalidateOnFocus: false,
            keepPreviousData: true,
        }
    )

    const refreshCampaigns = () => mutate()

    // --- Filtering & Sorting ---
    const filteredCampaigns = campaigns.filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
            c.description?.toLowerCase().includes(search.toLowerCase());
        const matchesFilter = filterStatus === 'all' || c.status === filterStatus;
        return matchesSearch && matchesFilter;
    }).sort((a, b) => {
        if (sortBy === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        if (sortBy === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        return 0;
    });

    const activeCount = campaigns.filter(c => c.status === 'active').length;

    return (
        <div className="min-h-full font-inter bg-gray-50/30 p-6 md:p-10 space-y-8">
            {/* 1. Simplified Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Minhas Campanhas</h1>
                    <p className="text-gray-500">
                        Gerencie seus fluxos de atendimento e prospecção.
                        {activeCount > 0 && <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">{activeCount} Ativas</span>}
                    </p>
                </div>
                <CampaignCreateDialog onSuccess={refreshCampaigns} />
            </div>

            {/* 2. Functional Toolbar */}
            <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-3 flex flex-col lg:flex-row items-center justify-between gap-4 sticky top-4 z-30">

                {/* Left: Filters */}
                <div className="flex items-center gap-4 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0 hide-scrollbar">
                    <div className="flex p-1 bg-gray-100 rounded-lg shrink-0">
                        {['all', 'active', 'paused'].map((status) => (
                            <button
                                key={status}
                                onClick={() => setFilterStatus(status)}
                                className={cn(
                                    "px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                                    filterStatus === status
                                        ? "bg-white text-gray-900 shadow-sm"
                                        : "text-gray-500 hover:text-gray-900 hover:bg-gray-200/50"
                                )}
                            >
                                {status === 'all' && 'Todas'}
                                {status === 'active' && 'Ativas'}
                                {status === 'paused' && 'Pausadas'}
                            </button>
                        ))}
                    </div>

                    <div className="h-4 w-px bg-gray-200 hidden lg:block" />

                    {/* Search */}
                    <div className="relative w-full lg:w-64 shrink-0">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            type="search"
                            placeholder="Buscar campanha..."
                            className="pl-9 h-9 bg-gray-50 border-gray-200 focus:bg-white transition-all rounded-lg text-sm"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                {/* Right: View & Sort */}
                <div className="flex items-center gap-3 w-full lg:w-auto justify-end">
                    <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger className="w-[140px] h-9 text-xs">
                            <SelectValue placeholder="Ordenar por" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="newest">Mais recentes</SelectItem>
                            <SelectItem value="oldest">Mais antigas</SelectItem>
                            <SelectItem value="name">Nome (A-Z)</SelectItem>
                        </SelectContent>
                    </Select>

                    <div className="flex items-center p-1 bg-gray-100 rounded-lg border border-gray-200/50">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={cn(
                                "p-1.5 rounded-md transition-all",
                                viewMode === 'grid' ? "bg-white shadow-sm text-gray-900" : "text-gray-400 hover:text-gray-600"
                            )}
                        >
                            <LayoutGrid size={16} />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={cn(
                                "p-1.5 rounded-md transition-all",
                                viewMode === 'list' ? "bg-white shadow-sm text-gray-900" : "text-gray-400 hover:text-gray-600"
                            )}
                        >
                            <ListIcon size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* 3. Campaign Content */}
            <div className="min-h-[400px]">
                {isLoading ? (
                    <div className={cn(
                        "gap-6",
                        viewMode === 'grid'
                            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                            : "flex flex-col space-y-4"
                    )}>
                        {[1, 2, 3, 4].map((i) => (
                            <Skeleton key={i} className={viewMode === 'grid' ? "h-[200px] w-full rounded-2xl" : "h-20 w-full rounded-xl"} />
                        ))}
                    </div>
                ) : filteredCampaigns.length === 0 ? (
                    <EmptyState search={search} onClear={() => { setSearch(''); setFilterStatus('all'); }} />
                ) : (
                    <AnimatePresence mode='popLayout'>
                        <div className={cn(
                            "pb-20",
                            viewMode === 'grid'
                                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                                : "flex flex-col space-y-3"
                        )}>
                            {filteredCampaigns.map((campaign, index) => (
                                viewMode === 'grid' ? (
                                    <CampaignCard
                                        key={campaign.id}
                                        campaign={campaign}
                                        onUpdate={refreshCampaigns}
                                        index={index}
                                    />
                                ) : (
                                    <motion.div
                                        key={campaign.id}
                                        layout
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        transition={{ delay: index * 0.03 }}
                                    >
                                        <CampaignListItem
                                            campaign={campaign}
                                            onUpdate={refreshCampaigns}
                                        />
                                    </motion.div>
                                )
                            ))}
                        </div>
                    </AnimatePresence>
                )}
            </div>
        </div>
    )
}

function EmptyState({ search, onClear }: { search: string, onClear: () => void }) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center h-[400px] border border-dashed border-gray-200 rounded-3xl bg-gray-50/50 text-center p-8"
        >
            <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                <Search className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {search ? "Nenhum resultado encontrado" : "Nenhuma campanha ainda"}
            </h3>
            <p className="text-gray-500 text-sm max-w-sm mb-6">
                {search
                    ? `Não encontramos nada para "${search}".`
                    : "Crie sua primeira campanha para começar a automatizar."}
            </p>
            {search && (
                <Button onClick={onClear} variant="outline" size="sm">
                    Limpar Filtros
                </Button>
            )}
        </motion.div>
    )
}
