"use client";

import { useEffect } from "react";
import { useSocket } from "@/context/SocketContext";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";

interface AgentConfigError {
    campaignId: string;
    campaignName: string;
    sessionName: string;
    reason: string;
    timestamp: string;
}

export function GlobalAlerts() {
    const { socket } = useSocket();

    useEffect(() => {
        if (!socket) return;

        const handleConfigError = (data: AgentConfigError) => {
            console.error("[GlobalAlerts] Agent Config Error:", data);

            toast.error("Erro de Configuração do Agente", {
                description: (
                    <div className="flex flex-col gap-1">
                        <p className="font-medium">O agente da campanha <span className="text-white font-bold">{data.campaignName}</span> foi bloqueado.</p>
                        <p className="text-xs opacity-90">Motivo: {data.reason}</p>
                        <p className="text-xs opacity-70 mt-1">Sessão: {data.sessionName}</p>
                    </div>
                ),
                duration: 8000,
                icon: <AlertCircle className="w-5 h-5 text-red-500" />,
                action: {
                    label: "Verificar",
                    onClick: () => window.location.href = `/app/campaigns/${data.campaignId}`
                }
            });
        };

        socket.on("agent.config_error", handleConfigError);

        return () => {
            socket.off("agent.config_error", handleConfigError);
        };
    }, [socket]);

    return null; // Headless component
}
