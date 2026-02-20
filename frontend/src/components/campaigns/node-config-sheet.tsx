'use client'

import React, { useState, useEffect, useCallback } from 'react';
import { Node, Edge } from '@xyflow/react';
import {
    Zap, Clock, GitBranch, MessageSquare, CornerUpRight, ExternalLink,
    Users, Flag, Bot, Split, RefreshCw, Info
} from 'lucide-react';

import {
    Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

import { wahaService } from '@/services/waha';
import { agentService, Agent } from '@/services/agentService';
import { campaignService } from '@/services/campaign';
import {
    TriggerConfig, DelayConfig, SplitConfig, ActionConfig,
    BroadcastConfig, LogicConfig, GotoConfig, GotoCampaignConfig,
    HandoffConfig, ClosingConfig, AgentConfig
} from './node-configs';
import { FollowUpConfig } from './node-configs/followup-config';

// ============================================================================
// Types & Constants
// ============================================================================

interface NodeConfigSheetProps {
    selectedNode: Node | null;
    onClose: () => void;
    onUpdateNode: (id: string, data: any) => void;
    nodes: Node[];
    edges: Edge[];
    onNavigate: (nodeId: string) => void;
}

const AGENT_TYPES = ['agent', 'agentic'];

const NODE_META: Record<string, { icon: React.ElementType; color: string; bgColor: string; label: string }> = {
    trigger: { icon: Zap, color: 'text-amber-600', bgColor: 'bg-amber-50', label: 'Gatilho Inicial' },
    delay: { icon: Clock, color: 'text-amber-600', bgColor: 'bg-amber-50', label: 'Delay' },
    split: { icon: Split, color: 'text-pink-600', bgColor: 'bg-pink-50', label: 'Split A/B' },
    action: { icon: MessageSquare, color: 'text-blue-600', bgColor: 'bg-blue-50', label: 'Ação' },
    broadcast: { icon: MessageSquare, color: 'text-sky-600', bgColor: 'bg-sky-50', label: 'Broadcast' },
    logic: { icon: GitBranch, color: 'text-slate-600', bgColor: 'bg-slate-50', label: 'Condição IF/ELSE' },
    goto: { icon: CornerUpRight, color: 'text-cyan-600', bgColor: 'bg-cyan-50', label: 'Goto' },
    goto_campaign: { icon: ExternalLink, color: 'text-indigo-600', bgColor: 'bg-indigo-50', label: 'Ir para Campanha' },
    handoff: { icon: Users, color: 'text-rose-600', bgColor: 'bg-rose-50', label: 'Transbordo' },
    closing: { icon: Flag, color: 'text-red-600', bgColor: 'bg-red-50', label: 'Fechamento' },
    agent: { icon: Bot, color: 'text-purple-600', bgColor: 'bg-purple-50', label: 'Agente IA' },
    agentic: { icon: Bot, color: 'text-purple-600', bgColor: 'bg-purple-50', label: 'Agente IA' },
    followup: { icon: RefreshCw, color: 'text-teal-600', bgColor: 'bg-teal-50', label: 'Follow-Up' },
};

// ============================================================================
// Tooltip Helper — inline tooltip for field labels
// ============================================================================

function FieldLabel({ label, tooltip }: { label: string; tooltip?: string }) {
    return (
        <div className="flex items-center gap-1.5">
            <Label className="text-sm font-medium">{label}</Label>
            {tooltip && (
                <TooltipProvider delayDuration={200}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Info size={13} className="text-gray-400 hover:text-gray-600 cursor-help transition-colors" />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-[260px] text-xs leading-relaxed">
                            {tooltip}
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            )}
        </div>
    );
}

// ============================================================================
// Agent-specific sidebar content with friendly tabs
// ============================================================================

function AgentSheetContent({
    formData,
    onChange,
    agents,
    onAgentsChange
}: {
    formData: any;
    onChange: (key: string, value: any) => void;
    agents: Agent[];
    onAgentsChange: () => void;
}) {
    return (
        <Tabs defaultValue="mind" className="flex-1 flex flex-col min-h-0">
            <TabsList className="grid grid-cols-4 mx-4 mt-2 shrink-0">
                <TabsTrigger value="mind" className="text-xs gap-1">🧠 Mente</TabsTrigger>
                <TabsTrigger value="collect" className="text-xs gap-1">📋 Coleta</TabsTrigger>
                <TabsTrigger value="voice" className="text-xs gap-1">🎤 Voz</TabsTrigger>
                <TabsTrigger value="advanced" className="text-xs gap-1">⚙️ Avançado</TabsTrigger>
            </TabsList>

            <ScrollArea className="flex-1 min-h-0">
                {/* ── Tab: Mente (Mind / Core) ──────────── */}
                <TabsContent value="mind" className="px-4 pb-6 space-y-5 mt-0">
                    <div className="space-y-4 pt-2">
                        {/* Existing AgentConfig already handles agent selection, model, prompt etc. */}
                        <AgentConfig
                            formData={formData}
                            onChange={onChange}
                            agents={agents}
                            onAgentsChange={onAgentsChange}
                        />
                    </div>
                </TabsContent>

                {/* ── Tab: Coleta (Data Collection / Slots) ─── */}
                <TabsContent value="collect" className="px-4 pb-6 space-y-5 mt-0">
                    <div className="space-y-4 pt-2">
                        <FieldLabel
                            label="Dados para Coletar"
                            tooltip="Informações que a IA deve tentar descobrir durante a conversa. Ela fará perguntas naturais para coletar esses dados."
                        />
                        <p className="text-xs text-muted-foreground -mt-2">
                            A IA coletará esses dados de forma natural na conversa, sem parecer um formulário.
                        </p>

                        {/* Slots are managed inside AgentConfig, but we re-render the relevant section */}
                        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/50 p-4">
                            <div className="space-y-3">
                                {formData.criticalSlots?.map((slot: string, i: number) => (
                                    <div key={i} className="flex items-center gap-2">
                                        <span className="px-2.5 py-1 rounded-lg bg-green-50 text-green-700 text-xs font-medium border border-green-100 capitalize">
                                            {slot}
                                        </span>
                                        <button
                                            onClick={() => {
                                                const next = formData.criticalSlots.filter((_: string, idx: number) => idx !== i);
                                                onChange('criticalSlots', next);
                                            }}
                                            className="text-gray-400 hover:text-red-500 text-xs transition-colors"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}
                                {(!formData.criticalSlots || formData.criticalSlots.length === 0) && (
                                    <p className="text-xs text-gray-400 text-center py-2">
                                        Nenhum dado configurado. Adicione na aba Mente → Agente.
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </TabsContent>

                {/* ── Tab: Voz (Voice) ──────────── */}
                <TabsContent value="voice" className="px-4 pb-6 space-y-5 mt-0">
                    <div className="space-y-4 pt-2">
                        <FieldLabel
                            label="Integração de Voz"
                            tooltip="Habilite para que a IA possa enviar e receber áudios no WhatsApp, tornando a conversa mais natural e humana."
                        />
                        <p className="text-xs text-muted-foreground -mt-2">
                            Quando ativado, a IA poderá enviar áudios e transcrever áudios recebidos.
                        </p>

                        <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4 text-center">
                            <p className="text-xs text-gray-500">
                                Configure a voz na aba Mente → Agente → seção Voz.
                            </p>
                        </div>
                    </div>
                </TabsContent>

                {/* ── Tab: Avançado (Advanced) ──────────── */}
                <TabsContent value="advanced" className="px-4 pb-6 space-y-5 mt-0">
                    <div className="space-y-4 pt-2">
                        <Collapsible defaultOpen={false}>
                            <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors w-full py-2">
                                <span className="text-xs">▶</span>
                                Configurações Técnicas
                            </CollapsibleTrigger>
                            <CollapsibleContent className="space-y-5 pt-3">
                                {/* Temperature */}
                                <div className="space-y-3">
                                    <FieldLabel
                                        label="Criatividade das Respostas"
                                        tooltip="Controla o quão criativa ou previsível a IA é. Baixa = respostas diretas e seguras. Alta = respostas variadas e criativas."
                                    />
                                    <div className="flex justify-between text-[10px] text-muted-foreground px-1">
                                        <span>🎯 Preciso</span>
                                        <span className="font-mono font-bold text-gray-700">{formData.temperature ?? 0.3}</span>
                                        <span>🎨 Criativo</span>
                                    </div>
                                    <Slider
                                        value={[formData.temperature ?? 0.3]}
                                        min={0}
                                        max={1}
                                        step={0.1}
                                        onValueChange={([v]) => onChange('temperature', v)}
                                        className="w-full"
                                    />
                                    <p className="text-[10px] text-muted-foreground">
                                        Para advocacia use 0.1-0.3. Para marketing use 0.5-0.7.
                                    </p>
                                </div>

                                <Separator />

                                {/* Typing Delay */}
                                <div className="space-y-3">
                                    <FieldLabel
                                        label="Velocidade de Resposta"
                                        tooltip="Adiciona uma pausa antes de enviar a resposta, simulando que alguém está digitando. Torna a conversa mais natural."
                                    />
                                    <div className="flex justify-between text-[10px] text-muted-foreground px-1">
                                        <span>⚡ Instantâneo</span>
                                        <span className="font-mono font-bold text-gray-700">{formData.typingDelay ?? 2}s</span>
                                        <span>🐢 Lento</span>
                                    </div>
                                    <Slider
                                        value={[formData.typingDelay ?? 2]}
                                        min={0}
                                        max={5}
                                        step={0.5}
                                        onValueChange={([v]) => onChange('typingDelay', v)}
                                        className="w-full"
                                    />
                                    <p className="text-[10px] text-muted-foreground">
                                        Respostas instantâneas parecem robóticas. 1-3 segundos é o ideal.
                                    </p>
                                </div>
                            </CollapsibleContent>
                        </Collapsible>
                    </div>
                </TabsContent>
            </ScrollArea>
        </Tabs>
    );
}

// ============================================================================
// Main Component: NodeConfigSheet
// ============================================================================

export function NodeConfigSheet({ selectedNode, onClose, onUpdateNode, nodes, edges, onNavigate }: NodeConfigSheetProps) {
    const [formData, setFormData] = useState<any>({});
    const [sessions, setSessions] = useState<any[]>([]);
    const [agents, setAgents] = useState<Agent[]>([]);
    const [campaigns, setCampaigns] = useState<any[]>([]);

    const type = selectedNode?.type || '';
    const meta = NODE_META[type] || { icon: Zap, color: 'text-gray-600', bgColor: 'bg-gray-50', label: type };
    const MetaIcon = meta.icon;
    const isAgentType = AGENT_TYPES.includes(type);

    // ── Load form data from node ──
    useEffect(() => {
        if (selectedNode) {
            setFormData({ ...selectedNode.data });
        }
    }, [selectedNode?.id]);

    // ── Side-effect data loaders ──
    useEffect(() => {
        if (type === 'trigger') {
            wahaService.getSessions().then(setSessions).catch(() => setSessions([]));
        }
    }, [type]);

    useEffect(() => {
        if (isAgentType) {
            agentService.list().then(setAgents).catch(() => setAgents([]));
        }
    }, [type]);

    useEffect(() => {
        if (type === 'goto_campaign' || type === 'handoff') {
            campaignService.listCampaigns().then((r: any) => setCampaigns(Array.isArray(r) ? r : r.data || [])).catch(() => setCampaigns([]));
        }
    }, [type]);

    const handleChange = useCallback((key: string, value: any) => {
        setFormData((prev: any) => {
            const next = { ...prev, [key]: value };
            if (selectedNode) onUpdateNode(selectedNode.id, next);
            return next;
        });
    }, [selectedNode, onUpdateNode]);

    const refreshAgents = useCallback(() => {
        agentService.list().then(setAgents).catch(() => { });
    }, []);

    // ── Render non-agent node config (reuse existing components) ──
    const renderGenericContent = () => {
        switch (type) {
            case 'trigger':
                return <TriggerConfig formData={formData} onChange={handleChange} sessions={sessions} />;
            case 'delay':
                return <DelayConfig formData={formData} onChange={handleChange} />;
            case 'split':
                return <SplitConfig formData={formData} onChange={handleChange} />;
            case 'action':
                return <ActionConfig formData={formData} onChange={handleChange} />;
            case 'broadcast':
                return <BroadcastConfig formData={formData} onChange={handleChange} />;
            case 'logic':
                return <LogicConfig formData={formData} onChange={handleChange} />;
            case 'goto':
                return <GotoConfig formData={formData} onChange={handleChange} />;
            case 'goto_campaign':
                return <GotoCampaignConfig formData={formData} onChange={handleChange} campaigns={campaigns} />;
            case 'handoff':
                return <HandoffConfig formData={formData} onChange={handleChange} campaigns={campaigns} />;
            case 'closing':
                return <ClosingConfig formData={formData} onChange={handleChange} />;
            case 'followup':
                return <FollowUpConfig formData={formData} onChange={handleChange} />;
            default:
                return (
                    <div className="text-center py-12 text-gray-400">
                        <p className="text-sm">Configuração não disponível para "{type}"</p>
                    </div>
                );
        }
    };

    return (
        <Sheet open={!!selectedNode} onOpenChange={(open) => { if (!open) onClose(); }}>
            <SheetContent
                side="right"
                className={cn(
                    "w-[480px] sm:max-w-[480px] p-0 flex flex-col",
                    "border-l border-gray-200/60"
                )}
            >
                {/* ── Header ── */}
                <SheetHeader className={cn(
                    "px-5 py-4 border-b border-gray-100",
                    "bg-gradient-to-r",
                    meta.bgColor,
                    "to-white"
                )}>
                    <div className="flex items-center gap-3">
                        <div className={cn(
                            "w-9 h-9 rounded-xl flex items-center justify-center",
                            meta.bgColor, meta.color
                        )}>
                            <MetaIcon size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <SheetTitle className="text-sm font-bold truncate">
                                {formData.label || meta.label}
                            </SheetTitle>
                            <SheetDescription className="text-[10px] uppercase tracking-widest font-bold text-gray-400">
                                Configuração do Nó
                            </SheetDescription>
                        </div>
                    </div>

                    {/* Node Name Input */}
                    <div className="mt-3 space-y-1.5">
                        <FieldLabel label="Nome do nó" tooltip="Um nome para identificar este passo no fluxo. Aparece no canvas." />
                        <Input
                            value={formData.label || ''}
                            onChange={(e) => handleChange('label', e.target.value)}
                            placeholder="Ex: Qualificar Lead"
                            className="h-9 text-sm bg-white/80"
                        />
                    </div>
                </SheetHeader>

                {/* ── Body ── */}
                <div className="flex-1 min-h-0 flex flex-col">
                    {isAgentType ? (
                        <AgentSheetContent
                            formData={formData}
                            onChange={handleChange}
                            agents={agents}
                            onAgentsChange={refreshAgents}
                        />
                    ) : (
                        <ScrollArea className="flex-1">
                            <div className="p-5">
                                {renderGenericContent()}
                            </div>
                        </ScrollArea>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}
