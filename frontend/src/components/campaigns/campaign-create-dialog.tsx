'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { campaignService, CampaignSettings } from '@/services/campaign';
import { Rocket, ChevronRight, LayoutTemplate, Clock, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

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
    { value: 'America/Buenos_Aires', label: 'Buenos Aires (GMT-3)' },
    { value: 'America/New_York', label: 'Nova York (GMT-5)' },
    { value: 'Europe/Lisbon', label: 'Lisboa (GMT+0)' },
];

const HOURS = Array.from({ length: 24 }, (_, i) => ({
    value: i,
    label: `${String(i).padStart(2, '0')}:00`,
}));

const DEFAULT_BH: CampaignSettings['businessHours'] = {
    enabled: true,
    start: 8,
    end: 20,
    timezone: 'America/Sao_Paulo',
    workDays: [1, 2, 3, 4, 5],
};

export function CampaignCreateDialog({ onSuccess }: { onSuccess: () => void }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    // Form State
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [businessHours, setBusinessHours] = useState(DEFAULT_BH);

    const handleCreate = async () => {
        if (!name.trim()) {
            toast.error('Por favor, dê um nome para sua campanha.');
            return;
        }
        setLoading(true);
        try {
            const campaign = await campaignService.createCampaign({ name, description });
            // Save settings right after creation
            await campaignService.updateSettings(campaign.id, { businessHours });
            toast.success('Campanha criada com sucesso! 🚀');
            setOpen(false);
            resetForm();
            onSuccess();
        } catch (error) {
            console.error(error);
            toast.error('Erro ao criar campanha.');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setName('');
        setDescription('');
        setBusinessHours(DEFAULT_BH);
    };

    const updateBH = (field: string, value: any) => {
        setBusinessHours(prev => ({ ...prev, [field]: value }));
    };

    const toggleWorkDay = (day: number) => {
        setBusinessHours(prev => ({
            ...prev,
            workDays: prev.workDays.includes(day)
                ? prev.workDays.filter(d => d !== day)
                : [...prev.workDays, day],
        }));
    };

    return (
        <Dialog open={open} onOpenChange={(val) => {
            setOpen(val);
            if (!val) resetForm();
        }}>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button onClick={() => setOpen(true)} className="bg-black text-white hover:bg-gray-800 shadow-xl shadow-gray-200 border-0 rounded-xl px-4 h-11">
                    <Rocket className="mr-2 h-4 w-4" />
                    Nova Campanha
                </Button>
            </motion.div>

            <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden bg-white border-0 shadow-2xl rounded-2xl gap-0">

                {/* Header */}
                <div className="p-8 pb-6 border-b border-gray-100 bg-white">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-50 rounded-lg">
                            <LayoutTemplate className="w-5 h-5 text-blue-600" />
                        </div>
                        <DialogTitle className="text-xl font-bold text-gray-900 tracking-tight">
                            Nova Campanha
                        </DialogTitle>
                    </div>
                    <DialogDescription className="text-gray-500 text-sm ml-12">
                        Configure os detalhes e horário de funcionamento da campanha.
                    </DialogDescription>
                </div>

                <div className="p-8 space-y-6 bg-gray-50/30 max-h-[65vh] overflow-y-auto">

                    {/* Name Input */}
                    <div className="space-y-2">
                        <Label htmlFor="name" className="text-xs font-semibold text-gray-700 uppercase tracking-wider pl-1">
                            Nome da Campanha <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ex: Qualificação de Leads - Instagram"
                            className="bg-white border-gray-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 h-11 rounded-xl transition-all"
                            autoFocus
                        />
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label htmlFor="description" className="text-xs font-semibold text-gray-700 uppercase tracking-wider pl-1">
                            Descrição (Opcional)
                        </Label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Descreva o objetivo desta campanha..."
                            className="bg-white border-gray-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 min-h-[80px] resize-none rounded-xl"
                        />
                    </div>

                    {/* Divider */}
                    <div className="flex items-center gap-3">
                        <div className="flex-1 h-px bg-gray-200" />
                        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Horário Comercial</span>
                        <div className="flex-1 h-px bg-gray-200" />
                    </div>

                    {/* Business Hours Toggle */}
                    <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100">
                        <div className="flex items-center gap-3">
                            <Clock className="w-4 h-4 text-blue-500" />
                            <div className="space-y-0.5">
                                <Label className="text-sm font-semibold text-gray-900 cursor-pointer">
                                    Horário Comercial
                                </Label>
                                <p className="text-xs text-gray-500">
                                    {businessHours.enabled ? 'Campanha respeita o horário definido' : 'Campanha funciona 24/7'}
                                </p>
                            </div>
                        </div>
                        <Switch
                            checked={businessHours.enabled}
                            onCheckedChange={(v) => updateBH('enabled', v)}
                        />
                    </div>

                    {/* Business Hours Details */}
                    <AnimatePresence>
                        {businessHours.enabled && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="space-y-4 overflow-hidden"
                            >
                                {/* Hours Range */}
                                <div className="flex items-center gap-3">
                                    <select
                                        value={businessHours.start}
                                        onChange={(e) => updateBH('start', parseInt(e.target.value))}
                                        className="flex-1 h-10 px-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                                    >
                                        {HOURS.map(h => (
                                            <option key={h.value} value={h.value}>{h.label}</option>
                                        ))}
                                    </select>
                                    <span className="text-gray-400 font-medium text-sm">até</span>
                                    <select
                                        value={businessHours.end}
                                        onChange={(e) => updateBH('end', parseInt(e.target.value))}
                                        className="flex-1 h-10 px-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                                    >
                                        {HOURS.map(h => (
                                            <option key={h.value} value={h.value}>{h.label}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Visual time bar */}
                                <div className="relative h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className="absolute h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-300"
                                        style={{
                                            left: `${(businessHours.start / 24) * 100}%`,
                                            width: `${((businessHours.end - businessHours.start) / 24) * 100}%`,
                                        }}
                                    />
                                </div>

                                {/* Work Days */}
                                <div className="flex gap-1.5">
                                    {WEEKDAYS.map(day => {
                                        const isActive = businessHours.workDays.includes(day.value);
                                        return (
                                            <button
                                                key={day.value}
                                                type="button"
                                                onClick={() => toggleWorkDay(day.value)}
                                                className={cn(
                                                    'flex-1 py-2 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer',
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

                                {/* Timezone */}
                                <div className="flex items-center gap-2">
                                    <Globe className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                    <select
                                        value={businessHours.timezone}
                                        onChange={(e) => updateBH('timezone', e.target.value)}
                                        className="flex-1 h-9 px-3 bg-white border border-gray-200 rounded-lg text-xs text-gray-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                                    >
                                        {TIMEZONES.map(tz => (
                                            <option key={tz.value} value={tz.value}>{tz.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                </div>

                {/* Footer */}
                <div className="p-6 bg-white border-t border-gray-100 flex justify-end gap-3">
                    <Button variant="ghost" onClick={() => setOpen(false)} className="hover:bg-gray-100 text-gray-600 rounded-lg">
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleCreate}
                        disabled={loading || !name}
                        className={cn(
                            "px-6 rounded-lg transition-all bg-gray-900 hover:bg-black text-white",
                            loading ? "opacity-80" : "hover:shadow-lg hover:-translate-y-0.5"
                        )}
                    >
                        {loading ? 'Criando...' : (
                            <span className="flex items-center gap-2">Criar Campanha <ChevronRight size={16} /></span>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
