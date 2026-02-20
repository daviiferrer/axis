import { Zap, Brain, Target, Mic, Briefcase, User, Bot, Layout, MessageSquare, Shield } from "lucide-react";

export const WIZARD_STEPS = [
    {
        id: "identity",
        label: "Identidade",
        icon: User,
        description: "Quem é o agente?",
        color: "bg-blue-50 text-blue-600",
        fields: ["name", "role", "voice_config"]
    },
    {
        id: "behavior",
        label: "Comportamento",
        icon: Shield,
        description: "Como ele age?",
        color: "bg-orange-50 text-orange-600",
        fields: ["personality", "writing_style", "safety"]
    }
];

export const ROLES = [
    { id: "SDR", label: "SDR / Vendas", icon: Zap, description: "Focado em qualificação e agendamento." },
    { id: "SUPPORT", label: "Suporte (L1)", icon: Briefcase, description: "Tira dúvidas e resolve problemas simples." },
    { id: "CONCIERGE", label: "Concierge", icon: Bot, description: "Recepciona e direciona leads." },
    { id: "EXECUTIVE", label: "Closer", icon: User, description: "Negociações avançadas e fechamento." }
];
