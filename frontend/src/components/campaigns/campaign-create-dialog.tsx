'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { campaignService } from '@/services/campaign';
import { Rocket, MessageCircle, Megaphone } from 'lucide-react';

export function CampaignCreateDialog({ onSuccess }: { onSuccess: () => void }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState('');
    const [type, setType] = useState('inbound'); // inbound | outbound

    const handleCreate = async () => {
        if (!name) return;
        setLoading(true);
        try {
            await campaignService.createCampaign({ name, type });
            setOpen(false);
            onSuccess();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Rocket className="mr-2 h-4 w-4" />
                    Nova Campanha
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Criar Nova Campanha</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Nome da Campanha</Label>
                        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Captação Black Friday" />
                    </div>
                    <div className="grid gap-2">
                        <Label>Tipo de Estratégia</Label>
                        <Select value={type} onValueChange={setType}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="inbound">
                                    <div className="flex items-center gap-2">
                                        <MessageCircle className="h-4 w-4 text-blue-500" />
                                        <span>Inbound (Ads / Receptivo)</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="outbound">
                                    <div className="flex items-center gap-2">
                                        <Megaphone className="h-4 w-4 text-orange-500" />
                                        <span>Outbound (Prospecção Ativa)</span>
                                    </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground mt-1">
                            {type === 'inbound'
                                ? 'O robô aguarda o cliente chamar (via Anúncio ou Link).'
                                : 'O robô inicia a conversa enviando a primeira mensagem (Lista Fria/Apify).'}
                        </p>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                    <Button onClick={handleCreate} disabled={loading}>{loading ? 'Criando...' : 'Criar'}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
