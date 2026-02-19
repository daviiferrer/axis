"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Loader2, Users, Play, Search, Filter, MoreHorizontal, CheckSquare, Square } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import api from "@/services/api";

export default function ContactsPage() {
    const { session } = useAuth();
    const [leads, setLeads] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
    const [isTriggering, setIsTriggering] = useState(false);

    useEffect(() => {
        if (session?.user) {
            fetchLeads();
        }
    }, [session]);

    const fetchLeads = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from("leads")
                .select("*, campaigns(name)")
                .order('updated_at', { ascending: false });

            if (error) throw error;
            setLeads(data || []);
        } catch (error) {
            console.error("Error fetching leads:", error);
            toast.error("Erro ao carregar contatos.");
        } finally {
            setLoading(false);
        }
    };

    const handleBulkTrigger = async () => {
        if (selectedLeads.length === 0) return;

        try {
            setIsTriggering(true);
            // Call backend bulk trigger endpoint
            // Assuming endpoint is POST /leads/bulk-trigger
            // Or POST /api/v1/leads/bulk-trigger using api lib?
            // Since I modified LeadController, I need to check the route.
            // Usually routes are in frontend/src/lib/api.ts or similar.
            // I will use axios/fetch directly for now if api lib doesn't support it, but better use api.

            // Let's assume axios setup in services/leads.ts or similar. 
            // I'll use direct fetch via a helper or just axios here for speed if needed, 
            // but cleaner is to add to `services/leads.ts` later. 
            // For now, I'll use `api` if it supports custom requests or just fetch.
            // Since `api` from `@/lib/api` is likely an axios instance.

            await api.post('/leads/bulk-trigger', { leadIds: selectedLeads, force: true });

            toast.success(`Fluxo disparado para ${selectedLeads.length} leads!`);
            setSelectedLeads([]);
            fetchLeads(); // Refresh status
        } catch (error) {
            console.error("Bulk trigger error:", error);
            toast.error("Erro ao disparar fluxo.");
        } finally {
            setIsTriggering(false);
        }
    };

    const toggleSelectAll = () => {
        if (selectedLeads.length === leads.length) {
            setSelectedLeads([]);
        } else {
            setSelectedLeads(leads.map(l => l.id));
        }
    };

    const toggleSelectLead = (id: string) => {
        if (selectedLeads.includes(id)) {
            setSelectedLeads(prev => prev.filter(l => l !== id));
        } else {
            setSelectedLeads(prev => [...prev, id]);
        }
    };

    // Filter leads
    const filteredLeads = leads.filter(lead =>
    (lead.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.phone?.includes(searchTerm))
    );

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="animate-spin text-primary w-8 h-8" />
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <Users className="w-8 h-8 text-primary" />
                        Contatos
                    </h1>
                    <p className="text-muted-foreground">Base geral de leads para ações em massa.</p>
                </div>
                <div className="flex gap-2">
                    {selectedLeads.length > 0 && (
                        <Button
                            onClick={handleBulkTrigger}
                            disabled={isTriggering}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            {isTriggering ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
                            Rodar Fluxo ({selectedLeads.length})
                        </Button>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-4 bg-white p-4 rounded-xl border shadow-sm">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Buscar por nome ou telefone..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 bg-gray-50 border-gray-200"
                    />
                </div>
                <Button variant="outline" className="gap-2">
                    <Filter className="w-4 h-4" />
                    Filtros
                </Button>
            </div>

            <div className="border rounded-xl bg-white shadow-sm overflow-hidden flex-1">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50px] text-center">
                                <Checkbox
                                    checked={selectedLeads.length === leads.length && leads.length > 0}
                                    onCheckedChange={toggleSelectAll}
                                />
                            </TableHead>
                            <TableHead>Nome / Telefone</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Campanha</TableHead>
                            <TableHead>Score</TableHead>
                            <TableHead>Última Interação</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredLeads.map((lead) => (
                            <TableRow key={lead.id} className="hover:bg-gray-50">
                                <TableCell className="text-center">
                                    <Checkbox
                                        checked={selectedLeads.includes(lead.id)}
                                        onCheckedChange={() => toggleSelectLead(lead.id)}
                                    />
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="font-medium text-gray-900">{lead.name || "Desconhecido"}</span>
                                        <span className="text-xs text-gray-500 font-mono">{lead.phone}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="secondary" className="uppercase text-[10px]">
                                        {lead.status}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <div className="text-sm text-gray-600">
                                        {lead.campaigns?.name || "-"}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className={`font-bold ${lead.score > 50 ? 'text-green-600' : 'text-gray-500'}`}>
                                        {lead.score || 0}
                                    </div>
                                </TableCell>
                                <TableCell className="text-xs text-gray-500">
                                    {lead.last_message_at ? format(new Date(lead.last_message_at), "dd/MM HH:mm", { locale: ptBR }) : "-"}
                                </TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                <span className="sr-only">Open menu</span>
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(lead.phone)}>
                                                Copiar Telefone
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem>Ver Detalhes</DropdownMenuItem>
                                            <DropdownMenuItem
                                                className="text-red-600"
                                                onClick={async () => {
                                                    // Implement stop logic
                                                }}
                                            >
                                                Parar IA
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                {filteredLeads.length === 0 && (
                    <div className="p-12 text-center text-gray-400">
                        Nenhum contato encontrado.
                    </div>
                )}
            </div>
        </div>
    );
}
