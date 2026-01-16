'use client'

import React, { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/forms/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/forms/select"
import { ArrowLeft, Save, Bot, Brain, Activity, Clock, MessageSquare, Zap } from "lucide-react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { agentService, Agent, DNAConfig } from "@/services/agentService"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/layout/tabs"

// Default DNA Config
const DEFAULT_DNA: DNAConfig = {
    psychometrics: {
        openness: 'MEDIUM',
        conscientiousness: 'HIGH',
        extraversion: 'MEDIUM',
        agreeableness: 'HIGH',
        neuroticism: 'LOW'
    },
    linguistics: {
        reduction_profile: 'BALANCED',
        caps_mode: 'STANDARD',
        correction_style: 'BARE_CORRECTION',
        typo_injection: 'NONE'
    },
    chronemics: {
        latency_profile: 'MODERATE',
        burstiness: 'LOW'
    },
    pad_baseline: {
        pleasure: 'POSITIVE',
        arousal: 'MEDIUM',
        dominance: 'EGALITARIAN'
    },
    qualification: {
        framework: 'SPIN',
        slots: ['need', 'budget']
    }
}

export default function AgentDNAEditorPage() {
    const params = useParams()
    const router = useRouter()
    const id = params?.id
    const isNew = id === 'new'

    const [loading, setLoading] = useState(false)
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [model, setModel] = useState('gemini-2.5-flash')
    const [dna, setDna] = useState<DNAConfig>(DEFAULT_DNA)

    // Load existing agent
    useEffect(() => {
        if (!isNew && id) {
            const loadAgent = async () => {
                try {
                    setLoading(true)
                    const data = await agentService.get(id as string)
                    setName(data.name)
                    setDescription(data.description || '')
                    setModel(data.model || 'gemini-2.5-flash')

                    if (data.dna_config) {
                        // Merge with default to ensure no missing fields if schema updates
                        setDna({ ...DEFAULT_DNA, ...data.dna_config })
                    }
                } catch (error) {
                    console.error("Failed to load agent", error)
                    toast.error("Erro ao carregar agente")
                } finally {
                    setLoading(false)
                }
            }
            loadAgent()
        }
    }, [id, isNew])

    const handleSave = async () => {
        if (!name) return toast.error("Nome é obrigatório")

        setLoading(true)
        try {
            const payload: Partial<Agent> = {
                name,
                description,
                model,
                dna_config: dna,
                provider: 'gemini',
                status: 'active'
            }

            if (isNew) {
                await agentService.create(payload)
                toast.success("Agente criado com sucesso!")
                router.push('/app/agents')
            } else {
                await agentService.update(id as string, payload)
                toast.success("Agente atualizado com sucesso!")
            }
        } catch (error) {
            console.error(error)
            toast.error("Erro ao salvar agente")
        } finally {
            setLoading(false)
        }
    }

    // Helper to update DNA nested fields
    const updateDna = (section: keyof DNAConfig, field: string, value: any) => {
        setDna(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [field]: value
            }
        }))
    }

    // Helper for slots toggle
    const toggleSlot = (slot: string) => {
        const currentSlots = dna.qualification?.slots || []
        const newSlots = currentSlots.includes(slot as any)
            ? currentSlots.filter(s => s !== slot)
            : [...currentSlots, slot]

        updateDna('qualification', 'slots', newSlots)
    }

    return (
        <div className="h-full flex flex-col font-inter bg-gray-50/50">
            {/* Toolbar */}
            <div className="border-b px-8 py-4 flex items-center justify-between bg-white z-10 sticky top-0 shadow-sm">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild className="hover:bg-gray-100">
                        <Link href="/app/agents">
                            <ArrowLeft className="h-5 w-5 text-gray-500" />
                        </Link>
                    </Button>
                    <div className="flex flex-col">
                        <h1 className="text-lg font-bold text-gray-900 leading-none">
                            {isNew ? 'Criar Novo Agente' : 'Editor de DNA'}
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            {isNew ? 'Defina a identidade da sua IA' : `Editando: ${name || 'Sem nome'}`}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button onClick={handleSave} disabled={loading} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
                        <Save className="mr-2 h-4 w-4" />
                        {loading ? 'Salvando...' : 'Salvar DNA'}
                    </Button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto p-8 max-w-6xl mx-auto w-full space-y-8 pb-32">

                {/* 1. Identity & Brain */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-1 space-y-2">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            <Bot className="h-5 w-5 text-blue-600" />
                            Identidade e Cérebro
                        </h3>
                        <p className="text-sm text-gray-500">
                            Configurações fundamentais. Quem ele é e qual sua missão principal.
                        </p>
                    </div>
                    <Card className="md:col-span-2 border-none shadow-md">
                        <CardContent className="space-y-6 pt-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Nome</label>
                                    <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Ana" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Função (Role)</label>
                                    <Select value={description} onValueChange={setDescription}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione a função" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Sales Development Representative">SDR (Vendas)</SelectItem>
                                            <SelectItem value="Customer Support Specialist">Suporte (SAC)</SelectItem>
                                            <SelectItem value="Account Executive">Executivo de Contas</SelectItem>
                                            <SelectItem value="Onboarding Specialist">Onboarding</SelectItem>
                                            <SelectItem value="Technical Consultant">Consultor Técnico</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Modelo de IA</label>
                                <Select value={model} onValueChange={setModel}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="gemini-2.5-flash">Gemini 2.5 Flash</SelectItem>
                                        <SelectItem value="gemini-2.5-pro">Gemini 2.5 Pro</SelectItem>
                                        <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="p-4 bg-blue-50 text-blue-700 text-sm rounded-lg flex items-start gap-3">
                                <Brain className="h-5 w-5 shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-semibold">Prompt Gerado Automaticamente</p>
                                    <p className="opacity-90 mt-1">
                                        O comportamento deste agente é governado estritamente pelas configurações de DNA abaixo (Psicometria, Emoções, etc).
                                        Não é necessário escrever instruções manuais.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="w-full h-px bg-gray-200" />

                {/* 2. DNA Configuration Tabs */}
                <div className="space-y-6">
                    <div className="flex flex-col gap-2">
                        <h3 className="text-xl font-bold flex items-center gap-2 text-gray-900">
                            <Brain className="h-6 w-6 text-purple-600" />
                            Configuração de DNA
                        </h3>
                        <p className="text-gray-500 max-w-2xl">
                            Ajuste fino da personalidade e comportamento do agente. Todas as variáveis afetam como ele processa e responde.
                        </p>
                    </div>

                    <Tabs defaultValue="psychometrics" className="w-full">
                        <TabsList className="w-full justify-start bg-gray-100 p-1 rounded-lg">
                            <TabsTrigger value="triagem">🎯 Triagem (BANT/SPIN)</TabsTrigger>
                            <TabsTrigger value="psychometrics">🧠 Psicometria (Big 5)</TabsTrigger>
                            <TabsTrigger value="emotions">❤️ Emoções (PAD)</TabsTrigger>
                            <TabsTrigger value="linguistics">💬 Linguística</TabsTrigger>
                            <TabsTrigger value="chronemics">⏱️ Cronêmica</TabsTrigger>
                        </TabsList>

                        {/* --- TRIAGEM (Qualifications) --- */}
                        <TabsContent value="triagem" className="mt-6">
                            <Card className="border-none shadow-md">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Zap className="h-5 w-5 text-yellow-500" />
                                        Metodologia de Vendas & Qualificação
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="space-y-2 max-w-md">
                                        <label className="text-sm font-medium text-gray-700">Framework de Vendas</label>
                                        <Select
                                            value={dna.qualification?.framework || 'SPIN'}
                                            onValueChange={(v) => updateDna('qualification', 'framework', v)}
                                        >
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="SPIN">SPIN Selling (Situação, Problema...)</SelectItem>
                                                <SelectItem value="BANT">BANT (Budget, Authority, Need, Time)</SelectItem>
                                                <SelectItem value="GPCT">GPCT (Goals, Plans, Challenges...)</SelectItem>
                                                <SelectItem value="MEDDIC">MEDDIC (Metrics, Economic Buyer...)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <p className="text-xs text-gray-500">O framework define a estrutura lógica das perguntas que o agente fará.</p>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-sm font-medium text-gray-700 block">Slots de Qualificação (Obrigatórios)</label>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                            {[
                                                { id: 'need', label: 'Necessidade (Need)' },
                                                { id: 'budget', label: 'Orçamento (Budget)' },
                                                { id: 'authority', label: 'Autoridade (Authority)' },
                                                { id: 'timeline', label: 'Prazo (Timeline)' },
                                                { id: 'solution', label: 'Interesse na Solução' },
                                                { id: 'timing', label: 'Momento de Compra' }
                                            ].map((slot) => {
                                                const isSelected = dna.qualification?.slots?.includes(slot.id as any);
                                                return (
                                                    <div
                                                        key={slot.id}
                                                        onClick={() => toggleSlot(slot.id)}
                                                        className={`
                                                            cursor-pointer border rounded-lg p-3 flex items-center justify-between transition-all
                                                            ${isSelected ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-300' : 'bg-white hover:bg-gray-50'}
                                                        `}
                                                    >
                                                        <span className={`text-sm font-medium ${isSelected ? 'text-blue-700' : 'text-gray-700'}`}>{slot.label}</span>
                                                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}>
                                                            {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                        <p className="text-xs text-gray-500">O agente tentará preencher estes slots durante a conversa antes de avançar.</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* --- PSYCHOMETRICS --- */}
                        <TabsContent value="psychometrics" className="mt-6">
                            <Card className="border-none shadow-md">
                                <CardHeader>
                                    <CardTitle>Ocean Model (Big 5)</CardTitle>
                                </CardHeader>
                                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {[
                                        { id: 'openness', label: 'Abertura (Openness)' },
                                        { id: 'conscientiousness', label: 'Conscienciosidade' },
                                        { id: 'extraversion', label: 'Extroversão' },
                                        { id: 'agreeableness', label: 'Amabilidade' },
                                        { id: 'neuroticism', label: 'Neuroticismo' }
                                    ].map((trait) => (
                                        <div key={trait.id} className="space-y-2">
                                            <label className="text-sm font-medium text-gray-700">{trait.label}</label>
                                            <Select
                                                value={dna.psychometrics[trait.id as keyof typeof dna.psychometrics]}
                                                onValueChange={(v) => updateDna('psychometrics', trait.id, v)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="LOW">Baixo</SelectItem>
                                                    <SelectItem value="MEDIUM">Médio</SelectItem>
                                                    <SelectItem value="HIGH">Alto</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* --- EMOTIONS --- */}
                        <TabsContent value="emotions" className="mt-6">
                            <Card className="border-none shadow-md">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Activity className="h-5 w-5 text-red-500" />
                                        Emotional State (PAD)
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">Prazer (Pleasure)</label>
                                        <Select
                                            value={dna.pad_baseline.pleasure}
                                            onValueChange={(v) => updateDna('pad_baseline', 'pleasure', v)}
                                        >
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="NEGATIVE">Negativo (Displasure)</SelectItem>
                                                <SelectItem value="NEUTRAL">Neutro</SelectItem>
                                                <SelectItem value="POSITIVE">Positivo</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">Ativação (Arousal)</label>
                                        <Select
                                            value={dna.pad_baseline.arousal}
                                            onValueChange={(v) => updateDna('pad_baseline', 'arousal', v)}
                                        >
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="LOW">Baixa (Calmo)</SelectItem>
                                                <SelectItem value="MEDIUM">Média</SelectItem>
                                                <SelectItem value="HIGH">Alta (Excited)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">Dominância</label>
                                        <Select
                                            value={dna.pad_baseline.dominance}
                                            onValueChange={(v) => updateDna('pad_baseline', 'dominance', v)}
                                        >
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="SUBMISSIVE">Submisso</SelectItem>
                                                <SelectItem value="EGALITARIAN">Igualitário</SelectItem>
                                                <SelectItem value="DOMINANT">Dominante</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* --- LINGUISTICS --- */}
                        <TabsContent value="linguistics" className="mt-6">
                            <Card className="border-none shadow-md">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <MessageSquare className="h-5 w-5 text-blue-500" />
                                        Estilo de Escrita
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">Nível de Redução (Formalidade)</label>
                                        <Select
                                            value={dna.linguistics.reduction_profile}
                                            onValueChange={(v) => updateDna('linguistics', 'reduction_profile', v)}
                                        >
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="CORPORATE">Corporativo (Formal)</SelectItem>
                                                <SelectItem value="BALANCED">Balanceado</SelectItem>
                                                <SelectItem value="NATIVE">Nativo (Informal)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">Capitalização (Maiúsculas)</label>
                                        <Select
                                            value={dna.linguistics.caps_mode}
                                            onValueChange={(v) => updateDna('linguistics', 'caps_mode', v)}
                                        >
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="STANDARD">Padrão</SelectItem>
                                                <SelectItem value="SENTENCE_CASE">Apenas inicial</SelectItem>
                                                <SelectItem value="LOWERCASE_ONLY">Tudo minúsculo</SelectItem>
                                                <SelectItem value="CHAOTIC">Caótico (Humanizado)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">Estilo de Correção</label>
                                        <Select
                                            value={dna.linguistics.correction_style}
                                            onValueChange={(v) => updateDna('linguistics', 'correction_style', v)}
                                        >
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="ASTERISK_PRE">*palavra</SelectItem>
                                                <SelectItem value="ASTERISK_POST">palavra*</SelectItem>
                                                <SelectItem value="BARE_CORRECTION">Apenas a palavra</SelectItem>
                                                <SelectItem value="EXPLANATORY">Explicativo</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">Injeção de Typos</label>
                                        <Select
                                            value={dna.linguistics.typo_injection}
                                            onValueChange={(v) => updateDna('linguistics', 'typo_injection', v)}
                                        >
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="NONE">Nenhum</SelectItem>
                                                <SelectItem value="LOW">Baixa</SelectItem>
                                                <SelectItem value="MEDIUM">Média</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* --- CHRONEMICS --- */}
                        <TabsContent value="chronemics" className="mt-6">
                            <Card className="border-none shadow-md">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Clock className="h-5 w-5 text-orange-500" />
                                        Tempo e Ritmo
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">Velocidade (Latência)</label>
                                        <Select
                                            value={dna.chronemics.latency_profile}
                                            onValueChange={(v) => updateDna('chronemics', 'latency_profile', v)}
                                        >
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="VERY_FAST">Muito Rápido</SelectItem>
                                                <SelectItem value="FAST">Rápido</SelectItem>
                                                <SelectItem value="MODERATE">Moderado (Humano)</SelectItem>
                                                <SelectItem value="SLOW">Lento (Pensativo)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">Explosão (Burstiness)</label>
                                        <Select
                                            value={dna.chronemics.burstiness}
                                            onValueChange={(v) => updateDna('chronemics', 'burstiness', v)}
                                        >
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="NONE">Nenhuma (Robótico)</SelectItem>
                                                <SelectItem value="LOW">Baixa</SelectItem>
                                                <SelectItem value="MEDIUM">Média</SelectItem>
                                                <SelectItem value="HIGH">Alta (Caótico)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                    </Tabs>
                </div>
            </div>
        </div>
    )
}
