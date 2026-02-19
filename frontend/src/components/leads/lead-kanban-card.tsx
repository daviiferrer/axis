import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Bot, DollarSign, MessageSquare, Phone } from "lucide-react";
import { cn } from "@/lib/utils";

interface LeadKanbanCardProps {
    lead: any;
    isDragging?: boolean;
}

export function LeadKanbanCard({ lead, isDragging }: LeadKanbanCardProps) {
    // Determine if AI is actively negotiating (Visual Pulse)
    // We check if status is 'negotiating' AND last message was recent (< 1 hour) OR intention is high
    const isNegotiating = lead.status === 'negotiating';
    const hasHighIntent = ['INTERESTED', 'VERY_INTERESTED', 'READY_TO_BUY', 'PRICING_QUERY'].includes(lead.context?.intent);

    // Pulsating effect for active negotiations
    const shouldPulsate = isNegotiating && hasHighIntent;

    const formatter = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    });

    return (
        <Card className={cn(
            "cursor-grab active:cursor-grabbing hover:shadow-md transition-all",
            isDragging ? "shadow-xl ring-2 ring-primary rotate-2 scale-105" : "",
            shouldPulsate ? "animate-pulse-border border-purple-500/50 shadow-purple-500/20" : ""
        )}>
            <CardHeader className="p-3 pb-0 space-y-0">
                <div className="flex justify-between items-start">
                    <div>
                        <h4 className="font-semibold text-sm truncate max-w-[150px]" title={lead.name}>{lead.name}</h4>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <Phone className="w-3 h-3" /> {lead.phone}
                        </p>
                    </div>
                    {shouldPulsate && (
                        <div className="relative">
                            <span className="absolute -top-1 -right-1 w-2 h-2 bg-purple-500 rounded-full animate-ping" />
                            <Bot className="w-4 h-4 text-purple-500" />
                        </div>
                    )}
                </div>
            </CardHeader>
            <CardContent className="p-3 pt-2 space-y-2">
                {/* Metrics / badges */}
                <div className="flex flex-wrap gap-1">
                    {lead.revenue > 0 && (
                        <Badge variant="outline" className="text-[10px] items-center gap-1 bg-green-500/10 text-green-500 border-green-500/20">
                            <DollarSign className="w-3 h-3" />
                            {formatter.format(lead.revenue)}
                        </Badge>
                    )}
                    {lead.score > 50 && (
                        <Badge variant="secondary" className="text-[10px]">
                            🔥 {lead.score}
                        </Badge>
                    )}
                </div>

                {/* Last Interaction */}
                <div className="text-[10px] text-muted-foreground flex items-center gap-1 border-t pt-2 mt-1">
                    <MessageSquare className="w-3 h-3" />
                    <span className="truncate max-w-[180px]">
                        {lead.last_message_body || "Sem mensagens"}
                    </span>
                </div>
                <div className="text-[9px] text-muted-foreground text-right w-full">
                    {lead.updated_at && formatDistanceToNow(new Date(lead.updated_at), { addSuffix: true, locale: ptBR })}
                </div>
            </CardContent>
        </Card>
    );
}

// Add this to your globals.css if not present:
/*
@keyframes pulse-border {
  0% { box-shadow: 0 0 0 0 rgba(168, 85, 247, 0.4); }
  70% { box-shadow: 0 0 0 6px rgba(168, 85, 247, 0); }
  100% { box-shadow: 0 0 0 0 rgba(168, 85, 247, 0); }
}
.animate-pulse-border {
  animation: pulse-border 2s infinite;
}
*/
