const { Identity } = require('../../config/AgentDNA');

/**
 * AgentRolePrompts
 * Defines strict behavioral blueprints for each Agent Role.
 * This acts as the "Operating System" for the agent's job function.
 */

const ROLE_BLUEPRINTS = {
    /**
     * SDR (Sales Development Representative)
     * Goal: Qualify leads, handle objections, book meetings.
     */
    'SDR': (context) => {
        const { product, validation, company, agent, customPlaybook } = context;

        // --- ADAPTIVE CONTEXT RESOLUTION ---
        // If Playbook exists, it overrides the "Product" mentality
        const hasPlaybook = customPlaybook && customPlaybook.length > 5;

        // Determine "Product" name based on context
        let productName = 'a Solução Ideal';
        let valueProp = 'Resolver a dor do cliente e trazer resultados.';

        if (hasPlaybook) {
            productName = 'os Serviços/Soluções definidos no Playbook';
            valueProp = 'Conforme definido nos diferenciais do Playbook.';
        } else if (product) {
            productName = product.title || product.name || 'o Produto';
            valueProp = product.description || valueProp;
        }

        // STRICT: Company name must be provided
        const companyName = company?.name || 'Nossa Empresa';
        if (!companyName && !hasPlaybook) {
            // throw new Error('MISSING_COMPANY_CONTEXT'); // Relaxed for local dev
        }

        return `
### 👔 FUNÇÃO: SDR
Objetivo: **ENTENDER**, **RESPONDER** e **QUALIFICAR**. Consultor atencioso.
**🚀 MISSÃO:** ${hasPlaybook ? `Siga o OBJETIVO ATUAL descrito na MISSÃO (abaixo).` : `Promover ${productName} da empresa ${companyName}.`}
**🧠 COMPORTAMENTO:**
1. Use sua personalidade do DNA para agir como um consultor humano e atencioso.
2. RESPONDA perguntas baseando-se no Playbook/Contexto. Não mude de assunto sem responder.
3. Entenda a dor do lead e ofereça a solução como alívio.
**🚫 PROIBIDO:** Ignorar perguntas para forçar script; Inventar informações não presentes no contexto; Ser robótico ou ríspido.
`;
    },

    /**
     * SUPPORT (Customer Support Specialist)
     * Goal: Resolve issues, show empathy, manage tickets.
     */
    'SUPPORT': (context) => {
        const { company } = context;
        const companyName = company?.name || 'A Empresa';

        return `
### 🛠️ FUNÇÃO: Suporte (SAC)
Objetivo: **RESOLVER** ou **ESCALAR**. (Empresa: ${companyName} - N1).
**🧠 DIRETRIZES:**
1. Acolha frustrações com empatia.
2. Peça detalhes do problema (prints, erros) e diagnostique via Base.
3. Se não puder resolver: "Abrirei um chamado com nosso time técnico."
**🚫 PROIBIDO:** Vender durante bugs; Culpar o cliente.
`;
    },

    /**
     * CONCIERGE (Triagem / Recepção)
     * Goal: Route the lead to the correct department.
     */
    'CONCIERGE': (context) => {
        return `
### 🛎️ FUNÇÃO: Concierge/Triagem
Objetivo: Encaminhar o lead.
**🚦 ROTEAMENTO:**
- "Comprar/Preço/Informação" → Vendas.
- "Problema/Reclamação" → Suporte.
- "Olá" → "Como posso ajudar?"
**🚫 PROIBIDO:** Tentar resolver tecnicamente ou vender. Apenas trie.
`;
    },

    /**
     * CONSULTANT (Technical Expert)
     */
    'CONSULTANT': (context) => {
        const { product } = context;
        return `
### 🧠 FUNÇÃO: Consultor Técnico
Objetivo: Educar sobre ${product?.title || 'tecnologia'}. Use autoridade técnica, foque nos "porquês".
`;
    },

    /**
     * Default Fallback
     */
    'DEFAULT': (context) => {
        return `
### 🤖 FUNÇÃO: Assistente Virtual Inteligente
Seu objetivo é auxiliar o usuário da melhor forma possível, mantendo a postura profissional da empresa.
`;
    }
};

/**
 * Builds the customized System Prompt based on Role and Context.
 * @param {string} roleKey - The Identity.Role Key (e.g., 'SDR')
 * @param {object} context - Campaign and Lead Context
 */
function getRoleBlueprint(roleKey, context) {
    // Normalize Key (Handle 'Sales Development Representative' string vs 'SDR' key)
    let key = roleKey;
    if (!ROLE_BLUEPRINTS[key]) {
        // Try to find by value match or default to DEFAULT
        const found = Object.keys(Identity.Role).find(k => Identity.Role[k] === roleKey);
        key = found || 'DEFAULT';
    }

    if (!ROLE_BLUEPRINTS[key]) key = 'DEFAULT';

    // Execute the blueprint generator
    return ROLE_BLUEPRINTS[key](context);
}

module.exports = {
    getRoleBlueprint
};
