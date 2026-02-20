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
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

import { wahaService } from '@/services/waha';
import { agentService, Agent } from '@/services/agentService';
import { campaignService } from '@/services/campaign';
import {
    TriggerConfig, DelayConfig, SplitConfig, ActionConfig,
    BroadcastConfig, LogicConfig, GotoConfig, GotoCampaignConfig,
    HandoffConfig, ClosingConfig
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
// Tooltip Helper
// ============================================================================

function FieldLabel({ label, tooltip, className }: { label: string; tooltip?: string; className?: string }) {
    return (
        <div className={cn("flex items-center gap-1.5", className)}>
            <Label className="text-xs font-medium text-gray-700">{label}</Label>
            {tooltip && (
                <TooltipProvider delayDuration={200}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Info size={12} className="text-gray-400 hover:text-gray-600 cursor-help transition-colors shrink-0" />
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

import { AgentWizard } from './node-configs/agent-wizard'; // Import the new wizard

// ... (other imports)

// ============================================================================
// Agent-specific sidebar — now uses the AgentWizard (Vertical Accordion)
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
        <div className="flex-1 min-h-0 flex flex-col">
            <AgentWizard
                formData={formData}
                onChange={onChange}
                agents={agents}
                onAgentsChange={onAgentsChange}
            />
        </div>
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
                                Configuração
                            </SheetDescription>
                        </div>
                    </div>

                    {/* Node Name Input */}
                    <div className="mt-3 space-y-1.5">
                        <FieldLabel label="Nome do nó" tooltip="Identificação deste passo no fluxo. Aparece no canvas." />
                        <Input
                            value={formData.label || ''}
                            onChange={(e) => handleChange('label', e.target.value)}
                            placeholder="Ex: Qualificar Lead"
                            className="h-9 text-sm bg-white/80"
                        />
                    </div>
                </SheetHeader>

                {/* ── Body ── */}
                <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                    {isAgentType ? (
                        <ScrollArea className="h-full">
                            <div className="h-full">
                                <AgentSheetContent
                                    formData={formData}
                                    onChange={handleChange}
                                    agents={agents}
                                    onAgentsChange={refreshAgents}
                                />
                            </div>
                        </ScrollArea>
                    ) : (
                        <ScrollArea className="h-full">
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
