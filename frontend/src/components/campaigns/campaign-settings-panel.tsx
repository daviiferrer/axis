'use client';

import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Clock, Globe, Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { campaignService, CampaignSettings } from '@/services/campaign';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface CampaignSettingsPanelProps {
    campaignId: string;
    open: boolean;
    onClose: () => void;
}

const WEEKDAYS = [
    { value: 1, label: 'Seg' },
    { value: 2, label: 'Ter' },
    { value: 3, label: 'Qua' },
    { value: 4, label: 'Qui' },
    { value: 5, label: 'Sex' },
    { value: 6, label: 'Sáb' },
    { value: 0, label: 'Dom' },
];

const TIMEZONES = [
    { value: 'America/Sao_Paulo', label: 'Brasília (GMT-3)' },
    { value: 'America/Manaus', label: 'Manaus (GMT-4)' },
    { value: 'America/Belem', label: 'Belém (GMT-3)' },
    { value: 'America/Fortaleza', label: 'Fortaleza (GMT-3)' },
    { value: 'America/Recife', label: 'Recife (GMT-3)' },
    { value: 'America/Cuiaba', label: 'Cuiabá (GMT-4)' },
    { value: 'America/Porto_Velho', label: 'Porto Velho (GMT-4)' },
    { value: 'America/Rio_Branco', label: 'Rio Branco (GMT-5)' },
    { value: 'America/Buenos_Aires', label: 'Buenos Aires (GMT-3)' },
    { value: 'America/Santiago', label: 'Santiago (GMT-4)' },
    { value: 'America/Bogota', label: 'Bogotá (GMT-5)' },
    { value: 'America/Mexico_City', label: 'Cidade do México (GMT-6)' },
    { value: 'America/New_York', label: 'Nova York (GMT-5)' },
    { value: 'Europe/Lisbon', label: 'Lisboa (GMT+0)' },
];

const HOURS = Array.from({ length: 24 }, (_, i) => ({
    value: i,
    label: `${String(i).padStart(2, '0')}:00`,
}));

const DEFAULT_SETTINGS: CampaignSettings = {
    businessHours: {
        enabled: true,
        start: 8,
        end: 20,
        timezone: 'America/Sao_Paulo',
        workDays: [1, 2, 3, 4, 5],
    },
};

export function CampaignSettingsPanel({ campaignId, open, onClose }: CampaignSettingsPanelProps) {
    const [settings, setSettings] = useState<CampaignSettings>(DEFAULT_SETTINGS);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (open && campaignId) {
            setIsLoading(true);
            campaignService.getSettings(campaignId)
                .then((data) => {
                    if (data && data.businessHours) {
                        setSettings(data);
                    } else {
                        setSettings(DEFAULT_SETTINGS);
                    }
                })
                .catch(() => setSettings(DEFAULT_SETTINGS))
                .finally(() => setIsLoading(false));
        }
    }, [open, campaignId]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await campaignService.updateSettings(campaignId, settings);
            toast.success('Configurações salvas!');
            onClose();
        } catch (error) {
            toast.error('Erro ao salvar configurações.');
        } finally {
            setIsSaving(false);
        }
    };

    const toggleWorkDay = (day: number) => {
        setSettings(prev => {
            const workDays = prev.businessHours.workDays.includes(day)
                ? prev.businessHours.workDays.filter(d => d !== day)
                : [...prev.businessHours.workDays, day];
            return {
                ...prev,
                businessHours: { ...prev.businessHours, workDays },
            };
        });
    };

    const updateBH = (field: string, value: any) => {
        setSettings(prev => ({
            ...prev,
            businessHours: { ...prev.businessHours, [field]: value },
        }));
    };

    return (
        <AnimatePresence>
            {open && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px]"
                        onClick={onClose}
                    />

                    {/* Panel */}
                    <motion.div
                        initial={{ x: '100%', opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: '100%', opacity: 0 }}
                        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                        className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-white shadow-2xl border-l border-gray-100 flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-50 rounded-lg">
                                    <Clock className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900">Configurações</h2>
                                    <p className="text-xs text-gray-500">Horário comercial da campanha</p>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full h-8 w-8 hover:bg-gray-100">
                                <X className="w-4 h-4" />
                            </Button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {isLoading ? (
                                <div className="flex items-center justify-center py-16">
                                    <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                                </div>
                            ) : (
                                <>
                                    {/* Business Hours Toggle */}
                                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                        <div className="space-y-0.5">
                                            <Label className="text-sm font-semibold text-gray-900 cursor-pointer">
                                                Horário Comercial
                                            </Label>
                                            <p className="text-xs text-gray-500">
                                                {settings.businessHours.enabled
                                                    ? 'Campanha respeita o horário definido'
                                                    : 'Campanha funciona 24/7'
                                                }
                                            </p>
                                        </div>
                                        <Switch
                                            checked={settings.businessHours.enabled}
                                            onCheckedChange={(v) => updateBH('enabled', v)}
                                        />
                                    </div>

                                    {/* Settings (only shown when enabled) */}
                                    <AnimatePresence>
                                        {settings.businessHours.enabled && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.2 }}
                                                className="space-y-5 overflow-hidden"
                                            >
                                                {/* Hours Range */}
                                                <div className="space-y-3">
                                                    <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                        Horário de Funcionamento
                                                    </Label>
                                                    <div className="flex items-center gap-3">
                                                        <select
                                                            value={settings.businessHours.start}
                                                            onChange={(e) => updateBH('start', parseInt(e.target.value))}
                                                            className="flex-1 h-10 px-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                                                        >
                                                            {HOURS.map(h => (
                                                                <option key={h.value} value={h.value}>{h.label}</option>
                                                            ))}
                                                        </select>
                                                        <span className="text-gray-400 font-medium text-sm">até</span>
                                                        <select
                                                            value={settings.businessHours.end}
                                                            onChange={(e) => updateBH('end', parseInt(e.target.value))}
                                                            className="flex-1 h-10 px-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                                                        >
                                                            {HOURS.map(h => (
                                                                <option key={h.value} value={h.value}>{h.label}</option>
                                                            ))}
                                                        </select>
                                                    </div>

                                                    {/* Visual time bar */}
                                                    <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
                                                        <div
                                                            className="absolute h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-300"
                                                            style={{
                                                                left: `${(settings.businessHours.start / 24) * 100}%`,
                                                                width: `${((settings.businessHours.end - settings.businessHours.start) / 24) * 100}%`,
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="flex justify-between text-[10px] text-gray-400 px-0.5">
                                                        <span>00:00</span>
                                                        <span>06:00</span>
                                                        <span>12:00</span>
                                                        <span>18:00</span>
                                                        <span>23:59</span>
                                                    </div>
                                                </div>

                                                {/* Work Days */}
                                                <div className="space-y-3">
                                                    <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                        Dias Ativos
                                                    </Label>
                                                    <div className="flex gap-1.5">
                                                        {WEEKDAYS.map(day => {
                                                            const isActive = settings.businessHours.workDays.includes(day.value);
                                                            return (
                                                                <button
                                                                    key={day.value}
                                                                    onClick={() => toggleWorkDay(day.value)}
                                                                    className={cn(
                                                                        'flex-1 py-2.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer',
                                                                        isActive
                                                                            ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                                                                            : 'bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600'
                                                                    )}
                                                                >
                                                                    {day.label}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>

                                                {/* Timezone */}
                                                <div className="space-y-3">
                                                    <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                                                        <Globe className="w-3.5 h-3.5" />
                                                        Fuso Horário
                                                    </Label>
                                                    <select
                                                        value={settings.businessHours.timezone}
                                                        onChange={(e) => updateBH('timezone', e.target.value)}
                                                        className="w-full h-10 px-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                                                    >
                                                        {TIMEZONES.map(tz => (
                                                            <option key={tz.value} value={tz.value}>{tz.label}</option>
                                                        ))}
                                                    </select>
                                                </div>

                                                {/* Summary */}
                                                <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl">
                                                    <p className="text-xs text-blue-700 leading-relaxed">
                                                        A campanha funcionará das{' '}
                                                        <strong>{String(settings.businessHours.start).padStart(2, '0')}:00</strong>
                                                        {' '}às{' '}
                                                        <strong>{String(settings.businessHours.end).padStart(2, '0')}:00</strong>
                                                        {' '}nos dias{' '}
                                                        <strong>
                                                            {WEEKDAYS
                                                                .filter(d => settings.businessHours.workDays.includes(d.value))
                                                                .map(d => d.label)
                                                                .join(', ') || 'nenhum'
                                                            }
                                                        </strong>
                                                        {' '}({TIMEZONES.find(t => t.value === settings.businessHours.timezone)?.label || settings.businessHours.timezone}).
                                                    </p>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-gray-100 flex justify-end gap-3">
                            <Button variant="ghost" onClick={onClose} className="text-gray-600 hover:bg-gray-100 rounded-lg">
                                Cancelar
                            </Button>
                            <Button
                                onClick={handleSave}
                                disabled={isSaving || isLoading}
                                className="px-5 rounded-lg bg-gray-900 hover:bg-black text-white transition-all hover:shadow-lg hover:-translate-y-0.5"
                            >
                                {isSaving ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Save className="mr-2 h-4 w-4" />
                                )}
                                Salvar
                            </Button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
