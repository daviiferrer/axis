'use client';

import React from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { MessageSquare, Zap, Info, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BroadcastConfigProps {
    formData: any;
    onChange: (key: string, value: any) => void;
}

const DELAY_PRESETS = [
    { value: 10, label: '10s', desc: 'Rápido', color: 'text-red-500' },
    { value: 30, label: '30s', desc: 'Recomendado', color: 'text-green-600' },
    { value: 60, label: '1min', desc: 'Seguro', color: 'text-blue-600' },
    { value: 120, label: '2min', desc: 'Ultra seguro', color: 'text-blue-700' },
];

export function BroadcastConfig({ formData, onChange }: BroadcastConfigProps) {
    const delay = formData.delayBetweenLeads ?? 30;
    const batch = formData.batchSize ?? 20;
    const msgsPerHour = delay > 0 ? Math.floor(3600 / delay) : 999;

    return (
        <div className="space-y-6 pt-2">
            {/* Header / Info */}
            <div className="flex items-start gap-3 p-4 bg-sky-50 border border-sky-100 rounded-xl">
                <div className="p-2 bg-sky-100 rounded-lg shrink-0">
                    <MessageSquare className="w-5 h-5 text-sky-600" />
                </div>
                <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-sky-900">Mensagem de Broadcast</h3>
                    <p className="text-xs text-sky-700 leading-relaxed">
                        Esta mensagem será enviada para todos os leads que passarem por este nó.
                        Use variáveis e spintax para evitar bloqueios do WhatsApp.
                    </p>
                </div>
            </div>

            {/* Message Content */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium text-gray-700">Conteúdo da Mensagem</Label>
                    <div className="flex items-center gap-2" title="Alterna variações de texto para simular naturalidade">
                        <Switch
                            id="spintax"
                            checked={formData.spintaxEnabled || false}
                            onCheckedChange={(c) => onChange('spintaxEnabled', c)}
                        />
                        <Label htmlFor="spintax" className="text-xs text-gray-500 cursor-pointer">Ativar Spintax</Label>
                    </div>
                </div>

                <div className="relative">
                    <Textarea
                        rows={6}
                        value={formData.messageTemplate || formData.messageContent || ''}
                        onChange={(e) => onChange('messageTemplate', e.target.value)}
                        placeholder="Olá {{name}}, temos uma novidade para você! {Confira|Veja} nossas ofertas."
                        className="bg-white border-gray-200 shadow-sm text-sm resize-none rounded-xl focus-visible:ring-1 focus-visible:ring-sky-500 font-normal leading-relaxed p-4"
                    />
                    <div className="absolute bottom-3 right-3 text-[10px] text-gray-400 font-mono bg-white/50 px-2 py-0.5 rounded-full border border-gray-100">
                        {(formData.messageTemplate || '').length} chars
                    </div>
                </div>

                {/* Variables Helper */}
                <div className="flex flex-wrap gap-2 pt-1">
                    <span className="text-[10px] text-gray-400 py-1">Variáveis:</span>
                    {['{{name}}', '{{phone}}', '{{email}}', '{{date}}'].map(v => (
                        <button
                            key={v}
                            onClick={() => {
                                const current = formData.messageTemplate || '';
                                onChange('messageTemplate', current + ' ' + v);
                            }}
                            className="text-[10px] bg-gray-50 border border-gray-200 text-gray-600 px-2 py-1 rounded-md hover:bg-gray-100 hover:border-gray-300 transition-colors font-mono"
                        >
                            {v}
                        </button>
                    ))}
                </div>
            </div>

            {/* Spintax Tips */}
            {formData.spintaxEnabled && (
                <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg flex gap-2 items-start animate-in fade-in slide-in-from-top-1">
                    <Zap className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                        <p className="text-xs font-medium text-amber-800">Dica de Spintax</p>
                        <p className="text-[11px] text-amber-700">
                            Use <code>{`{Olá|Oi|E aí}`}</code> para variar a saudação. Isso aumenta a segurança do número.
                        </p>
                    </div>
                </div>
            )}

            {/* ════════════════════════════════ */}
            {/* RATE LIMITING (per-node)         */}
            {/* ════════════════════════════════ */}

            <div className="flex items-center gap-3 pt-1">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Shield className="w-3 h-3" />
                    Controle de Disparo
                </span>
                <div className="flex-1 h-px bg-gray-200" />
            </div>

            <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl space-y-4">
                {/* Info */}
                <div className="flex items-start gap-2">
                    <Info className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-gray-500 leading-relaxed">
                        Controla a velocidade do disparo em massa. <strong>Não afeta</strong> a velocidade de resposta do agente AI para mensagens recebidas.
                    </p>
                </div>

                {/* Delay Between Leads */}
                <div className="space-y-2">
                    <Label className="text-xs font-semibold text-gray-700">Intervalo entre mensagens</Label>
                    <div className="grid grid-cols-4 gap-1.5">
                        {DELAY_PRESETS.map(preset => (
                            <button
                                key={preset.value}
                                type="button"
                                onClick={() => onChange('delayBetweenLeads', preset.value)}
                                className={cn(
                                    'py-2 px-1 rounded-lg text-center transition-all duration-200 cursor-pointer border',
                                    delay === preset.value
                                        ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20'
                                        : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300'
                                )}
                            >
                                <div className="text-xs font-bold">{preset.label}</div>
                                <div className={cn(
                                    "text-[9px] mt-0.5",
                                    delay === preset.value ? "text-blue-200" : preset.color
                                )}>
                                    {preset.desc}
                                </div>
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-400 shrink-0">Customizado:</span>
                        <Input
                            type="number"
                            min={5}
                            max={300}
                            value={delay}
                            onChange={(e) => onChange('delayBetweenLeads', Math.max(5, parseInt(e.target.value) || 30))}
                            className="w-16 h-7 text-center text-xs rounded-md"
                        />
                        <span className="text-[10px] text-gray-400">seg</span>
                    </div>
                </div>

                {/* Batch Size */}
                <div className="space-y-2">
                    <Label className="text-xs font-semibold text-gray-700">Leads por ciclo</Label>
                    <div className="flex items-center gap-3">
                        <input
                            type="range"
                            min={5}
                            max={50}
                            step={5}
                            value={batch}
                            onChange={(e) => onChange('batchSize', parseInt(e.target.value))}
                            className="flex-1 h-1.5 bg-gray-200 rounded-full appearance-none cursor-pointer accent-blue-600"
                        />
                        <div className="w-10 h-7 flex items-center justify-center bg-blue-50 rounded-md text-xs font-bold text-blue-700">
                            {batch}
                        </div>
                    </div>
                </div>

                {/* Throughput Estimate */}
                <div className="flex items-center justify-between px-3 py-2 bg-white rounded-lg border border-gray-100">
                    <span className="text-[10px] text-gray-500">Velocidade estimada:</span>
                    <span className="text-xs font-bold text-gray-800">
                        ~{msgsPerHour} msgs/hora
                    </span>
                </div>

                {delay < 30 && (
                    <p className="text-[10px] text-red-500 font-medium flex items-center gap-1">
                        ⚠️ Intervalo curto — risco de ban no WhatsApp. Recomendamos 30s ou mais.
                    </p>
                )}
            </div>
        </div>
    );
}
