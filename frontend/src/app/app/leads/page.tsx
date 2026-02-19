"use client";

import { useEffect, useState } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { LeadKanbanCard } from "@/components/leads/lead-kanban-card";
import { Loader2, Kanban as KanbanIcon } from "lucide-react";
import { toast } from "sonner";

// STATUS COLUMNS CONFIG
const COLUMNS = {
    new: { id: "new", title: "Novos", color: "bg-blue-500/10 border-blue-500/20" },
    contacted: { id: "contacted", title: "Em Contato", color: "bg-yellow-500/10 border-yellow-500/20" },
    negotiating: { id: "negotiating", title: "Em Negociação", color: "bg-purple-500/10 border-purple-500/20" }, // AI Active
    converted: { id: "converted", title: "Fechamento", color: "bg-green-500/10 border-green-500/20" },
    lost: { id: "lost", title: "Perdido", color: "bg-red-500/10 border-red-500/20" }
};

export default function LeadsPage() {
    const { session } = useAuth();
    const [leads, setLeads] = useState<any[]>([]);
    const [columns, setColumns] = useState<any>(COLUMNS);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (session?.user) {
            fetchLeads();
            subscribeToLeads();
        }
    }, [session]);

    const fetchLeads = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from("leads")
                .select("*, campaigns(name)");

            if (error) throw error;
            setLeads(data || []);
        } catch (error) {
            console.error("Error fetching leads:", error);
            toast.error("Erro ao carregar leads.");
        } finally {
            setLoading(false);
        }
    };

    const subscribeToLeads = () => {
        const channel = supabase
            .channel('public:leads')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, (payload) => {
                // Determine if insert or update
                if (payload.eventType === 'INSERT') {
                    setLeads(prev => [...prev, payload.new]);
                } else if (payload.eventType === 'UPDATE') {
                    setLeads(prev => prev.map(l => l.id === payload.new.id ? { ...l, ...payload.new } : l));
                } else if (payload.eventType === 'DELETE') {
                    setLeads(prev => prev.filter(l => l.id !== payload.old.id));
                }
            })
            .subscribe();

        return () => supabase.removeChannel(channel);
    };

    const onDragEnd = async (result: any) => {
        const { source, destination, draggableId } = result;

        if (!destination) return;
        if (source.droppableId === destination.droppableId && source.index === destination.index) return;

        const newStatus = destination.droppableId;

        // Optimistic Update
        const updatedLeads = leads.map(l => l.id === draggableId ? { ...l, status: newStatus } : l);
        setLeads(updatedLeads);

        // API Update
        try {
            const { error } = await supabase
                .from("leads")
                .update({ status: newStatus })
                .eq("id", draggableId);

            if (error) throw error;
            toast.success(`Lead movido para ${COLUMNS[newStatus as keyof typeof COLUMNS].title}`);
        } catch (error) {
            console.error("Failed to move lead:", error);
            toast.error("Erro ao atualizar status.");
            fetchLeads(); // Revert
        }
    };

    // Group leads by status
    const getLeadsByStatus = (status: string) => {
        return leads.filter(l => l.status === status);
    };

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
                        <KanbanIcon className="w-8 h-8 text-primary" />
                        Pipeline de Vendas
                    </h1>
                    <p className="text-muted-foreground">Gerencie seus leads e acompanhe as negociações da IA.</p>
                </div>
                {/* <Button>Novo Lead</Button> */}
            </div>

            <DragDropContext onDragEnd={onDragEnd}>
                <div className="flex-1 flex gap-4 overflow-x-auto pb-4">
                    {Object.entries(columns).map(([status, col]: [string, any]) => (
                        <div key={status} className={`flex-shrink-0 w-80 flex flex-col rounded-xl border bg-card/50 backdrop-blur-sm ${col.color}`}>
                            <div className="p-4 border-b flex items-center justify-between">
                                <h3 className="font-semibold">{col.title}</h3>
                                <span className="text-xs font-mono bg-background/50 px-2 py-1 rounded-full text-muted-foreground">
                                    {getLeadsByStatus(status).length}
                                </span>
                            </div>

                            <Droppable droppableId={status}>
                                {(provided, snapshot) => (
                                    <div
                                        {...provided.droppableProps}
                                        ref={provided.innerRef}
                                        className={`flex-1 p-3 space-y-3 overflow-y-auto min-h-[150px] transition-colors ${snapshot.isDraggingOver ? 'bg-primary/5' : ''}`}
                                    >
                                        {getLeadsByStatus(status).map((lead, index) => (
                                            <Draggable key={lead.id} draggableId={lead.id} index={index}>
                                                {(provided, snapshot) => (
                                                    <div
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        {...provided.dragHandleProps}
                                                        style={{ ...provided.draggableProps.style }}
                                                    >
                                                        <LeadKanbanCard lead={lead} isDragging={snapshot.isDragging} />
                                                    </div>
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        </div>
                    ))}
                </div>
            </DragDropContext>
        </div>
    );
}
