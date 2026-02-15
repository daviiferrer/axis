'use client'

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { toast } from "sonner"
import { profileService } from "@/services/profileService"
import { Save, Key, Lock, CheckCircle2, AlertTriangle, Zap, Bot, Box } from "lucide-react"

export default function ProfileSettingsPage() {
    return (
        <div className="max-w-4xl mx-auto p-6 space-y-8">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Configurações de Perfil</h1>
                <p className="text-gray-500">Gerencie suas chaves de API e preferências pessoais.</p>
            </div>

            <div className="grid gap-6">
                <ApiKeyCard
                    provider="gemini"
                    label="Google Gemini"
                    icon={Zap}
                    description="Necessário para a maioria dos agentes (Flash 2.5, Pro, etc)."
                    link="https://aistudio.google.com/app/apikey"
                    linkText="Gerar Chave no Google AI Studio"
                />

                <ApiKeyCard
                    provider="openai"
                    label="OpenAI (GPT-4)"
                    icon={Bot}
                    description="Opcional. Usado apenas se você selecionar modelos GPT."
                    link="https://platform.openai.com/api-keys"
                    linkText="Gerar Chave na OpenAI"
                />

                <ApiKeyCard
                    provider="anthropic"
                    label="Anthropic (Claude)"
                    icon={Box}
                    description="Opcional. Usado apenas para modelos Claude Sonnet/Opus."
                    link="https://console.anthropic.com/settings/keys"
                    linkText="Gerar Chave na Anthropic"
                />
            </div>
        </div>
    )
}

function ApiKeyCard({ provider, label, icon: Icon, description, link, linkText }: any) {
    const [apiKey, setApiKey] = useState('')
    const [hasKey, setHasKey] = useState(false)
    const [loading, setLoading] = useState(false)
    const [showInput, setShowInput] = useState(false)

    useEffect(() => {
        checkKey()
    }, [])

    const checkKey = async () => {
        try {
            const { hasKey } = await profileService.hasApiKey(provider)
            setHasKey(hasKey)
            if (!hasKey) setShowInput(true)
        } catch (error) {
            console.error(error)
        }
    }

    const handleSave = async () => {
        if (!apiKey || apiKey.length < 5) return toast.error("Chave muito curta")

        setLoading(true)
        try {
            await profileService.updateApiKey(provider, apiKey)
            toast.success(`${label} atualizado com sucesso!`)
            setHasKey(true)
            setApiKey('')
            setShowInput(false)
        } catch (error) {
            toast.error("Erro ao salvar chave")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card className="border shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                        <Icon className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                        <CardTitle className="text-lg font-semibold text-gray-900">{label}</CardTitle>
                        <CardDescription className="text-gray-500 mt-1">{description}</CardDescription>
                    </div>
                </div>
                {hasKey && (
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-full border border-green-100">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Ativo
                    </div>
                )}
            </CardHeader>
            <CardContent className="pt-6">
                {!showInput && hasKey ? (
                    <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg border border-gray-100">
                        <div className="flex items-center gap-2 text-gray-500 text-sm">
                            <Lock className="h-4 w-4" />
                            <span>Chave configurada e segura</span>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => setShowInput(true)}>
                            Alterar Chave
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Key className="h-4 w-4 text-gray-400" />
                            </div>
                            <Input
                                type="password"
                                placeholder={`Cole sua chave ${label} aqui...`}
                                className="pl-10"
                                value={apiKey}
                                onChange={e => setApiKey(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <a
                                href={link}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs text-blue-600 font-medium hover:underline flex items-center gap-1"
                            >
                                {linkText} ↗
                            </a>
                            <div className="flex gap-2">
                                {hasKey && (
                                    <Button variant="ghost" size="sm" onClick={() => setShowInput(false)}>
                                        Cancelar
                                    </Button>
                                )}
                                <Button size="sm" onClick={handleSave} disabled={loading || !apiKey}>
                                    {loading ? "Salvando..." : "Salvar Chave"}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
