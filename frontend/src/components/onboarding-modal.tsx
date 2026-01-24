'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import api from '@/services/api';

export function OnboardingModal() {
    const { user, refreshProfile, loading: authLoading } = useAuth();
    const [open, setOpen] = useState(false);
    const [companyName, setCompanyName] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Only show if user is logged in, loading is done, and NO company_id
        if (!authLoading && user && !(user as any).company_id) {
            setOpen(true);
        } else {
            setOpen(false);
        }
    }, [user, authLoading]);

    const handleCreateCompany = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!companyName.trim()) return;

        setLoading(true);
        try {
            await api.post('/company', { name: companyName });
            toast.success("Área de trabalho criada com sucesso!");
            await refreshProfile(); // Reload user to get the new company_id
            setOpen(false); // Close modal (useEffect will also keep it closed)
        } catch (error) {
            console.error(error);
            toast.error("Erro ao criar empresa. Tente novamente.");
        } finally {
            setLoading(false);
        }
    };

    // Prevent closing via 'escape' or clicking outside by not providing onOpenChange handler for closing
    return (
        <Dialog open={open}>
            <DialogContent className="sm:max-w-[425px]" onInteractOutside={(e) => e.preventDefault()}>
                <DialogHeader>
                    <DialogTitle>Bem-vindo ao ÁXIS</DialogTitle>
                    <DialogDescription>
                        Para começar, você precisa criar sua primeira Área de Trabalho (Empresa).
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateCompany} className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">
                            Nome
                        </Label>
                        <Input
                            id="name"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            placeholder="Minha Empresa"
                            className="col-span-3"
                            autoFocus
                        />
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={loading || !companyName.trim()}>
                            {loading ? 'Criando...' : 'Criar e Começar'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
