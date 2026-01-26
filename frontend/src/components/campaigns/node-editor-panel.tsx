import React, { useEffect, useState } from 'react';
import { Node } from '@xyflow/react';
import { X, Save, Settings, AlertTriangle, MessageSquare, Clock, Split, GitBranch, ArrowRight, Flag, Brain, Bot, MousePointerClick, Hourglass, CornerUpRight, ExternalLink, Users, CheckCircle2, XCircle, Archive, Megaphone, Globe, Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/forms/select";
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/forms/radio-group";

// Services
import { wahaService } from '@/services/waha';
import { agentService } from '@/services/agentService';
import { campaignService } from '@/services/campaign';

interface NodeEditorPanelProps {
    selectedNode: Node | null;
    onClose: () => void;
    onUpdateNode: (nodeId: string, data: any) => void;
}

const ANIMATION_VARIANTS = {
    hidden: { opacity: 0, x: 50 },
    visible: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 300, damping: 30 } },
    exit: { opacity: 0, x: 50, transition: { duration: 0.2 } }
};

export function NodeEditorPanel({ selectedNode, onClose, onUpdateNode }: NodeEditorPanelProps) {
    const [formData, setFormData] = useState<any>({});

    // Remote Data State
    const [sessions, setSessions] = useState<any[]>([]);
    const [agents, setAgents] = useState<any[]>([]);
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [flowNodes, setFlowNodes] = useState<any[]>([]); // For Goto node selection

    // Load Data Effect
    useEffect(() => {
        if (selectedNode) {
            setFormData({ ...selectedNode.data });
            const type = selectedNode.type;

            if (type === 'trigger') loadSessions();
            if (['agent', 'agentic', 'qualification', 'outreach', 'objection'].includes(type || '')) loadAgents();
            if (['goto_campaign', 'handoff'].includes(type || '')) loadCampaigns();
        }
    }, [selectedNode?.id]);

    // Auto-Save Effect
    useEffect(() => {
        if (!selectedNode) return;
        const timer = setTimeout(() => onUpdateNode(selectedNode.id, formData), 400);
        return () => clearTimeout(timer);
    }, [formData, selectedNode?.id]);

    const loadSessions = async () => {
        try { const data = await wahaService.getSessions(true); setSessions(data || []); } catch (e) { console.error(e); }
    };
    const loadAgents = async () => {
        try { const data = await agentService.list(); setAgents(data || []); } catch (e) { console.error(e); }
    };
    const loadCampaigns = async () => {
        try { const data = await campaignService.list(); setCampaigns(data || []); } catch (e) { console.error(e); }
    };

    const handleChange = (key: string, value: any) => {
        setFormData((prev: any) => ({ ...prev, [key]: value }));
    };

    if (!selectedNode) return null;

    const type = selectedNode.type;

    return (
        <AnimatePresence>
            <motion.div
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={ANIMATION_VARIANTS}
                className="absolute right-4 top-20 bottom-4 w-96 bg-white/80 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl flex flex-col overflow-hidden z-50 ring-1 ring-black/5"
            >
                {/* Header */}
                <div className="p-5 border-b border-gray-100/50 bg-white/50 flex items-center justify-between backdrop-blur-md">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${getNodeColor(type)} bg-opacity-10 text-opacity-100`}>
                            {getNodeIcon(type)}
                        </div>
                        <div className="flex flex-col">
                            <span className="font-semibold text-sm text-gray-900 tracking-tight">Configuração</span>
                            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider text-left">{type?.replace('_', ' ')}</span>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-gray-100/50 transition-colors" onClick={onClose}>
                        <X className="size-4 text-gray-500" />
                    </Button>
                </div>

                <ScrollArea className="flex-1 p-6">
                    <div className="space-y-8">
                        {/* Common: Label */}
                        <div className="space-y-3">
                            <Label className="text-xs font-semibold text-gray-500 uppercase tracking-widest pl-1">Nome do Node</Label>
                            <Input
                                value={formData.label || ''}
                                onChange={(e) => handleChange('label', e.target.value)}
                                placeholder="Dê um nome a este passo..."
                                className="h-11 bg-white/50 border-gray-200 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all rounded-xl font-medium text-gray-900 placeholder:text-gray-400"
                            />
                        </div>

                        <Separator className="bg-gradient-to-r from-transparent via-gray-200 to-transparent" />

                        {/* --- TRIGGER NODE --- */}
                        {type === 'trigger' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100/50 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label className="text-sm font-medium text-gray-900">Modo Triagem Global</Label>
                                            <p className="text-[10px] text-gray-500">Captura todas as mensagens sem filtros</p>
                                        </div>
                                        <Switch
                                            checked={formData.isTriage || false}
                                            onCheckedChange={(c) => handleChange('isTriage', c)}
                                            className="data-[state=checked]:bg-blue-600"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs text-gray-500 pl-1">Sessão WhatsApp</Label>
                                    <Select value={formData.sessionName || ''} onValueChange={(v) => handleChange('sessionName', v)}>
                                        <SelectTrigger className="h-11 rounded-xl bg-white/50 border-gray-200"><SelectValue placeholder="Selecione a sessão..." /></SelectTrigger>
                                        <SelectContent className="rounded-xl border-gray-100 shadow-lg">
                                            {sessions.map(s => <SelectItem key={s.name} value={s.name}>{s.name} <span className="text-gray-400 ml-2 text-xs">({s.status})</span></SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-xs text-gray-500 pl-1">Fontes Permitidas</Label>
                                    <p className="text-[10px] text-gray-400 pl-1">Deixe vazio para aceitar todas as fontes</p>
                                    <ToggleGroup
                                        type="multiple"
                                        variant="outline"
                                        value={formData.allowedSources || []}
                                        onValueChange={(val) => handleChange('allowedSources', val)}
                                        className="justify-start flex-wrap gap-2"
                                    >
                                        {['inbound', 'manual', 'apify', 'webform', 'import'].map(source => (
                                            <ToggleGroupItem
                                                key={source}
                                                value={source}
                                                aria-label={`Toggle ${source}`}
                                                className="h-8 px-3 text-xs capitalize data-[state=on]:bg-blue-100 data-[state=on]:text-blue-700 data-[state=on]:border-blue-200"
                                            >
                                                {source}
                                            </ToggleGroupItem>
                                        ))}
                                    </ToggleGroup>
                                </div>
                            </div>
                        )}

                        {/* --- DELAY NODE --- */}
                        {type === 'delay' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="p-6 rounded-2xl bg-amber-50/50 border border-amber-100/50 flex flex-col items-center justify-center space-y-4">
                                    <Clock className="w-8 h-8 text-amber-500/80" />
                                    <div className="flex items-end gap-3 w-full justify-center">
                                        <div className="space-y-1">
                                            <Input
                                                type="number"
                                                min="0"
                                                value={formData.delayValue || formData.duration || 0}
                                                onChange={(e) => handleChange('delayValue', e.target.value)}
                                                className="w-24 text-center text-3xl font-bold h-16 rounded-xl border-amber-200/50 bg-white/80 focus:ring-amber-500/20 text-gray-900"
                                            />
                                            <p className="text-[10px] text-center text-amber-600/70 font-medium tracking-wide">QUANTIDADE</p>
                                        </div>

                                        <div className="space-y-1">
                                            <Select value={formData.delayUnit || formData.unit || 'm'} onValueChange={(v) => handleChange('delayUnit', v)}>
                                                <SelectTrigger className="w-28 h-16 rounded-xl border-amber-200/50 bg-white/80 focus:ring-amber-500 text-lg font-medium justify-center"><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="s">Segundos</SelectItem>
                                                    <SelectItem value="m">Minutos</SelectItem>
                                                    <SelectItem value="h">Horas</SelectItem>
                                                    <SelectItem value="d">Dias</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <p className="text-[10px] text-center text-amber-600/70 font-medium tracking-wide">UNIDADE</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* --- SPLIT NODE --- */}
                        {type === 'split' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center px-1">
                                        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">Caminho A: {formData.variantA_percent ?? 50}%</span>
                                        <span className="text-xs font-bold text-pink-600 bg-pink-50 px-2 py-1 rounded">Caminho B: {100 - (formData.variantA_percent ?? 50)}%</span>
                                    </div>
                                    <Slider
                                        defaultValue={[formData.variantA_percent ?? 50]}
                                        max={100}
                                        step={1}
                                        onValueChange={(vals) => handleChange('variantA_percent', vals[0])}
                                        className="py-4"
                                    />
                                    <p className="text-xs text-center text-gray-400">Distribui o tráfego aleatoriamente por porcentagem</p>
                                </div>
                            </div>
                        )}

                        {/* --- ACTION NODE --- */}
                        {(type === 'action' || type === 'broadcast') && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="space-y-2">
                                    <Label className="text-xs text-gray-500 pl-1">Tipo de Ação</Label>
                                    <Select value={formData.actionType || 'message'} onValueChange={(v) => handleChange('actionType', v)}>
                                        <SelectTrigger className="h-11 rounded-xl bg-white/50"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="message">Enviar Mensagem</SelectItem>
                                            <SelectItem value="update_tag">Adicionar Tag</SelectItem>
                                            <SelectItem value="remove_tag">Remover Tag</SelectItem>
                                            <SelectItem value="update_status">Atualizar Status</SelectItem>
                                            <SelectItem value="webhook">Chamar Webhook</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Message Content */}
                                {(formData.actionType === 'message' || !formData.actionType) && (
                                    <div className="space-y-3 animate-in fade-in">
                                        <Label className="text-xs text-gray-500 pl-1">Conteúdo da Mensagem</Label>
                                        <Textarea
                                            rows={4}
                                            value={formData.messageTemplate || formData.messageContent || ''}
                                            onChange={(e) => handleChange('messageTemplate', e.target.value)}
                                            placeholder="Olá {{name}}, tudo bem?"
                                            className="bg-white/50 border-gray-200 text-sm resize-none rounded-xl"
                                        />
                                        <div className="flex items-center justify-between">
                                            <p className="text-[10px] text-gray-400">Use {"{{name}}"} e {"{{company}}"} para variáveis</p>
                                            <div className="flex items-center gap-2">
                                                <Switch
                                                    id="spintax"
                                                    checked={formData.spintaxEnabled || false}
                                                    onCheckedChange={(c) => handleChange('spintaxEnabled', c)}
                                                />
                                                <Label htmlFor="spintax" className="text-xs text-gray-500">Spintax</Label>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Tag Name */}
                                {formData.actionType?.includes('tag') && (
                                    <div className="space-y-2 animate-in fade-in">
                                        <Label className="text-xs text-gray-500 pl-1">Nome da Tag</Label>
                                        <Input
                                            value={formData.tagPayload || ''}
                                            onChange={(e) => handleChange('tagPayload', e.target.value)}
                                            placeholder="ex: 'Interessado', 'VIP'"
                                            className="h-11 rounded-xl"
                                        />
                                    </div>
                                )}

                                {/* Status Update */}
                                {formData.actionType === 'update_status' && (
                                    <div className="space-y-2 animate-in fade-in">
                                        <Label className="text-xs text-gray-500 pl-1">Novo Status</Label>
                                        <Select value={formData.statusPayload || ''} onValueChange={(v) => handleChange('statusPayload', v)}>
                                            <SelectTrigger className="h-11 rounded-xl bg-white/50"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="new">Novo</SelectItem>
                                                <SelectItem value="contacted">Contatado</SelectItem>
                                                <SelectItem value="qualified">Qualificado</SelectItem>
                                                <SelectItem value="proposal">Proposta</SelectItem>
                                                <SelectItem value="won">Ganho</SelectItem>
                                                <SelectItem value="lost">Perdido</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}

                                {/* Webhook URL */}
                                {formData.actionType === 'webhook' && (
                                    <div className="space-y-2 animate-in fade-in">
                                        <Label className="text-xs text-gray-500 pl-1">URL do Webhook</Label>
                                        <Input
                                            value={formData.webhookUrl || ''}
                                            onChange={(e) => handleChange('webhookUrl', e.target.value)}
                                            placeholder="https://api.exemplo.com/webhook"
                                            className="h-11 rounded-xl font-mono text-sm"
                                        />
                                        <p className="text-[10px] text-gray-400">POST request com dados do lead</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* --- LOGIC NODE --- */}
                        {type === 'logic' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
                                    <div className="flex items-center gap-2">
                                        <GitBranch className="w-4 h-4 text-slate-600" />
                                        <Label className="text-sm font-semibold text-slate-900">Roteador Inteligente</Label>
                                    </div>
                                    <p className="text-[11px] text-gray-500 leading-tight">
                                        O LogicNode lê a intenção detectada pelo AgentNode anterior e roteia automaticamente.
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-xs text-gray-500 pl-1">Saídas Disponíveis</Label>
                                    <div className="space-y-2">
                                        {[
                                            { edge: 'interested', label: 'Interessado', color: 'bg-green-100 text-green-700 border-green-200' },
                                            { edge: 'not_interested', label: 'Não Interessado', color: 'bg-red-100 text-red-700 border-red-200' },
                                            { edge: 'question', label: 'Pergunta', color: 'bg-blue-100 text-blue-700 border-blue-200' },
                                            { edge: 'handoff', label: 'Transbordo', color: 'bg-orange-100 text-orange-700 border-orange-200' },
                                            { edge: 'default', label: 'Padrão (Else)', color: 'bg-gray-100 text-gray-700 border-gray-200' },
                                        ].map(item => (
                                            <div key={item.edge} className={`flex items-center justify-between px-3 py-2 rounded-lg border ${item.color}`}>
                                                <span className="text-xs font-medium">{item.label}</span>
                                                <span className="text-[10px] font-mono opacity-60">{item.edge}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <p className="text-[10px] text-gray-400 text-center pt-2">
                                        Conecte cada saída ao node correspondente no canvas
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* --- GOTO NODE --- */}
                        {type === 'goto' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="p-4 rounded-xl bg-cyan-50 border border-cyan-200 space-y-3">
                                    <div className="flex items-center gap-2">
                                        <CornerUpRight className="w-4 h-4 text-cyan-600" />
                                        <Label className="text-sm font-semibold text-cyan-900">Pular para Node</Label>
                                    </div>
                                    <p className="text-[11px] text-gray-500">
                                        Redireciona o fluxo para outro node dentro desta campanha.
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs text-gray-500 pl-1">ID do Node Destino</Label>
                                    <Input
                                        value={formData.targetNodeId || ''}
                                        onChange={(e) => handleChange('targetNodeId', e.target.value)}
                                        placeholder="ex: node_abc123"
                                        className="h-11 rounded-xl font-mono text-sm"
                                    />
                                    <p className="text-[10px] text-gray-400">
                                        Copie o ID do node alvo clicando nele no canvas
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* --- GOTO CAMPAIGN NODE --- */}
                        {type === 'goto_campaign' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 space-y-3">
                                    <div className="flex items-center gap-2">
                                        <ExternalLink className="w-4 h-4 text-indigo-600" />
                                        <Label className="text-sm font-semibold text-indigo-900">Transferir para Campanha</Label>
                                    </div>
                                    <p className="text-[11px] text-gray-500">
                                        Move o lead para outra campanha (ex: Triagem → Vendas).
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs text-gray-500 pl-1">Campanha Destino</Label>
                                    <Select value={formData.target_campaign_id || ''} onValueChange={(v) => handleChange('target_campaign_id', v)}>
                                        <SelectTrigger className="h-11 rounded-xl bg-white/50 border-gray-200">
                                            <SelectValue placeholder="Selecione a campanha..." />
                                        </SelectTrigger>
                                        <SelectContent className="max-h-64">
                                            {campaigns.map(c => (
                                                <SelectItem key={c.id} value={c.id}>
                                                    <span className="font-medium">{c.name}</span>
                                                    <span className="block text-[10px] text-gray-400">{c.mode}</span>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs text-gray-500 pl-1">Motivo (opcional)</Label>
                                    <Input
                                        value={formData.reason || ''}
                                        onChange={(e) => handleChange('reason', e.target.value)}
                                        placeholder="ex: qualificado_para_vendas"
                                        className="h-11 rounded-xl"
                                    />
                                </div>
                            </div>
                        )}

                        {/* --- HANDOFF NODE --- */}
                        {type === 'handoff' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 space-y-3">
                                    <div className="flex items-center gap-2">
                                        <Users className="w-4 h-4 text-rose-600" />
                                        <Label className="text-sm font-semibold text-rose-900">Transbordo</Label>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-xs text-gray-500 pl-1">Destino do Transbordo</Label>
                                    <RadioGroup
                                        value={formData.target || 'human'}
                                        onValueChange={(v) => handleChange('target', v)}
                                        className="space-y-2"
                                    >
                                        <div className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                                            <RadioGroupItem value="human" id="human" />
                                            <Label htmlFor="human" className="flex-1 cursor-pointer">
                                                <span className="font-medium text-sm">Humano</span>
                                                <span className="block text-[10px] text-gray-400">Transferir para atendente</span>
                                            </Label>
                                        </div>
                                        <div className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                                            <RadioGroupItem value="campaign" id="campaign" />
                                            <Label htmlFor="campaign" className="flex-1 cursor-pointer">
                                                <span className="font-medium text-sm">Campanha</span>
                                                <span className="block text-[10px] text-gray-400">Mover para outra campanha</span>
                                            </Label>
                                        </div>
                                    </RadioGroup>
                                </div>

                                {formData.target === 'campaign' && (
                                    <div className="space-y-2 animate-in fade-in">
                                        <Label className="text-xs text-gray-500 pl-1">Campanha Destino</Label>
                                        <Select value={formData.targetCampaignId || ''} onValueChange={(v) => handleChange('targetCampaignId', v)}>
                                            <SelectTrigger className="h-11 rounded-xl bg-white/50">
                                                <SelectValue placeholder="Selecione..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {campaigns.map(c => (
                                                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label className="text-xs text-gray-500 pl-1">Motivo do Transbordo</Label>
                                    <Input
                                        value={formData.reason || ''}
                                        onChange={(e) => handleChange('reason', e.target.value)}
                                        placeholder="ex: Solicitou falar com humano"
                                        className="h-11 rounded-xl"
                                    />
                                </div>

                                <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-100">
                                    <div>
                                        <Label className="text-sm font-medium text-gray-900">Resumo AI</Label>
                                        <p className="text-[10px] text-gray-500">Gerar resumo da conversa para o atendente</p>
                                    </div>
                                    <Switch
                                        checked={formData.enableSummary || false}
                                        onCheckedChange={(c) => handleChange('enableSummary', c)}
                                    />
                                </div>
                            </div>
                        )}

                        {/* --- CLOSING NODE --- */}
                        {type === 'closing' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="p-4 rounded-xl bg-red-50 border border-red-200 space-y-3">
                                    <div className="flex items-center gap-2">
                                        <Flag className="w-4 h-4 text-red-600" />
                                        <Label className="text-sm font-semibold text-red-900">Fechamento</Label>
                                    </div>
                                    <p className="text-[11px] text-gray-500">
                                        Define o status final do lead e encerra o fluxo.
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-xs text-gray-500 pl-1">Status Final</Label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {[
                                            { value: 'completed', label: 'Concluído', icon: CheckCircle2, color: 'bg-gray-100 text-gray-700 border-gray-300' },
                                            { value: 'won', label: 'Ganho', icon: CheckCircle2, color: 'bg-green-100 text-green-700 border-green-300' },
                                            { value: 'lost', label: 'Perdido', icon: XCircle, color: 'bg-red-100 text-red-700 border-red-300' },
                                            { value: 'archived', label: 'Arquivado', icon: Archive, color: 'bg-slate-100 text-slate-700 border-slate-300' },
                                        ].map(status => {
                                            const Icon = status.icon;
                                            const isSelected = formData.finalStatus === status.value;
                                            return (
                                                <button
                                                    key={status.value}
                                                    onClick={() => handleChange('finalStatus', status.value)}
                                                    className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${isSelected
                                                        ? `${status.color} ring-2 ring-offset-2 ring-gray-300`
                                                        : 'bg-white border-gray-200 hover:border-gray-300'
                                                        }`}
                                                >
                                                    <Icon className="w-4 h-4" />
                                                    <span className="text-sm font-medium">{status.label}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-100">
                                    <div>
                                        <Label className="text-sm font-medium text-gray-900">Limpar Variáveis</Label>
                                        <p className="text-[10px] text-gray-500">Remove dados temporários do lead</p>
                                    </div>
                                    <Switch
                                        checked={formData.clearVariables ?? true}
                                        onCheckedChange={(c) => handleChange('clearVariables', c)}
                                    />
                                </div>
                            </div>
                        )}

                        {/* --- AGENT / SDR NODES --- */}
                        {['agent', 'agentic', 'qualification', 'outreach', 'objection'].includes(type || '') && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="space-y-2">
                                    <Label className="text-xs text-gray-500 pl-1">Agente Ativo</Label>
                                    <Select value={formData.agentId || ''} onValueChange={(v) => handleChange('agentId', v)}>
                                        <SelectTrigger className="h-14 rounded-xl bg-white/50 border-gray-200">
                                            <div className="flex items-center gap-3">
                                                <div className="p-1.5 bg-indigo-50 rounded-lg">
                                                    <Bot className="w-5 h-5 text-indigo-600" strokeWidth={1.5} />
                                                </div>
                                                <div className="flex flex-col items-start">
                                                    <SelectValue placeholder="Escolha um agente..." />
                                                    <span className="text-[10px] text-gray-400">Define personalidade & conhecimento</span>
                                                </div>
                                            </div>
                                        </SelectTrigger>
                                        <SelectContent className="max-h-64">
                                            {agents.map(a => (
                                                <SelectItem key={a.id} value={a.id}>
                                                    <span className="font-medium">{a.name}</span>
                                                    <span className="block text-[10px] text-gray-400">{a.model}</span>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Qualification Specific: Critical Slots */}
                                {(type === 'qualification' || type === 'agent' || type === 'agentic') && (
                                    <div className="p-4 rounded-xl bg-green-50/50 border border-green-100 space-y-3">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Flag className="w-4 h-4 text-green-600" />
                                            <Label className="text-sm font-semibold text-green-900">Framework SDR (BANT/SPIN)</Label>
                                        </div>
                                        <p className="text-[11px] text-gray-500 leading-tight">
                                            Selecione os dados necessários para qualificar.
                                        </p>

                                        <div className="space-y-2 pt-2">
                                            <Label className="text-xs text-gray-500">Slots Críticos</Label>
                                            <ToggleGroup
                                                type="multiple"
                                                variant="outline"
                                                value={formData.criticalSlots || []}
                                                onValueChange={(val) => handleChange('criticalSlots', val)}
                                                className="justify-start flex-wrap gap-2"
                                            >
                                                {['budget', 'authority', 'need', 'timeline', 'solution'].map(slot => (
                                                    <ToggleGroupItem
                                                        key={slot}
                                                        value={slot}
                                                        aria-label={`Toggle ${slot}`}
                                                        className="h-8 px-3 text-xs capitalize data-[state=on]:bg-green-100 data-[state=on]:text-green-700 data-[state=on]:border-green-200 hover:bg-white hover:text-green-600"
                                                    >
                                                        {slot}
                                                    </ToggleGroupItem>
                                                ))}
                                            </ToggleGroup>
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label className="text-xs text-gray-500 pl-1">Instrução Extra (Opcional)</Label>
                                    <Textarea
                                        rows={4}
                                        value={formData.instruction_override || ''}
                                        onChange={(e) => handleChange('instruction_override', e.target.value)}
                                        placeholder="Contexto adicional para este passo específico..."
                                        className="bg-white/50 border-gray-200 text-sm resize-none rounded-xl focus:ring-indigo-500/10"
                                    />
                                </div>

                                {/* Product Configuration (New Feature) */}
                                <Separator className="bg-gray-100" />
                                <div className="space-y-4 pt-2 animate-in fade-in slide-in-from-bottom-1 delay-100">
                                    <div className="flex items-center gap-2">
                                        <Tag className="w-4 h-4 text-purple-600" />
                                        <Label className="text-sm font-semibold text-gray-900">Venda de Produto/Serviço</Label>
                                    </div>
                                    <p className="text-[11px] text-gray-500 leading-tight">
                                        Ensine o Agente sobre o que ele deve vender NESTE passo.
                                    </p>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <Label className="text-[10px] text-gray-400 uppercase">Nome do Item</Label>
                                            <Input
                                                value={formData.product?.name || ''}
                                                onChange={(e) => handleChange('product', { ...formData.product, name: e.target.value })}
                                                placeholder="ex: Troca de Óleo"
                                                className="h-9 text-xs bg-white/50"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-[10px] text-gray-400 uppercase">Preço</Label>
                                            <Input
                                                value={formData.product?.price || ''}
                                                onChange={(e) => handleChange('product', { ...formData.product, price: e.target.value })}
                                                placeholder="ex: R$ 150,00"
                                                className="h-9 text-xs bg-white/50"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <Label className="text-[10px] text-gray-400 uppercase">Argumento de Venda (Benefício)</Label>
                                        <Textarea
                                            rows={2}
                                            value={formData.product?.description || ''}
                                            onChange={(e) => handleChange('product', { ...formData.product, description: e.target.value })}
                                            placeholder="O que o cliente ganha com isso? (ex: Economia de combustível)"
                                            className="min-h-[60px] text-xs resize-none bg-white/50"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <Label className="text-[10px] text-gray-400 uppercase">Diferenciais (Separe por vírgula)</Label>
                                        <Input
                                            value={Array.isArray(formData.product?.differentials) ? formData.product.differentials.join(', ') : (formData.product?.differentials || '')}
                                            onChange={(e) => handleChange('product', { ...formData.product, differentials: e.target.value.split(',').map((s: string) => s.trim()) })}
                                            placeholder="Garantia estendida, Café grátis, Parcelamento em 10x..."
                                            className="h-9 text-xs bg-white/50"
                                        />
                                    </div>
                                </div>

                            </div>
                        )}
                    </div>
                </ScrollArea>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 bg-gray-50/50 backdrop-blur-sm flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-green-500/50 shadow-sm" />
                        <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Sync Ativo</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-[10px] text-gray-500 hover:text-gray-900 font-mono"
                            onClick={() => {
                                const nodeData = {
                                    id: selectedNode?.id,
                                    type: selectedNode?.type,
                                    position: selectedNode?.position,
                                    data: formData
                                };
                                navigator.clipboard.writeText(JSON.stringify(nodeData, null, 2));
                                // Simple visual feedback
                                const btn = document.activeElement as HTMLButtonElement;
                                const originalText = btn.innerText;
                                btn.innerText = '✓ Copiado!';
                                setTimeout(() => btn.innerText = originalText, 1500);
                            }}
                        >
                            📋 Exportar JSON
                        </Button>
                        <span className="text-[10px] font-mono text-gray-300">{selectedNode?.id?.slice(0, 8)}</span>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}


// Visual Helpers
function getNodeIcon(type: string | undefined) {
    switch (type) {
        case 'trigger': return <ArrowRight className="w-4 h-4 text-amber-600" />;
        case 'action': return <MousePointerClick className="w-4 h-4 text-blue-600" />;
        case 'broadcast': return <Megaphone className="w-4 h-4 text-orange-600" />;
        case 'delay': return <Hourglass className="w-4 h-4 text-amber-600" />;
        case 'split': return <Split className="w-4 h-4 text-pink-600" />;
        case 'logic': return <GitBranch className="w-4 h-4 text-slate-600" />;
        case 'goto': return <CornerUpRight className="w-4 h-4 text-cyan-600" />;
        case 'goto_campaign': return <ExternalLink className="w-4 h-4 text-indigo-600" />;
        case 'handoff': return <Users className="w-4 h-4 text-rose-600" />;
        case 'closing': return <Flag className="w-4 h-4 text-red-600" />;
        case 'qualification': return <Flag className="w-4 h-4 text-green-600" />;
        case 'agent': return <Bot className="w-4 h-4 text-purple-600" />;
        default: return <Settings className="w-4 h-4 text-gray-600" />;
    }
}

function getNodeColor(type: string | undefined) {
    switch (type) {
        case 'trigger': return 'text-amber-600 bg-amber-600';
        case 'action': return 'text-blue-600 bg-blue-600';
        case 'broadcast': return 'text-orange-600 bg-orange-600';
        case 'delay': return 'text-amber-600 bg-amber-600';
        case 'split': return 'text-pink-600 bg-pink-600';
        case 'logic': return 'text-slate-600 bg-slate-600';
        case 'goto': return 'text-cyan-600 bg-cyan-600';
        case 'goto_campaign': return 'text-indigo-600 bg-indigo-600';
        case 'handoff': return 'text-rose-600 bg-rose-600';
        case 'closing': return 'text-red-600 bg-red-600';
        case 'qualification': return 'text-green-600 bg-green-600';
        case 'agent': return 'text-purple-600 bg-purple-600';
        default: return 'text-gray-600 bg-gray-600';
    }
}
