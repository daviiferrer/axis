'use client'

import { useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { Search, Bot, Plus } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

// Type definition (move to service later)
export interface Agent {
    id: string
    name: string
    description: string
    status: 'active' | 'inactive' | 'draft'
    type: 'chat_flow' | 'autonomous'
    updatedAt: string
}

// Mock data
const MOCK_AGENTS: Agent[] = [
    {
        id: '1',
        name: 'Atendente Nível 1',
        description: 'Triagem inicial de clientes e respostas frequentes.',
        status: 'active',
        type: 'chat_flow',
        updatedAt: '2024-03-10T10:00:00Z'
    },
    {
        id: '2',
        name: 'Agente de Vendas',
        description: 'Fluxo focado em conversão e agendamento de reuniões.',
        status: 'draft',
        type: 'autonomous',
        updatedAt: '2024-03-12T15:30:00Z'
    }
]

export default function AgentsPage() {
    const [agents, setAgents] = useState<Agent[]>(MOCK_AGENTS)
    const [isLoading, setIsLoading] = useState(false)
    const [search, setSearch] = useState("")

    const filteredAgents = agents.filter(a =>
        a.name.toLowerCase().includes(search.toLowerCase()) ||
        a.description.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="h-full flex flex-col font-inter bg-gray-50/50 p-8 space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">Meus Agentes</h1>
                    <p className="text-muted-foreground">Gerencie seus fluxos conversacionais e agentes autônomos.</p>
                </div>
                <Button asChild>
                    <Link href="/app/agents/new">
                        <Plus className="mr-2 h-4 w-4" />
                        Novo Agente
                    </Link>
                </Button>
            </div>

            {/* Filters */}
            <div className="flex items-center space-x-2">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Buscar agentes..."
                        className="pl-8 bg-white"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Grid */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="space-y-4 border rounded-xl p-4 bg-white">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-20 w-full" />
                        </div>
                    ))}
                </div>
            ) : filteredAgents.length === 0 ? (
                <div className="flex flex-col items-center justify-center min-h-[400px] border-2 border-dashed rounded-xl bg-white p-8 text-center animate-in fade-in zoom-in duration-500">
                    <div className="bg-blue-50 p-4 rounded-full mb-4">
                        <Bot className="h-8 w-8 text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-lg text-gray-900">Nenhum agente encontrado</h3>
                    <p className="text-muted-foreground max-w-sm my-2">
                        {search ? "Tente buscar com outros termos." : "Crie seu primeiro agente para começar."}
                    </p>
                    {!search && (
                        <Button asChild variant="outline">
                            <Link href="/app/agents/new">Criar Agente</Link>
                        </Button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {filteredAgents.map((agent) => (
                        <Card key={agent.id} className="hover:shadow-lg transition-all duration-300 border-transparent hover:border-blue-100 group">
                            <CardHeader className="pb-3">
                                <div className="flex justify-between items-start">
                                    <div className="bg-blue-50 p-2.5 rounded-xl group-hover:bg-blue-100 transition-colors">
                                        <Bot className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <Badge variant={agent.status === 'active' ? 'default' : 'secondary'} className={agent.status === 'active' ? 'bg-green-500 hover:bg-green-600' : ''}>
                                        {agent.status === 'active' ? 'Ativo' : agent.status === 'draft' ? 'Rascunho' : 'Inativo'}
                                    </Badge>
                                </div>
                                <CardTitle className="mt-4 text-base font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                                    {agent.name}
                                </CardTitle>
                                <CardDescription className="line-clamp-2 min-h-[40px]">
                                    {agent.description}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-xs text-muted-foreground">
                                    Atualizado em {new Date(agent.updatedAt).toLocaleDateString('pt-BR')}
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button asChild variant="secondary" className="w-full font-medium group-hover:bg-blue-50 group-hover:text-blue-700 transition-colors">
                                    <Link href={`/app/agents/${agent.id}`}>
                                        Editar Fluxo
                                    </Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
