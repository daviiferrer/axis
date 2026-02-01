'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { campaignService } from '@/services/campaign';
import { Rocket, ChevronRight, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export function CampaignCreateDialog({ onSuccess }: { onSuccess: () => void }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState('');


    const handleCreate = async () => {
        if (!name.trim()) {
            toast.error('Por favor, dê um nome para sua campanha.');
            return;
        }
        setLoading(true);
        try {
            // Updated Payload with waha_session_name
            await campaignService.createCampaign({
                name,
                type: 'inbound',
            });
            toast.success('Campanha criada com sucesso! 🚀');
            setOpen(false);
            setName('');

            onSuccess();
        } catch (error) {
            console.error(error);
            toast.error('Erro ao criar campanha.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button onClick={() => setOpen(true)} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/20 border-0">
                    <Rocket className="mr-2 h-4 w-4" />
                    Nova Campanha
                </Button>
            </motion.div>

            <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden bg-white/95 backdrop-blur-xl border-white/20 shadow-2xl rounded-3xl ring-1 ring-gray-900/5">
                {/* Header */}
                <div className="relative h-28 bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-600 flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl animate-pulse" />
                    <div className="text-center z-10 p-4">
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                        >
                            <DialogTitle className="text-2xl font-bold text-white tracking-tight">Nova Campanha</DialogTitle>
                            <p className="text-blue-100 text-sm mt-1 font-medium">Configure a Inteligência da Campanha</p>
                        </motion.div>
                    </div>
                </div>

                <div className="p-8 space-y-6">
                    <div className="space-y-3">
                        <Label htmlFor="name" className="text-sm font-bold text-gray-500 uppercase tracking-wider">Nome da Campanha</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ex: Advogado - Triagem Inicial"
                            className="bg-gray-50 border-gray-200 focus:bg-white transition-all rounded-xl"
                            autoFocus
                        />
                    </div>


                </div>

                <div className="p-6 bg-gray-50/80 border-t border-gray-100 flex justify-end gap-3">
                    <Button variant="ghost" onClick={() => setOpen(false)} className="hover:bg-gray-200/50">Cancelar</Button>
                    <Button
                        onClick={handleCreate}
                        disabled={loading || !name}
                        className={`
                            bg-gray-900 hover:bg-black text-white px-8 transition-all
                            ${loading ? 'opacity-80' : ''}
                        `}
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
