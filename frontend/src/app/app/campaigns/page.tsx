'use client'

import { useEffect, useState } from "react"
import { campaignService, Campaign } from "@/services/campaign"
import { CampaignCard } from "@/components/campaigns/campaign-card"
import { CampaignCreateDialog } from "@/components/campaigns/campaign-create-dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { Search, Filter, SortAsc, LayoutGrid, List as ListIcon, TrendingUp, Users, MessageCircle, BarChart3 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function CampaignsPage() {
    const [campaigns, setCampaigns] = useState<Campaign[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [search, setSearch] = useState("")
    const [filterStatus, setFilterStatus] = useState<string>('all') // all | active | paused | draft

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

    // --- Computed Metrics (Real-time aggregation) ---
    const totalCampaigns = campaigns.length;
    const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
    const totalLeads = campaigns.reduce((acc, curr) => acc + (curr.stats?.sent || 0), 0);
    const totalConversions = campaigns.reduce((acc, curr) => acc + (curr.stats?.converted || 0), 0);
    const conversionRate = totalLeads > 0 ? Math.round((totalConversions / totalLeads) * 100) : 0;

    // --- Filtering ---
    const filteredCampaigns = campaigns.filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
            c.description?.toLowerCase().includes(search.toLowerCase());
        const matchesFilter = filterStatus === 'all' || c.status === filterStatus;
        return matchesSearch && matchesFilter;
    });

    return (
        <div className="min-h-full font-inter bg-gray-50/50 p-6 md:p-10 space-y-10">
            {/* 1. Header & KPI Section - 'Command Center' Feel */}
            <div className="space-y-8">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 mb-2">Comando de Campanhas</h1>
                        <p className="text-gray-500 text-lg max-w-2xl">
                            Gerencie suas máquinas de vendas. Monitore performance em tempo real.
                        </p>
                    </div>
                    <CampaignCreateDialog onSuccess={loadCampaigns} />
                </div>

                {/* KPI Cards Glassmorphism */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <MetricCard
                        title="Campanhas Ativas"
                        value={activeCampaigns.toString()}
                        subtitle={`De ${totalCampaigns} total`}
                        icon={<RocketIcon className="text-blue-500" />}
                        trend="+2 essa semana"
                        delay={0.1}
                    />
                    <MetricCard
                        title="Leads Impactados"
                        value={totalLeads.toLocaleString()}
                        subtitle="Total acumulado"
                        icon={<Users className="text-indigo-500" />}
                        trend="+12% vs mês anterior"
                        delay={0.2}
                    />
                    <MetricCard
                        title="Taxa de Conversão"
                        value={`${conversionRate}%`}
                        subtitle="Média global"
                        icon={<TrendingUp className="text-green-500" />}
                        trend="Estável"
                        delay={0.3}
                    />
                    <MetricCard
                        title="Vendas Geradas"
                        value={totalConversions.toLocaleString()}
                        subtitle="Fundo de funil"
                        icon={<BarChart3 className="text-amber-500" />}
                        trend="+5% hoje"
                        delay={0.4}
                    />
                </div>
            </div>

            {/* 2. Advanced Toolbar */}
            <div className="sticky top-4 z-30 bg-white/80 backdrop-blur-xl border border-white/20 shadow-lg shadow-gray-200/50 rounded-2xl p-2 flex flex-col md:flex-row items-center justify-between gap-4">

                {/* Visual Tabs */}
                <div className="flex p-1 bg-gray-100/50 rounded-xl space-x-1 w-full md:w-auto overflow-x-auto">
                    {['all', 'active', 'paused', 'draft'].map((status) => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={`
                                relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300
                                ${filterStatus === status
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
                                }
                            `}
                        >
                            {status === 'all' && 'Todas'}
                            {status === 'active' && 'Ativas'}
                            {status === 'paused' && 'Pausadas'}
                            {status === 'draft' && 'Rascunhos'}
                        </button>
                    ))}
                </div>

                {/* Search & Layout Actions */}
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            type="search"
                            placeholder="Buscar..."
                            className="pl-9 bg-gray-50/50 border-transparent focus:bg-white transition-all rounded-xl"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="h-8 w-px bg-gray-200 hidden md:block" />
                    <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-900 rounded-xl">
                        <Filter size={18} />
                    </Button>
                </div>
            </div>

            {/* 3. Campaign Grid with Stagger Animation */}
            <AnimatePresence mode='wait'>
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {[1, 2, 3, 4].map((i) => (
                            <Skeleton key={i} className="h-[280px] w-full rounded-3xl" />
                        ))}
                    </div>
                ) : filteredCampaigns.length === 0 ? (
                    <EmptyState search={search} onClear={() => { setSearch(''); setFilterStatus('all'); }} />
                ) : (
                    <motion.div
                        layout
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20"
                    >
                        {filteredCampaigns.map((campaign, index) => (
                            <CampaignCard
                                key={campaign.id}
                                campaign={campaign}
                                onUpdate={loadCampaigns}
                                index={index} // For stagger effect
                            />
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

// --- Subcomponents for Cleanliness ---

function MetricCard({ title, value, subtitle, icon, trend, delay }: any) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.5 }}
            className="bg-white/60 backdrop-blur-md border border-white/40 shadow-xl shadow-indigo-500/5 rounded-3xl p-6 relative overflow-hidden group hover:bg-white/80 transition-colors"
        >
            <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-gray-50 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                    {icon}
                </div>
                {trend && (
                    <Badge variant="secondary" className="bg-green-100 text-green-700 border-0">
                        {trend}
                    </Badge>
                )}
            </div>
            <div>
                <h3 className="text-3xl font-bold text-gray-900 tracking-tight">{value}</h3>
                <p className="text-gray-500 font-medium text-sm mt-1">{title}</p>
                <p className="text-gray-400 text-xs mt-2">{subtitle}</p>
            </div>
            {/* Background Decor */}
            <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-gradient-to-br from-gray-100 to-transparent rounded-full opacity-50 pointer-events-none" />
        </motion.div>
    )
}

function EmptyState({ search, onClear }: { search: string, onClear: () => void }) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center min-h-[500px] border-2 border-dashed border-gray-200 rounded-3xl bg-gray-50/50 text-center p-8"
        >
            <div className="bg-white p-6 rounded-full shadow-lg shadow-gray-200 mb-6 relative">
                <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-20" />
                <Search className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {search ? "Nenhum resultado encontrado" : "Tudo pronto para começar?"}
            </h3>
            <p className="text-gray-500 max-w-md mb-8 leading-relaxed">
                {search
                    ? `Não encontramos nada para "${search}". Tente outro termo ou limpe os filtros.`
                    : "Sua central de automação está vazia. Crie sua primeira campanha para ver a mágica acontecer."}
            </p>
            {search && (
                <Button onClick={onClear} variant="outline" className="rounded-full px-8">
                    Limpar Filtros
                </Button>
            )}
        </motion.div>
    )
}

function RocketIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" /><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" /><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" /><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" /></svg>
    )
}
