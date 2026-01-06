/**
 * PromptService - Core Service for Prompt Engineering
 * Implements the "Sandwich Pattern" with 3-layer hierarchy:
 * 1. DNA Layer (Top) - Immutable agent identity
 * 2. Context Layer (Middle) - Variable chat/RAG data
 * 3. Override Layer (Bottom) - Critical directives (recency bias)
 */
class PromptService {
    /**
     * Builds a stitched prompt following the Sandwich Pattern.
     * LLMs give more weight to instructions at the end (recency bias).
     */
    async buildStitchedPrompt(data) {
        const {
            agent, campaign, lead, product = {}, objectionPlaybook = [],
            strategy_graph = { nodes: [], edges: [] }, methodology = {}, icp = {},
            nodeDirective = "", chatHistory = [], ragContext = "", emotionalAdjustment = "",
            scopePolicy = "READ_ONLY"
        } = data;

        // === LAYER 1: DNA (Top - Immutable Identity) ===
        const dnaLayer = this.#buildDnaLayer(agent);

        // === LAYER 2: CONTEXT (Middle - Variable Data) ===
        const contextLayer = this.#buildContextLayer({
            agent, campaign, lead, product, objectionPlaybook,
            strategy_graph, methodology, icp, chatHistory, ragContext,
            emotionalAdjustment, scopePolicy
        });

        // === LAYER 3: OVERRIDE (Bottom - Critical Directives) ===
        const overrideLayer = this.#buildOverrideLayer(nodeDirective, lead);

        // Sandwich Pattern: DNA → Context → Override (recency bias)
        return `${dnaLayer}\n\n${contextLayer}\n\n${overrideLayer}`;
    }

    /**
     * Layer 1: DNA - Immutable agent identity and brand voice.
     */
    #buildDnaLayer(agent) {
        const dna = agent?.dna_config || {};
        const identity = dna.identity || {};
        const brandVoice = dna.brand_voice || {};
        const compliance = dna.compliance || {};

        return `
<agent_dna type="immutable">
    <identity>
        <name>${agent?.name || identity.name || 'SDR'}</name>
        <role>${identity.role || agent?.role || 'Sales Development Representative'}</role>
        <company>${identity.company || agent?.company_context?.name || 'ÁXIS'}</company>
    </identity>
    
    <brand_voice>
        <tone>${[agent?.tone, ...(brandVoice.tone || [])].filter(Boolean).join(', ') || 'profissional'}</tone>
        <personality>${agent?.personality || 'N/A'}</personality>
        <prohibited_words>${brandVoice.prohibited_words?.join(', ') || 'N/A'}</prohibited_words>
        <emojis_allowed>${brandVoice.emojis_allowed !== false ? 'sim' : 'não'}</emojis_allowed>
        <language>${agent?.language_code || agent?.language || 'pt-BR'}</language>
    </brand_voice>
    
    <compliance>
        <legal_rules>${compliance.legal_rules?.join('; ') || 'Respeite LGPD'}</legal_rules>
        <data_handling>${compliance.data_handling || 'Não solicite dados sensíveis'}</data_handling>
    </compliance>
</agent_dna>`;
    }

    /**
     * Layer 2: Context - Variable chat history, RAG, product info.
     */
    #buildContextLayer(data) {
        const { agent, campaign, lead, product, objectionPlaybook,
            methodology, icp, ragContext, emotionalAdjustment, scopePolicy, chatHistory } = data;

        // Tone Vector
        const tone = agent?.tone_vector || { formality: 3, humor: 2, enthusiasm: 3, respect: 3 };

        const scopeWarning = scopePolicy === 'READ_ONLY'
            ? "MANDATÓRIO: Você está em modo LEITURA. Não sugira alterações nos dados do lead (crm_actions proibido)."
            : "Você tem permissão para sugerir atualizações nos dados do lead via crm_actions.";

        // Product Context
        const safeProduct = product || {};
        const productName = safeProduct.label || safeProduct.name || 'Nossa Solução';
        const productBenefit = safeProduct.mainBenefit || safeProduct.description || 'Uma solução premium.';

        // Objection Playbook
        const playbookEntries = objectionPlaybook.map(obj => {
            const triggers = [obj.objectionType, ...obj.responses.map(r => r.trigger)].filter(Boolean);
            return `<entry trigger="${triggers.join(', ')}">${obj.responses.map(r => r.response).join(' | ')}</entry>`;
        }).join('\n');

        const historyFormatted = chatHistory && chatHistory.length > 0
            ? chatHistory.map(m => `[${m.role === 'assistant' ? 'Você' : 'Lead'}]: ${m.content}`).join('\n')
            : 'Nenhuma mensagem anterior. Este é o primeiro contato.';

        const safeMethodology = methodology || {};

        return `
<context type="variable">
    ${emotionalAdjustment}
    <scope_policy>${scopeWarning}</scope_policy>
    
    <tone_configuration>
        <formality level="${tone.formality}/5">${tone.formality > 3 ? 'Formal' : 'Casual'}</formality>
        <humor level="${tone.humor}/5">${tone.humor > 3 ? 'Leve humor permitido' : 'Sério, factual'}</humor>
        <enthusiasm level="${tone.enthusiasm}/5">${tone.enthusiasm > 3 ? 'Alta energia!' : 'Calmo'}</enthusiasm>
    </tone_configuration>
    
    <product_context>
        <name>${productName}</name>
        <core_benefit>${productBenefit}</core_benefit>
        <price>${safeProduct.price || 'Consulte'}</price>
        <differentials>${safeProduct.differentials?.join(', ') || 'N/A'}</differentials>
    </product_context>
    
    <target_context>
        <industry>${icp.industries?.[0] || campaign?.industry_taxonomy?.primary || 'Geral'}</industry>
        <pain_points>${icp.painPoints?.join(', ') || 'Eficiência operacional'}</pain_points>
    </target_context>
    
    <sales_methodology>
        <framework>${safeMethodology.framework || 'SPIN'}</framework>
        <stages>${safeMethodology.steps?.map(s => s.name).join(' → ') || 'Situação → Problema → Implicação → Necessidade'}</stages>
    </sales_methodology>
    
    ${ragContext ? `<rag_context>\n${ragContext}\n</rag_context>` : ''}
    
    <objection_playbook>${playbookEntries || '<entry>Sem playbook configurado</entry>'}</objection_playbook>
    
    <lead_info>
        <name>${lead?.name || 'Prospect'}</name>
        <status>${lead?.status || 'New'}</status>
        <qualification_summary>${lead?.custom_fields?.qualification_summary || 'N/A'}</qualification_summary>
        <data>${JSON.stringify(lead?.custom_fields || {})}</data>
    </lead_info>

    <chat_history important="true">
        ${historyFormatted}
    </chat_history>
    
    <handoff_triggers>
        Se o lead disser algo como "quero falar com humano", "atendente real", "pessoa de verdade", "não é robô", 
        você DEVE incluir no response JSON: "crm_actions": [{"action": "request_handoff", "reason": "Lead solicitou atendente humano"}]
    </handoff_triggers>
</context>`;
    }

    /**
     * Layer 3: Override - Critical directives that MUST be followed.
     * Placed at the end for LLM recency bias.
     */
    #buildOverrideLayer(nodeDirective, lead) {
        const nodeVars = lead?.node_variables || {};
        const microGoals = nodeVars.micro_goals?.join(', ') || '';
        const currentCta = nodeVars.current_cta || '';

        return `
<override type="critical" priority="maximum">
    <current_step_objective>
        ${nodeDirective || 'Continue a conversa de forma natural.'}
    </current_step_objective>
    
    ${microGoals ? `<micro_goals>${microGoals}</micro_goals>` : ''}
    ${currentCta ? `<mandatory_cta>VOCÊ DEVE TERMINAR COM: ${currentCta}</mandatory_cta>` : ''}
    
    <critical_rules>
        1. Use mensagens CURTAS e DIVIDIDAS (array "messages"). Imite o ritmo humano (várias mensagens curtas).
        2. SEMPRE responda em JSON válido.
        3. Se o lead disser NÃO/PARAR, marque como LOST.
        4. NUNCA prometa descontos sem autorização explícita.
        5. SE HOUVER <mandatory_cta>, termine obrigatoriamente com ele.
        6. SE O LEAD QUISER COMPRAR/FECHAR ("quero", "topo", "bora"), marque "ready_to_close": true.
    </critical_rules>
    
    <response_format>
        RESPONDA APENAS com este JSON:
        {
            "thought": "Raciocínio interno...",
            "messages": ["Primeira frase...", "Segunda frase (quebra de linha natural)"],
            "ready_to_close": false,
            "crm_actions": [],
            "sentiment_score": 0.5,
            "confidence_score": 0.9,
            "qualification_slots": {
                "budget": "unknown",
                "authority": "unknown", 
                "need": "unknown",
                "timeline": "unknown"
            }
        }
    </response_format>
</override>`;
    }
}

module.exports = PromptService;
