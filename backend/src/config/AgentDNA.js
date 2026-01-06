/**
 * AgentDNA Configuration
 * PAD Model (Pleasure-Arousal-Dominance) for Emotional State
 */

const PAD_INTERPRETATION = {
    LOW: 0.3,
    MEDIUM: 0.5,
    HIGH: 0.7
};

const EMOTIONAL_INSTRUCTIONS = {
    LOW_PLEASURE: '⚠️ O lead está com humor negativo. Seja empático, evite pressão de vendas.',
    HIGH_PLEASURE: '✅ O lead está receptivo! Mantenha o entusiasmo e sugira próximos passos.',
    LOW_AROUSAL: '💤 O lead está desengajado. Faça perguntas para despertar interesse.',
    HIGH_AROUSAL_POS: '🔥 O lead está animado! Aproveite o momento para conduzir ao fechamento.',
    HIGH_AROUSAL_NEG: '😠 O lead está agitado/frustrado. Acalme a situação antes de prosseguir.',
    HIGH_DOMINANCE: '👑 O lead quer controle. Seja consultivo, não imperativo.',
    LOW_DOMINANCE: '🤝 O lead precisa de orientação. Seja mais diretivo nas sugestões.'
};

module.exports = {
    PAD_INTERPRETATION,
    EMOTIONAL_INSTRUCTIONS
};
