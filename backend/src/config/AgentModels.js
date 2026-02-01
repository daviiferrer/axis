/**
 * Defined AI Models supported by the system.
 * Based on user requirements for High Performance and Low Cost balance.
 */

const AgentModels = {
    GEMINI_2_5_FLASH: 'gemini-2.5-flash',
    GEMINI_2_5_FLASH_LITE: 'gemini-2.5-flash-lite',
    GEMINI_3_FLASH_PREVIEW: 'gemini-3-flash',


    // Legacy/Fallback (optional, but requested to standardize on above)
    // We keep them mapped if needed, but UI should show top 3.
};

const SupportedModels = [
    {
        id: AgentModels.GEMINI_2_5_FLASH,
        name: 'Gemini 2.5 Flash',
        description: 'Melhor custo-benefício. Rápido, com raciocínio e barato.',
        provider: 'gemini',
        contextWindow: 1048576
    },
    {
        id: AgentModels.GEMINI_2_5_FLASH_LITE,
        name: 'Gemini 2.5 Flash-Lite',
        description: 'Extremamente rápido e econômico. Ideal para triagem simples.',
        provider: 'gemini',
        contextWindow: 1048576
    },
    {
        id: AgentModels.GEMINI_3_FLASH_PREVIEW,
        name: 'Gemini 3 Flash (Preview)',
        description: 'Próxima geração. Raciocínio avançado (Thinking) com velocidade Flash.',
        provider: 'gemini',
        contextWindow: 1048576
    }
];

module.exports = {
    AgentModels,
    SupportedModels
};
