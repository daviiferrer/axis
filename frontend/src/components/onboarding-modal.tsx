'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import api from '@/services/api';
import { Check, Zap, Rocket, Shield, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

// Steps: 0 = Welcome/Name, 1 = Plan Selection, 2 = WhatsApp Intro
export function OnboardingModal() {
    const { user, refreshProfile, loading: authLoading } = useAuth();
    const [open, setOpen] = useState(false);
    const [step, setStep] = useState(0);
    const [companyName, setCompanyName] = useState('');
    const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!authLoading && user && !(user as any).company_id) {
            setOpen(true);
        } else {
            setOpen(false);
        }
    }, [user, authLoading]);

    const handleCreateCompany = async () => {
        if (!companyName.trim()) return;
        setLoading(true);
        try {
            await api.post('/company', { name: companyName });
            await refreshProfile();
            toast.success("Área de trabalho criada!");
            setStep(1); // Move to Plan Selection
        } catch (error) {
            console.error(error);
            toast.error("Erro ao criar empresa.");
        } finally {
            setLoading(false);
        }
    };

    const handlePlanSelect = (planId: string) => {
        setSelectedPlan(planId);
        // In real app, call API to set plan
        toast.success(`Plano ${planId} escolhido!`);
        setStep(2); // Move to Final/WhatsApp
    };

    const handleFinish = () => {
        setOpen(false);
        window.location.href = '/app/settings'; // Redirect to connect WhatsApp
    };

    return (
        <Dialog open={open}>
            <DialogContent className="sm:max-w-[800px] h-[600px] flex flex-col p-8" onInteractOutside={(e) => e.preventDefault()}>
                {/* Wizard Progress */}
                <div className="flex justify-between mb-8 px-12">
                     <div className={cn("flex flex-col items-center gap-2", step >= 0 ? "text-blue-600" : "text-gray-300")}>
                        <div className={cn("w-3 h-3 rounded-full", step >= 0 ? "bg-blue-600" : "bg-gray-300")} />
                        <span className="text-xs font-medium">Empresa</span>
                     </div>
                     <div className={cn("h-[2px] flex-1 mx-4 mt-1.5", step >= 1 ? "bg-blue-600" : "bg-gray-200")} />
                     <div className={cn("flex flex-col items-center gap-2", step >= 1 ? "text-blue-600" : "text-gray-300")}>
                        <div className={cn("w-3 h-3 rounded-full", step >= 1 ? "bg-blue-600" : "bg-gray-300")} />
                        <span className="text-xs font-medium">Plano</span>
                     </div>
                     <div className={cn("h-[2px] flex-1 mx-4 mt-1.5", step >= 2 ? "bg-blue-600" : "bg-gray-200")} />
                     <div className={cn("flex flex-col items-center gap-2", step >= 2 ? "text-blue-600" : "text-gray-300")}>
                        <div className={cn("w-3 h-3 rounded-full", step >= 2 ? "bg-blue-600" : "bg-gray-300")} />
                        <span className="text-xs font-medium">Conectar</span>
                     </div>
                </div>

                <div className="flex-1 flex flex-col justify-center items-center max-w-2xl mx-auto w-full">
                    {step === 0 && (
                        <div className="w-full space-y-6 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <h2 className="text-2xl font-bold">Bem-vindo ao ÁXIS</h2>
                            <p className="text-muted-foreground">Vamos configurar sua primeira Área de Trabalho para gerenciar seus agentes.</p>
                            
                            <div className="space-y-2 text-left">
                                <Label>Nome da Empresa</Label>
                                <Input 
                                    value={companyName} 
                                    onChange={e => setCompanyName(e.target.value)} 
                                    placeholder="Ex: Minha Loja 24h"
                                    className="text-lg py-6"
                                />
                            </div>

                            <Button onClick={handleCreateCompany} disabled={loading || !companyName} className="w-full py-6 text-lg">
                                {loading ? 'Criando...' : 'Continuar'}
                            </Button>
                        </div>
                    )}

                    {step === 1 && (
                        <div className="w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="text-center">
                                <h2 className="text-2xl font-bold">Escolha seu Poder de Fogo</h2>
                                <p className="text-muted-foreground">Selecione o plano ideal para sua escala atual.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                <button onClick={() => handlePlanSelect('starter')} className="border rounded-xl p-6 text-left hover:border-blue-500 hover:bg-blue-50 transition-all">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Zap className="w-5 h-5 text-gray-600" />
                                        <span className="font-bold">Starter</span>
                                    </div>
                                    <p className="text-2xl font-bold mb-2">Grátis</p>
                                    <ul className="text-sm text-muted-foreground space-y-1">
                                        <li>1 Usuário</li>
                                        <li>1.000 Mensagens/mês</li>
                                    </ul>
                                </button>

                                <button onClick={() => handlePlanSelect('pro')} className="border-2 border-blue-600 bg-blue-50/50 rounded-xl p-6 text-left relative hover:scale-105 transition-all shadow-sm">
                                    <div className="absolute -top-3 right-4 bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">RECOMENDADO</div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Rocket className="w-5 h-5 text-blue-600" />
                                        <span className="font-bold text-blue-700">Pro</span>
                                    </div>
                                    <p className="text-2xl font-bold mb-2">R$ 297<span className="text-sm font-normal text-muted-foreground">/mês</span></p>
                                    <ul className="text-sm text-gray-600 space-y-1">
                                        <li>5 Usuários</li>
                                        <li>IA Avançada</li>
                                        <li>Editor Visual</li>
                                    </ul>
                                </button>
                            </div>
                            <Button variant="ghost" onClick={() => handlePlanSelect('starter')} className="w-full text-muted-foreground">
                                Pular por enquanto
                            </Button>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="w-full space-y-6 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                                <Check className="w-10 h-10 text-green-600" />
                            </div>
                            <h2 className="text-2xl font-bold">Tudo Pronto!</h2>
                            <p className="text-muted-foreground">Sua área de trabalho foi configurada. Agora precisamos conectar seu WhatsApp para começar a vender.</p>
                            
                            <Button onClick={handleFinish} className="w-full py-6 text-lg gap-2 bg-green-600 hover:bg-green-700">
                                Conectar WhatsApp <ArrowRight className="w-4 h-4" />
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
