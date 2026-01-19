'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';
import { useToast } from '@/components/ui/use-toast';
import { Rocket } from 'lucide-react';

export function OnboardingModal() {
    const { user, loading } = useAuth();
    const { toast } = useToast();
    const [companyName, setCompanyName] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Show modal if user is loaded, but has NO company_id
    // CAST: user type might not have company_id in TS definition yet, verify usage.
    const showModal = !loading && user && !(user as any).company_id;

    const handleCreate = async () => {
        if (!companyName.trim()) return;
        setSubmitting(true);
        try {
            await api.post('/company', { name: companyName });
            toast({
                title: "Sucesso!",
                description: "Sua empresa foi criada. Bem-vindo ao ÁXIS."
            });
            // Force reload to update token claims/profile
            window.location.reload();
        } catch (error) {
            console.error(error);
            toast({
                title: "Erro",
                description: "Falha ao criar empresa.",
                variant: 'destructive'
            });
            setSubmitting(false);
        }
    };

    if (!showModal) return null;

    return (
        <Dialog open={true}>
            <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Rocket className="h-6 w-6 text-primary" />
                        Bem-vindo ao ÁXIS
                    </DialogTitle>
                    <DialogDescription>
                        Para começar, precisamos criar o espaço da sua organização.
                        Isso irá configurar seu ambiente isolado.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">
                            Nome
                        </Label>
                        <Input
                            id="name"
                            placeholder="Ex: ACME Corp"
                            className="col-span-3"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleCreate} disabled={submitting || !companyName.trim()}>
                        {submitting ? 'Criando...' : 'Criar Minha Empresa'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
