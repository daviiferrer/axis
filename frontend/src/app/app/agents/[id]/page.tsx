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
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, Save, Bot, Brain, Activity, Clock, MessageSquare, Zap } from "lucide-react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { agentService, Agent, DNAConfig } from "@/services/agentService"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/layout/tabs"
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/data-display/accordion"

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

// --- REUSABLE COMPONENTS ---

// Visual Option Card (replaces boring Selects)
const VisualOption = ({
    label,
    value,
    selected,
    onClick,
    icon: Icon,
    description
}: {
    label: string,
    value: string,
    selected: boolean,
    onClick: () => void,
    icon?: any,
    description?: string
}) => (
    <div
        onClick={onClick}
        className={`
            cursor-pointer relative p-4 rounded-xl border-2 transition-all duration-200 group
            ${selected
                ? 'border-blue-600 bg-blue-50/50 shadow-sm'
                : 'border-transparent bg-gray-50 hover:bg-white hover:shadow-md hover:border-gray-200'
            }
        `}
    >
        <div className="flex items-start gap-3">
            {Icon && (
                <div className={`
                    p-2 rounded-lg transition-colors
                    ${selected ? 'bg-blue-100 text-blue-700' : 'bg-white text-gray-500 group-hover:text-gray-700'}
                `}>
                    <Icon className="h-5 w-5" />
                </div>
            )}
            <div>
                <h4 className={`text-sm font-bold ${selected ? 'text-blue-900' : 'text-gray-900'}`}>{label}</h4>
                {description && (
                    <p className={`text-xs mt-1 leading-relaxed ${selected ? 'text-blue-700' : 'text-gray-500'}`}>
                        {description}
                    </p>
                )}
            </div>
        </div>

        {/* Selection Indicator */}
        <div className={`
            absolute top-4 right-4 w-4 h-4 rounded-full border-2 flex items-center justify-center
            ${selected ? 'border-blue-600 bg-blue-600' : 'border-gray-300'}
        `}>
            {selected && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
        </div>
    </div>
)

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
        <div className="min-h-screen bg-gray-50/50 flex flex-col font-sans">
            {/* 1. HEADER MODERNO */}
            <div className="bg-white border-b sticky top-0 z-20 shadow-sm/50 backdrop-blur-xl bg-white/80 supports-[backdrop-filter]:bg-white/60">
                <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" asChild className="hover:bg-gray-100 rounded-full h-8 w-8">
                            <Link href="/app/agents">
                                <ArrowLeft className="h-4 w-4 text-gray-600" />
                            </Link>
                        </Button>

                        <div className="h-6 w-px bg-gray-200" />

                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs ring-2 ring-white shadow-sm">
                                {name ? name.substring(0, 2).toUpperCase() : 'IA'}
                            </div>
                            <div>
                                <h1 className="text-sm font-bold text-gray-900 leading-none">
                                    {isNew ? 'Criando Nova Inteligência' : name}
                                </h1>
                                <p className="text-[10px] uppercase font-bold text-blue-600 tracking-wider mt-0.5">
                                    {description || 'SDR (Vendas)'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-xs font-bold ring-1 ring-green-100">
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                            Active Model: {model}
                        </div>
                        <Button
                            onClick={handleSave}
                            disabled={loading}
                            className="rounded-full bg-gray-900 hover:bg-black text-white px-6 shadow-lg shadow-gray-200 hover:shadow-xl transition-all"
                        >
                            {loading ? <Activity className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                            Salvar Alterações
                        </Button>
                    </div>
                </div>
            </div>

            {/* MAIN CANVAS */}
            <div className="flex-1 max-w-6xl mx-auto w-full p-6 pb-24 space-y-8">

                {/* 2. IDENTITY SECTION - GRID LAYOUT */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    {/* AVATAR & BASIC INFO (Left Col) */}
                    <div className="md:col-span-4 space-y-4">
                        <Card className="border-none shadow-lg shadow-gray-200/50 overflow-hidden bg-white">
                            <div className="h-24 bg-gradient-to-r from-blue-500 to-indigo-600 relative">
                                <div className="absolute -bottom-10 left-6 p-1 bg-white rounded-2xl shadow-sm">
                                    <div className="w-20 h-20 rounded-xl bg-gray-100 flex items-center justify-center text-2xl">
                                        🤖
                                    </div>
                                </div>
                            </div>
                            <CardContent className="pt-12 px-6 pb-6 space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Nome do Agente</label>
                                    <Input
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        className="mt-1 h-10 font-medium text-lg border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-lg"
                                        placeholder="Ex: Ana Silva"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Função Principal</label>
                                    <div className="grid grid-cols-1 gap-2">
                                        {[
                                            { id: 'Sales Development Representative', label: 'SDR / Vendas', icon: Zap },
                                            { id: 'Customer Support Specialist', label: 'Suporte / SAC', icon: MessageSquare },
                                        ].map(role => (
                                            <div
                                                key={role.id}
                                                onClick={() => setDescription(role.id)}
                                                className={`
                                                    cursor-pointer p-2.5 rounded-lg border flex items-center gap-3 transition-all
                                                    ${description === role.id ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-200' : 'bg-white hover:bg-gray-50 border-gray-200'}
                                                `}
                                            >
                                                <div className={`p-1.5 rounded-md ${description === role.id ? 'bg-blue-200 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                                                    <role.icon className="h-4 w-4" />
                                                </div>
                                                <span className={`text-sm font-medium ${description === role.id ? 'text-blue-900' : 'text-gray-600'}`}>
                                                    {role.label}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* AI BRAIN CONFIG (Right Col) */}
                    <div className="md:col-span-8">
                        <Card className="border-none shadow-lg shadow-gray-200/50 bg-white h-full">
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <Brain className="h-5 w-5 text-purple-600" />
                                    <CardTitle className="text-base text-gray-900">Cérebro & Inteligência</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    {/* MODEL SELECTION AS CARDS */}
                                    {['gemini-2.5-flash', 'gpt-4o'].map(m => (
                                        <div
                                            key={m}
                                            onClick={() => setModel(m)}
                                            className={`
                                                cursor-pointer relative p-4 rounded-xl border-2 transition-all
                                                ${model === m ? 'border-purple-600 bg-purple-50/30' : 'border-dashed border-gray-200 hover:border-purple-300 hover:bg-gray-50'}
                                            `}
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <span className={`text-sm font-bold ${model === m ? 'text-purple-900' : 'text-gray-500'}`}>
                                                    {m === 'gemini-2.5-flash' ? 'Gemini Flash' : 'GPT-4o'}
                                                </span>
                                                {model === m && <div className="h-2 w-2 rounded-full bg-purple-600 shadow-[0_0_8px_rgba(147,51,234,0.5)]" />}
                                            </div>
                                            <p className="text-xs text-gray-500 leading-relaxed">
                                                {m === 'gemini-2.5-flash' ? '⚡ Ultra-rápido, ideal para respostas instantâneas.' : '🧠 Mais complexo, melhor para raciocínio profundo.'}
                                            </p>
                                        </div>
                                    ))}
                                </div>

                                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                    <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-2 flex items-center gap-2">
                                        <Bot className="h-3 w-3" />
                                        Prompt Base
                                    </h4>
                                    <p className="text-sm text-gray-500 leading-relaxed">
                                        O sistema irá gerar automaticamente um prompt otimizado baseado no <strong>DNA</strong> abaixo.
                                        Você não precisa escrever instruções complexas manualmente.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* 3. TABS NAVIGATION REIMAGINED */}
                <div className="space-y-6">
                    <Tabs defaultValue="psychometrics" className="w-full">
                        <TabsList className="w-full justify-start bg-gray-100 p-1 rounded-lg">
                            <TabsTrigger value="triagem">🎯 Qualificação</TabsTrigger>
                            <TabsTrigger value="psychometrics">🧠 Personalidade</TabsTrigger>
                            <TabsTrigger value="emotions">❤️ Humor Base</TabsTrigger>
                            <TabsTrigger value="linguistics">💬 Forma de Escrever</TabsTrigger>
                            <TabsTrigger value="chronemics">⏱️ Velocidade e Estilo</TabsTrigger>
                            <TabsTrigger value="safety">🛡️ Limites</TabsTrigger>
                        </TabsList>

                        {/* --- TRIAGEM (Qualifications) --- */}
                        <TabsContent value="triagem" className="mt-6">
                            <Card className="border-none shadow-md">
                                <CardHeader>
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2 bg-yellow-100 rounded-lg">
                                            <Zap className="h-6 w-6 text-yellow-600" />
                                        </div>
                                        <div>
                                            <CardTitle>Metodologia de Vendas & Qualificação</CardTitle>
                                            <p className="text-sm text-gray-500 font-normal mt-1">
                                                Como o agente deve abordar a venda e quais perguntas são obrigatórias.
                                            </p>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-8">
                                    <div className="space-y-4">
                                        <label className="text-base font-bold text-gray-900 block">Framework de Vendas (Lógica de Perguntas)</label>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {[
                                                { id: 'SPIN', label: 'SPIN Selling', desc: 'Foca em investigar a dor antes de vender. (Situação, Problema, Implicação)' },
                                                { id: 'BANT', label: 'BANT (Clássico)', desc: 'Qualificação rápida: Orçamento, Autoridade, Necessidade e Prazo.' },
                                                { id: 'GPCT', label: 'GPCT', desc: 'Foco em objetivos e planos do cliente. Mais consultivo.' },
                                                { id: 'MEDDIC', label: 'MEDDIC', desc: 'Avançado. Foca em métricas, decisor e processo de compra.' }
                                            ].map(fw => (
                                                <VisualOption
                                                    key={fw.id}
                                                    label={fw.label}
                                                    description={fw.desc}
                                                    selected={dna.qualification?.framework === fw.id}
                                                    onClick={() => updateDna('qualification', 'framework', fw.id)}
                                                    value={fw.id}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    <div className="p-6 bg-gray-50 rounded-xl border border-gray-100 space-y-4">
                                        <label className="text-base font-bold text-gray-900 block">Dados Obrigatórios (Slots)</label>
                                        <p className="text-sm text-gray-500 mb-4">
                                            Selecione quais informações o agente <strong>NÃO pode esquecer</strong> de perguntar antes de passar para um humano.
                                        </p>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                            {[
                                                { id: 'need', label: 'Necessidade / Dor' },
                                                { id: 'budget', label: 'Orçamento (Budget)' },
                                                { id: 'authority', label: 'Quem Decide?' },
                                                { id: 'timeline', label: 'Prazo / Urgência' },
                                                { id: 'solution', label: 'Interesse na Solução' },
                                                { id: 'timing', label: 'Momento de Compra' }
                                            ].map((slot) => {
                                                const isSelected = dna.qualification?.slots?.includes(slot.id as any);
                                                return (
                                                    <div
                                                        key={slot.id}
                                                        onClick={() => toggleSlot(slot.id)}
                                                        className={`
                                                            cursor-pointer relative p-3 rounded-lg border-2 flex items-center gap-3 transition-all
                                                            ${isSelected ? 'bg-green-50 border-green-500' : 'bg-white border-gray-200 hover:border-gray-300'}
                                                        `}
                                                    >
                                                        <div className={`
                                                            w-5 h-5 rounded flex items-center justify-center border
                                                            ${isSelected ? 'bg-green-500 border-green-500 text-white' : 'bg-white border-gray-300'}
                                                        `}>
                                                            {isSelected && <Zap className="h-3 w-3 fill-current" />}
                                                        </div>
                                                        <span className={`text-sm font-semibold ${isSelected ? 'text-green-900' : 'text-gray-600'}`}>
                                                            {slot.label}
                                                        </span>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* --- PSYCHOMETRICS --- */}
                        <TabsContent value="psychometrics" className="mt-6">
                            <Card className="border-none shadow-md">
                                <CardHeader>
                                    <CardTitle>Traços de Personalidade</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-8">
                                    {[
                                        {
                                            id: 'openness',
                                            label: 'Criatividade (Openness)',
                                            desc: 'Quão aberta a novas ideias e conceitos abstratos a IA deve ser?',
                                            options: [
                                                { value: 'LOW', label: 'Prática & Direta', desc: 'Foca no concreto, no "agora". Ótimo para suporte técnico.' },
                                                { value: 'MEDIUM', label: 'Equilibrada', desc: 'Mistura fatos com boa adaptação.' },
                                                { value: 'HIGH', label: 'Criativa & Abstrata', desc: 'Gosta de explorar ideias. Ótimo para consultoria.' }
                                            ]
                                        },
                                        {
                                            id: 'conscientiousness',
                                            label: 'Organização (Conscienciosidade)',
                                            desc: 'O nível de disciplina, ordem e atenção aos detalhes.',
                                            options: [
                                                { value: 'LOW', label: 'Espontânea', desc: 'Mais flexível, menos rígida com processos.' },
                                                { value: 'MEDIUM', label: 'Organizada', desc: 'Segue processos mas adapta se necessário.' },
                                                { value: 'HIGH', label: 'Metódica & Precisa', desc: 'Extremamente detalhista. Perfeito para financeiro/jurídico.' }
                                            ]
                                        },
                                        {
                                            id: 'extraversion',
                                            label: 'Sociabilidade (Extroversão)',
                                            desc: 'Nível de energia social e entusiasmo na fala.',
                                            options: [
                                                { value: 'LOW', label: 'Reservada & Calma', desc: 'Fala o necessário. Passa seriedade.' },
                                                { value: 'MEDIUM', label: 'Amigável', desc: 'Entusiasmo na medida certa.' },
                                                { value: 'HIGH', label: 'Enérgica & Extrovertida', desc: 'Muito expressiva, usa exclamações! Ótimo para vendas.' }
                                            ]
                                        },
                                        {
                                            id: 'agreeableness',
                                            label: 'Gentileza (Amabilidade)',
                                            desc: 'O quão cooperativa e empática ela é com o usuário.',
                                            options: [
                                                { value: 'LOW', label: 'Direta & Desafiadora', desc: 'Foca na verdade nua e crua. Bom para negociação dura.' },
                                                { value: 'MEDIUM', label: 'Educada', desc: 'Cordial e profissional.' },
                                                { value: 'HIGH', label: 'Muito Empática', desc: 'Foca totalmente em agradar e ajudar. Bom para SAC.' }
                                            ]
                                        },
                                        {
                                            id: 'neuroticism',
                                            label: 'Sensibilidade Emocional',
                                            desc: 'Como ela reage ao estresse ou frustração do usuário.',
                                            options: [
                                                { value: 'LOW', label: 'Resiliente & Estável', desc: 'Não se abala com insultos. Pedra de gelo.' },
                                                { value: 'MEDIUM', label: 'Reativa', desc: 'Demonstra preocupação normal.' },
                                                { value: 'HIGH', label: 'Sensível & Ansiosa', desc: 'Demonstra muita urgência e preocupação. Bom para emergências.' }
                                            ]
                                        }
                                    ].map((trait) => (
                                        <div key={trait.id} className="space-y-4 pb-6 border-b border-gray-100 last:border-0">
                                            <div>
                                                <label className="text-base font-bold text-gray-900">{trait.label}</label>
                                                <p className="text-sm text-gray-500">{trait.desc}</p>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                {trait.options.map((opt) => (
                                                    <VisualOption
                                                        key={opt.value}
                                                        label={opt.label}
                                                        description={opt.desc}
                                                        selected={dna.psychometrics[trait.id as keyof typeof dna.psychometrics] === opt.value}
                                                        onClick={() => updateDna('psychometrics', trait.id, opt.value)}
                                                        value={opt.value}
                                                    />
                                                ))}
                                            </div>
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
                                        Estado Emocional Padrão
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-8">
                                    {/* PLEASURE */}
                                    <div className="space-y-3">
                                        <label className="text-base font-bold text-gray-900 block">Humor Geral</label>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                            {[
                                                { value: 'NEGATIVE', label: 'Descontente / Sério', desc: 'Tom mais pesado ou preocupado.' },
                                                { value: 'NEUTRAL', label: 'Neutro / Profissional', desc: 'Sem viés emocional forte.' },
                                                { value: 'POSITIVE', label: 'Alegre / Otimista', desc: 'Vibe positiva e leve.' }
                                            ].map(opt => (
                                                <VisualOption
                                                    key={opt.value}
                                                    label={opt.label}
                                                    description={opt.desc}
                                                    selected={dna.pad_baseline.pleasure === opt.value}
                                                    onClick={() => updateDna('pad_baseline', 'pleasure', opt.value)}
                                                    value={opt.value}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    {/* AROUSAL */}
                                    <div className="space-y-3">
                                        <label className="text-base font-bold text-gray-900 block">Nível de Energia (Arousal)</label>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                            {[
                                                { value: 'LOW', label: 'Zen / Calmo', desc: 'Relaxada, sem pressa.' },
                                                { value: 'MEDIUM', label: 'Atento', desc: 'Pronta para responder.' },
                                                { value: 'HIGH', label: 'Pilhado / Intenso', desc: 'Muita energia de ação!' }
                                            ].map(opt => (
                                                <VisualOption
                                                    key={opt.value}
                                                    label={opt.label}
                                                    description={opt.desc}
                                                    selected={dna.pad_baseline.arousal === opt.value}
                                                    onClick={() => updateDna('pad_baseline', 'arousal', opt.value)}
                                                    value={opt.value}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    {/* DOMINANCE */}
                                    <div className="space-y-3">
                                        <label className="text-base font-bold text-gray-900 block">Postura na Conversa</label>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                            {[
                                                { value: 'SUBMISSIVE', label: 'Serviçal / Passivo', desc: 'Espera ordens do cliente.' },
                                                { value: 'EGALITARIAN', label: 'Parceiro / Igual', desc: 'Trata como colega.' },
                                                { value: 'DOMINANT', label: 'Líder / Guia', desc: 'Conduz a conversa com firmeza.' }
                                            ].map(opt => (
                                                <VisualOption
                                                    key={opt.value}
                                                    label={opt.label}
                                                    description={opt.desc}
                                                    selected={dna.pad_baseline.dominance === opt.value}
                                                    onClick={() => updateDna('pad_baseline', 'dominance', opt.value)}
                                                    value={opt.value}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* --- LINGUISTICS --- */}
                        <TabsContent value="linguistics" className="mt-6">
                            <Card className="border-none shadow-md">
                                <CardHeader>
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2 bg-blue-100 rounded-lg">
                                            <MessageSquare className="h-6 w-6 text-blue-600" />
                                        </div>
                                        <div>
                                            <CardTitle>Estilo de Escrita</CardTitle>
                                            <p className="text-sm text-gray-500 font-normal mt-1">
                                                Define como as mensagens são formatadas. Gírias? Emojis? Erros de digitação?
                                            </p>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-8">
                                    {/* FORMALIDADE */}
                                    <div className="space-y-4">
                                        <label className="text-base font-bold text-gray-900 block">Formalidade (Nível de Redução)</label>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                            {[
                                                { value: 'CORPORATE', label: 'Corporativo', desc: 'Português impecável, "Prezado cliente".' },
                                                { value: 'BALANCED', label: 'Balanceado', desc: 'Profissional, mas acessível. Padrão.' },
                                                { value: 'NATIVE', label: 'Whatsapp Nativo', desc: 'Usa abreviações (vc, tbm), parece amigo.' }
                                            ].map(opt => (
                                                <VisualOption
                                                    key={opt.value}
                                                    label={opt.label}
                                                    description={opt.desc}
                                                    selected={dna.linguistics.reduction_profile === opt.value}
                                                    onClick={() => updateDna('linguistics', 'reduction_profile', opt.value)}
                                                    value={opt.value}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    {/* CAPITALIZAÇÃO */}
                                    <div className="space-y-4">
                                        <label className="text-base font-bold text-gray-900 block">Estilo de Letras (Caps)</label>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {[
                                                { value: 'STANDARD', label: 'Padrão (Gramatical)', desc: 'Começa frases com maiúscula. Normal.' },
                                                { value: 'LOWERCASE_ONLY', label: 'ticket jovem (minúsculas)', desc: 'tudo minúsculo, estilo gen z / startup.' }
                                            ].map(opt => (
                                                <VisualOption
                                                    key={opt.value}
                                                    label={opt.label}
                                                    description={opt.desc}
                                                    selected={dna.linguistics.caps_mode === opt.value}
                                                    onClick={() => updateDna('linguistics', 'caps_mode', opt.value)}
                                                    value={opt.value}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    {/* TYPOS */}
                                    <div className="space-y-4">
                                        <label className="text-base font-bold text-gray-900 block">Erros de Digitação (Typos)</label>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                            {[
                                                { value: 'NONE', label: 'Perfeito', desc: 'Zero erros. Robótico.' },
                                                { value: 'LOW', label: 'Realista (Baixo)', desc: 'Erra raramente, se corrige.' },
                                                { value: 'MEDIUM', label: 'Desastrado', desc: 'Vários erros. Parece digitar correndo.' }
                                            ].map(opt => (
                                                <VisualOption
                                                    key={opt.value}
                                                    label={opt.label}
                                                    description={opt.desc}
                                                    selected={dna.linguistics.typo_injection === opt.value}
                                                    onClick={() => updateDna('linguistics', 'typo_injection', opt.value)}
                                                    value={opt.value}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* --- CHRONEMICS --- */}
                        <TabsContent value="chronemics" className="mt-6">
                            <Card className="border-none shadow-md">
                                <CardHeader>
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2 bg-orange-100 rounded-lg">
                                            <Clock className="h-6 w-6 text-orange-600" />
                                        </div>
                                        <div>
                                            <CardTitle>Comportamento de Digitação (Cronêmica)</CardTitle>
                                            <p className="text-sm text-gray-500 font-normal mt-1">
                                                Defina como a IA se comporta no tempo. Ela digita rápido? Manda várias mensagens?
                                            </p>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <Accordion type="single" collapsible className="w-full">

                                        {/* LATENCY */}
                                        <AccordionItem value="latency" className="border-b-0 space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div className="space-y-1">
                                                    <label className="text-base font-semibold text-gray-900">Velocidade de Resposta</label>
                                                    <p className="text-sm text-gray-500">Quanto tempo a IA "finge" que está digitando antes de enviar.</p>
                                                </div>
                                                <Select
                                                    value={dna.chronemics.latency_profile}
                                                    onValueChange={(v) => updateDna('chronemics', 'latency_profile', v)}
                                                >
                                                    <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="VERY_FAST">⚡ Instantâneo (Bot)</SelectItem>
                                                        <SelectItem value="FAST">🚀 Rápido (Suporte Ágil)</SelectItem>
                                                        <SelectItem value="MODERATE">👤 Moderado (Humano)</SelectItem>
                                                        <SelectItem value="SLOW">🐢 Lento (Pensativo)</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <AccordionTrigger className="text-sm text-blue-600 hover:text-blue-700 py-2">
                                                Ver detalhes e impacto
                                            </AccordionTrigger>
                                            <AccordionContent className="bg-gray-50 p-4 rounded-lg text-sm text-gray-600 space-y-2">
                                                <p><strong>Impacto na Percepção:</strong></p>
                                                <ul className="list-disc pl-5 space-y-1">
                                                    <li><strong>Instantâneo:</strong> Bom para suporte técnico, mas deixa claro que é um robô.</li>
                                                    <li><strong>Moderado (Recomendado):</strong> Simula o tempo real de leitura e digitação de um humano. Aumenta a confiança.</li>
                                                    <li><strong>Lento:</strong> Útil para vendas complexas, parecer que está "consultando o sistema".</li>
                                                </ul>
                                            </AccordionContent>
                                        </AccordionItem>

                                        <div className="h-px bg-gray-100 my-6" />

                                        {/* BURSTINESS */}
                                        <AccordionItem value="burstiness" className="border-b-0 space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div className="space-y-1">
                                                    <label className="text-base font-semibold text-gray-900">Quebra de Mensagens (Burstiness)</label>
                                                    <p className="text-sm text-gray-500">Divide textos longos em vários balões curtos, como no WhatsApp real.</p>
                                                </div>
                                                <Select
                                                    value={dna.chronemics.burstiness}
                                                    onValueChange={(v) => updateDna('chronemics', 'burstiness', v)}
                                                >
                                                    <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="NONE">🤖 Não dividir</SelectItem>
                                                        <SelectItem value="LOW">🔹 Baixa</SelectItem>
                                                        <SelectItem value="MEDIUM">✨ Média (Natural)</SelectItem>
                                                        <SelectItem value="HIGH">💥 Alta (Dinâmico)</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <AccordionTrigger className="text-sm text-blue-600 hover:text-blue-700 py-2">
                                                Ver simulação visual
                                            </AccordionTrigger>
                                            <AccordionContent className="bg-gray-50 p-4 rounded-lg space-y-4">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="border border-gray-200 bg-white p-3 rounded-lg">
                                                        <p className="text-xs font-semibold text-gray-400 mb-2 uppercase">Sem Quebra (Robótico)</p>
                                                        <div className="bg-gray-100 p-2 rounded-r-lg rounded-bl-lg text-sm text-gray-800">
                                                            Oi João, tudo bem? Vi que você tem interesse no plano. Podemos agendar uma call amanhã às 14h para conversar melhor?
                                                        </div>
                                                    </div>
                                                    <div className="border border-blue-100 bg-blue-50/50 p-3 rounded-lg">
                                                        <p className="text-xs font-semibold text-blue-400 mb-2 uppercase">Com Quebra (Humano)</p>
                                                        <div className="space-y-1">
                                                            <div className="bg-white border border-gray-100 p-2 rounded-r-lg rounded-bl-lg text-sm text-gray-800 w-fit">
                                                                Oi João, tudo bem?
                                                            </div>
                                                            <div className="bg-white border border-gray-100 p-2 rounded-r-lg rounded-bl-lg text-sm text-gray-800 w-fit">
                                                                Vi seu interesse no plano 👀
                                                            </div>
                                                            <div className="bg-white border border-gray-100 p-2 rounded-r-lg rounded-bl-lg text-sm text-gray-800 w-fit">
                                                                Bora agendar um papo amanhã 14h?
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </AccordionContent>
                                        </AccordionItem>

                                    </Accordion>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* --- SAFETY & GUARDRAILS --- */}
                        <TabsContent value="safety" className="mt-6">
                            <Card className="border-none shadow-md bg-red-50/50">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-red-900">
                                        <Activity className="h-5 w-5 text-red-600" />
                                        Segurança & Guardrails
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-red-100">
                                        <div className="space-y-1">
                                            <label className="text-sm font-medium text-gray-900">Transbordo Automático por Frustração</label>
                                            <p className="text-xs text-gray-500">
                                                Monitora sentimento negativo. Se o cliente ficar irritado, o agente para e pede humano.
                                            </p>
                                        </div>
                                        <Switch
                                            checked={dna.safety?.handoff_on_frustration !== false} // Default true
                                            onCheckedChange={(c) => updateDna('safety', 'handoff_on_frustration', c)}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-900">Tópicos Proibidos</label>
                                        <Textarea
                                            placeholder="Ex: Política, Religião, Concorrente X..."
                                            value={dna.safety?.prohibited_topics?.join(', ') || ''}
                                            onChange={(e) => {
                                                const topics = e.target.value.split(',').map(t => t.trim()).filter(Boolean);
                                                updateDna('safety', 'prohibited_topics', topics);
                                            }}
                                            className="bg-white"
                                        />
                                        <p className="text-xs text-gray-500">Separe os temas por vírgula. O agente se recusará a falar sobre isso.</p>
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
