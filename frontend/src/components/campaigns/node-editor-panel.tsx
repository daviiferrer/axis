import React, { useEffect, useState } from 'react';
import { Node } from '@xyflow/react';
import { X, Save, Settings, AlertTriangle, MessageSquare, Clock, Split, GitBranch, ArrowRight, Flag, Brain, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/forms/select"
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

// Services
import { wahaService } from '@/services/waha';
import { agentService } from '@/services/agentService';
import { campaignService } from '@/services/campaign';

interface NodeEditorPanelProps {
    selectedNode: Node | null;
    onClose: () => void;
    onUpdateNode: (nodeId: string, data: any) => void;
}

export function NodeEditorPanel({ selectedNode, onClose, onUpdateNode }: NodeEditorPanelProps) {
    const [formData, setFormData] = useState<any>({});

    // Dynamic Options State
    const [sessions, setSessions] = useState<any[]>([]);
    const [agents, setAgents] = useState<any[]>([]);
    const [campaigns, setCampaigns] = useState<any[]>([]);

    // 1. Load Data on Selection Change (Only when ID changes)
    useEffect(() => {
        if (selectedNode) {
            // Only reset form if it's a DIFFERENT node or first load
            // We use a ref mechanism or just ID check if we had prev ID.
            // Simplified: We assume if selectedNode.id matches current formData.id (if we stored it), it's an update.
            // But formData usually only has data. 
            // Let's rely on parent passing a stable object or just checking ID.

            // For now, we initialize. If we auto-save, parent updates selectedNode.
            // To avoid loop, we check deep equality or just rely on the fact that we controlled the update.
            // Better strategy: Only setFormData if selectedNode.id !== lastLoadedId.
            // But we don't have lastLoadedId in state. 
            // We will do a simple check: IF existing form data matches new node data roughly, don't reset.
            setFormData({ ...selectedNode.data });

            const type = selectedNode.type;
            if (type === 'trigger') loadSessions();
            if (['agent', 'agentic', 'qualification', 'outreach', 'objection', 'handoff'].includes(type || '')) loadAgents();
            if (type === 'goto_campaign' || type === 'handoff') loadCampaigns();
        }
    }, [selectedNode?.id]); // CRITICAL: Only reload when Node ID changes

    // 2. Auto-Save Logic (Debounced)
    useEffect(() => {
        if (!selectedNode) return;

        const timer = setTimeout(() => {
            // Check if dirty? (Optimization)
            onUpdateNode(selectedNode.id, formData);
        }, 500); // 500ms debounce

        return () => clearTimeout(timer);
    }, [formData, selectedNode?.id]); // Run when form changes

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
        <div className="absolute right-4 top-20 bottom-4 w-96 bg-white/95 backdrop-blur-sm rounded-xl border border-gray-200 shadow-xl flex flex-col overflow-hidden animate-in slide-in-from-right-10 z-50">
            {/* Minimal Header */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Settings className="size-4 text-gray-500" strokeWidth={1.5} />
                    <span className="font-medium text-sm text-gray-900 tracking-tight">
                        Configuração
                    </span>
                    <Badge variant="secondary" className="text-[10px] font-normal text-gray-500 bg-gray-100">
                        {type}
                    </Badge>
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6 opacity-70 hover:opacity-100" onClick={onClose}>
                    <X className="size-4" strokeWidth={1.5} />
                </Button>
            </div>

            <ScrollArea className="flex-1 p-5">
                <div className="space-y-6">
                    {/* Label Field (Clean) */}
                    <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Rótulo</Label>
                        <Input
                            value={formData.label || ''}
                            onChange={(e) => handleChange('label', e.target.value)}
                            placeholder="Nome deste passo"
                            className="font-medium text-gray-900 border-gray-200 focus:border-gray-400 focus:ring-0 transition-all bg-transparent"
                        />
                    </div>

                    <Separator className="bg-gray-100" />

                    {/* --- TRIGGER NODE --- */}
                    {type === 'trigger' && (
                        <div className="space-y-5">
                            <div className="flex items-center justify-between">
                                <Label className="text-sm font-medium text-gray-900">Modo Triagem Global</Label>
                                <Switch
                                    checked={formData.isTriage || false}
                                    onCheckedChange={(c) => handleChange('isTriage', c)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs text-gray-500">Sessão WhatsApp Conectada</Label>
                                <Select
                                    value={formData.sessionName || ''}
                                    onValueChange={(v) => handleChange('sessionName', v)}
                                >
                                    <SelectTrigger className="border-gray-200">
                                        <SelectValue placeholder="Selecione a sessão..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {sessions.map(s => (
                                            <SelectItem key={s.name} value={s.name}>{s.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    )}

                    {/* --- AGENT NODES (Consolidated) --- */}
                    {['agent', 'agentic'].includes(type || '') && (
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <Label className="text-xs text-gray-500">Agente Responsável</Label>
                                <Select
                                    value={formData.agentId || ''}
                                    onValueChange={(v) => handleChange('agentId', v)}
                                >
                                    <SelectTrigger className="h-12 border-gray-200">
                                        <div className="flex items-center gap-3 text-left">
                                            <div className="p-1 bg-gray-100 rounded">
                                                <Bot className="w-4 h-4 text-gray-600" strokeWidth={1.5} />
                                            </div>
                                            <div className="flex flex-col">
                                                <SelectValue placeholder="Selecione o agente..." />
                                                <span className="text-[10px] text-gray-400 font-normal">Define a personalidade e cérebro</span>
                                            </div>
                                        </div>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {agents.map(a => (
                                            <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs text-gray-500">Contexto Adicional (Opcional)</Label>
                                <Textarea
                                    rows={3}
                                    value={formData.instruction_override || ''}
                                    onChange={(e) => handleChange('instruction_override', e.target.value)}
                                    placeholder="Instruções específicas para este momento da conversa..."
                                    className="bg-gray-50/50 border-gray-200 text-sm resize-none"
                                />
                            </div>
                        </div>
                    )}

                    {/* --- BROADCAST NODE --- */}
                    {type === 'broadcast' && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-xs text-gray-500">Mensagem de Disparo</Label>
                                <Textarea
                                    rows={6}
                                    value={formData.messageTemplate || ''}
                                    onChange={(e) => handleChange('messageTemplate', e.target.value)}
                                    placeholder="Olá {{name}}, tudo bem?"
                                    className="bg-gray-50/50 border-gray-200 resize-y"
                                />
                                <div className="flex gap-2">
                                    <Badge variant="outline" className="text-[10px] font-mono bg-white cursor-pointer hover:bg-gray-50">{`{{name}}`}</Badge>
                                    <Badge variant="outline" className="text-[10px] font-mono bg-white cursor-pointer hover:bg-gray-50">{`{{company}}`}</Badge>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- DELAY NODE --- */}
                    {type === 'delay' && (
                        <div className="space-y-4">
                            <Label className="text-sm font-medium">Duração</Label>
                            <div className="flex gap-2">
                                <Input
                                    type="number"
                                    min="0"
                                    value={formData.delayValue || formData.duration || 0}
                                    onChange={(e) => handleChange('delayValue', e.target.value)}
                                    className="w-24 text-lg font-mono"
                                />
                                <Select
                                    value={formData.delayUnit || formData.unit || 'm'}
                                    onValueChange={(v) => handleChange('delayUnit', v)}
                                >
                                    <SelectTrigger className="flex-1">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="s">Segundos</SelectItem>
                                        <SelectItem value="m">Minutos</SelectItem>
                                        <SelectItem value="h">Horas</SelectItem>
                                        <SelectItem value="d">Dias</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    )}

                    {/* --- ACTION & TAGS --- */}
                    {type === 'action' && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-xs text-gray-500">Tipo de Ação</Label>
                                <Select
                                    value={formData.actionType || 'none'}
                                    onValueChange={(v) => handleChange('actionType', v)}
                                >
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="update_tag">Adicionar Tag</SelectItem>
                                        <SelectItem value="update_status">Atualizar Status</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            {formData.actionType === 'update_tag' && (
                                <Input
                                    value={formData.tagPayload || ''}
                                    onChange={(e) => handleChange('tagPayload', e.target.value)}
                                    placeholder="Nome da Tag"
                                />
                            )}
                        </div>
                    )}
                </div>
            </ScrollArea>

            {/* Footer with minimal Auto-save indicator */}
            <div className="p-3 bg-gray-50 border-t border-gray-100 flex justify-center">
                <span className="text-[10px] text-gray-400 flex items-center gap-1.5 uppercase tracking-widest font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    Auto-Save Ativo
                </span>
            </div>
        </div>
    );
}
