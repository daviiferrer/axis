import { z } from 'zod';
import { Node } from '@xyflow/react';

// Common Zod schemas for Flow Builder Nodes

const ActionNodeSchema = z.object({
    webhook_url: z.string().url("URL de Webhook inválida").nonempty("Insira uma URL"),
    method: z.string().nonempty("Método HTTP é obrigatório"),
});

const GotoNodeSchema = z.object({
    targetNodeId: z.string().nonempty("ID do nó de destino ausente no GOTO"),
});

const GotoCampaignNodeSchema = z.object({
    target_campaign_id: z.string().nonempty("Campanha de destino ausente"),
});

const AgentNodeSchema = z.object({
    model: z.string().nonempty("Padrão de modelo IA ausente").optional(), // might be optional if campaign sets it
    // Other things can be checked visually, but gemini_key etc depends on the backend
});

const BroadcastNodeSchema = z.object({
    messageTemplate: z.string().nonempty("A mensagem não pode estar vazia"),
}).refine(data => {
    // Basic Spintax validation - matching '{' and '}'
    if (data.messageTemplate && data.messageTemplate.includes('{')) {
        const opens = (data.messageTemplate.match(/{/g) || []).length;
        const closes = (data.messageTemplate.match(/}/g) || []).length;
        if (opens !== closes) return false;
    }
    return true;
}, {
    message: "Fechamento de chaves inválido no Spintax",
    path: ["messageTemplate"]
});

export type ValidationStatus = {
    isValid: boolean;
    errors: string[];
    warnings: string[];
};

export function validateNodeData(node: Node): ValidationStatus {
    const data = node.data || {};
    let isValid = true;
    let errors: string[] = [];
    let warnings: string[] = [];

    switch (node.type) {
        case 'goto':
            if (!data.targetNodeId) {
                isValid = false;
                errors.push("Nó de destino não selecionado");
            } else if (data.targetNodeId === node.id) {
                isValid = false;
                errors.push("Um nó não pode apontar para ele mesmo (Loop Infinito)");
            }
            break;
        case 'goto_campaign':
            if (!data.target_campaign_id) {
                isValid = false;
                errors.push("Campanha de destino não selecionada");
            }
            break;
        case 'action': {
            const actResult = ActionNodeSchema.safeParse(data);
            if (!actResult.success) {
                isValid = false;
                errors.push(...actResult.error.issues.map((e: any) => e.message));
            }
            if (!data.webhook_url && !data.action) {
                // warning fallback if empty
                warnings.push("Action configurada como vazia");
                isValid = false;
                errors.push("Webhook/Action Url é obrigatório");
            }
            break;
        }
        case 'broadcast':
            if (!data.messageTemplate || typeof data.messageTemplate !== 'string' || data.messageTemplate.trim() === '') {
                isValid = false;
                errors.push("Conteúdo da mensagem de disparo vazio");
            } else if (data.spintaxEnabled) {
                const opens = (data.messageTemplate.match(/{/g) || []).length;
                const closes = (data.messageTemplate.match(/}/g) || []).length;
                if (opens !== closes) {
                    isValid = false;
                    errors.push("Chaves desbalanceadas no Spintax ({ / })");
                }
            }
            break;
        case 'agent':
        case 'agentic':
        case 'qualification':
            // If they don't have a prompt or empty playbook might cause warnings
            if (!data.systemPrompt && !data.instruction_override) {
                warnings.push("O Agente está sem Playbook (Instrução vazia)");
            }
            break;
        case 'chatbot':
            if (!data.messages || !Array.isArray(data.messages) || data.messages.length === 0) {
                isValid = false;
                errors.push("Chatbot deve possuir pelo menos 1 mensagem");
            }
            break;
        case 'logic':
            if (!data.conditions || !Array.isArray(data.conditions) || data.conditions.length === 0) {
                warnings.push("Logic Node vazio atua como fallback natural apenas");
            }
            break;
        case 'delay':
            if (data.duration === 0) {
                warnings.push("Delay de 0 horas configurado. Agirá imediatamente.");
            }
            break;
        case 'handoff':
            if (data.target === 'campaign' && !data.targetCampaignId) {
                isValid = false;
                errors.push("Target Campaign ID é exigido");
            }
            break;
    }

    return { isValid, errors, warnings };
}
