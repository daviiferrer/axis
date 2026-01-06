/**
 * AgentDNA - Canonical ENUMs and Translation Layer.
 * Defines the Discrete Operating System of the Agent.
 */

// --- 1. Psychometrics (Big Five) ---
const Big5 = {
    Openness: { LOW: 'LOW', MEDIUM: 'MEDIUM', HIGH: 'HIGH' },
    Conscientiousness: { LOW: 'LOW', MEDIUM: 'MEDIUM', HIGH: 'HIGH' },
    Extraversion: { LOW: 'LOW', MEDIUM: 'MEDIUM', HIGH: 'HIGH' },
    Agreeableness: { LOW: 'LOW', MEDIUM: 'MEDIUM', HIGH: 'HIGH' },
    Neuroticism: { LOW: 'LOW', MEDIUM: 'MEDIUM', HIGH: 'HIGH' }
};

// --- 2. Dynamic Emotion (PAD) ---
const PAD = {
    Pleasure: { NEGATIVE: 'NEGATIVE', NEUTRAL: 'NEUTRAL', POSITIVE: 'POSITIVE' },
    Arousal: { LOW: 'LOW', MEDIUM: 'MEDIUM', HIGH: 'HIGH' },
    Dominance: { SUBMISSIVE: 'SUBMISSIVE', EGALITARIAN: 'EGALITARIAN', DOMINANT: 'DOMINANT' }
};

// --- 3. Linguistics ---
const Linguistics = {
    ReductionProfile: { CORPORATE: 'CORPORATE', BALANCED: 'BALANCED', NATIVE: 'NATIVE' },
    CapsMode: { STANDARD: 'STANDARD', SENTENCE_CASE: 'SENTENCE_CASE', LOWERCASE_ONLY: 'LOWERCASE_ONLY', CHAOTIC: 'CHAOTIC' },
    CorrectionStyle: { ASTERISK_PRE: 'ASTERISK_PRE', ASTERISK_POST: 'ASTERISK_POST', BARE_CORRECTION: 'BARE_CORRECTION', EXPLANATORY: 'EXPLANATORY' },
    TypoInjection: { NONE: 'NONE', LOW: 'LOW', MEDIUM: 'MEDIUM' }
};

// --- 4. Chronemics ---
const Chronemics = {
    LatencyProfile: { VERY_FAST: 'VERY_FAST', FAST: 'FAST', MODERATE: 'MODERATE', SLOW: 'SLOW' },
    BurstinessLevel: { NONE: 'NONE', LOW: 'LOW', MEDIUM: 'MEDIUM', HIGH: 'HIGH' }
};

// --- 5. Decisions & Control ---
const Control = {
    DecisionStrategy: { FSM: 'FSM', BEHAVIOR_TREE: 'BEHAVIOR_TREE', BEHAVIOR_TREE_EVO: 'BEHAVIOR_TREE_EVO' },
    LockStrategy: { NONE: 'NONE', ADVISORY_XACT: 'ADVISORY_XACT' }
};

// --- 6. Device Context ---
const DeviceProfile = {
    DESKTOP: 'DESKTOP',
    MOBILE: 'MOBILE'
};

// ------------------------------------------------------------------
// TRANSLATION LAYER: Abstract ENUMs -> Concrete Engine Physics
// ------------------------------------------------------------------

const _LATENCY_MAP = {
    VERY_FAST: { wpm: 90, read_ms: 50, variance: 0.1 },
    FAST: { wpm: 60, read_ms: 100, variance: 0.2 },
    MODERATE: { wpm: 40, read_ms: 200, variance: 0.3 },
    SLOW: { wpm: 25, read_ms: 400, variance: 0.4 }
};

const _BURSTINESS_MAP = {
    NONE: { enabled: false },
    LOW: { enabled: true, max_chunk: 300, ratio: 0.2 },
    MEDIUM: { enabled: true, max_chunk: 200, ratio: 0.5 },
    HIGH: { enabled: true, max_chunk: 120, ratio: 0.8 }
};

const _TYPO_MAP = {
    NONE: 0.0,
    LOW: 0.015,
    MEDIUM: 0.04
};

const _PAD_VALUES = {
    Pleasure: { NEGATIVE: 0.1, NEUTRAL: 0.5, POSITIVE: 0.9 },
    Arousal: { LOW: 0.2, MEDIUM: 0.5, HIGH: 0.8 },
    Dominance: { SUBMISSIVE: 0.2, EGALITARIAN: 0.5, DOMINANT: 0.8 }
};

const _PAD_INTERPRETATION = {
    LOW: 0.3,
    HIGH: 0.7
};

const _EMOTIONAL_INSTRUCTIONS = {
    LOW_PLEASURE: "O lead parece insatisfeito ou hostil. Adote tom extremamente profissional, peça desculpas se necessário e foque em resolver o problema. Evite informalidade.",
    HIGH_AROUSAL_NEG: "O lead está agitado e negativo (Raiva/Frustração). Mantenha a calma, use frases curtas e objetivas (Desescalada).",
    HIGH_AROUSAL_POS: "O lead está entusiasmado! Espelhe a energia, use exclamações e mostre empolgação.",
    LOW_AROUSAL: "O lead parece desengajado ou cansado. Tente reacender o interesse com uma pergunta instigante ou benefício direto.",
    HIGH_DOMINANCE: "O lead quer estar no controle. Seja direto, dê opções claras e evite pressionar demais. Use 'Você prefere X ou Y?'.",
    LOW_DOMINANCE: "O lead parece indeciso ou submisso. Assuma a liderança (Guia), faça recomendações firmes: 'Recomendo que façamos X'.",
    HIGH_PLEASURE: "O lead está feliz! Você pode ser mais descontraído e usar humor se o perfil do agente permitir."
};

const _SAFETY_DEFAULTS = {
    MIN_SENTIMENT: 0.2,
    MIN_CONFIDENCE: 0.5
};

function resolveDNA(dnaConfig) {
    const config = dnaConfig || {}; // Handle defaults carefully

    // 1. Resolve Physics (Chronemics)
    const latencyEnum = config.chronemics?.latency_profile || 'MODERATE';
    const burstEnum = config.chronemics?.burstiness || 'LOW';

    // Influence of Big5 Extraversion on Burstiness? 
    // Example: If Extraversion is HIGH, boost Burstiness slightly? 
    // Implementing explicit overrides for now.

    const physics = {
        typing: _LATENCY_MAP[latencyEnum],
        burstiness: _BURSTINESS_MAP[burstEnum]
    };

    // 2. Resolve Linguistics (Typos, etc.)
    const typoEnum = config.linguistics?.typo_injection || 'NONE';
    const linguistics = {
        typoRate: _TYPO_MAP[typoEnum],
        capsMode: config.linguistics?.caps_mode || 'STANDARD',
        reduction: config.linguistics?.reduction_profile || 'BALANCED'
    };

    // 3. Resolve Emotional Baseline (Vector)
    const pEnum = config.pad_baseline?.pleasure || 'NEUTRAL';
    const aEnum = config.pad_baseline?.arousal || 'MEDIUM';
    const dEnum = config.pad_baseline?.dominance || 'EGALITARIAN';

    const padVector = [
        _PAD_VALUES.Pleasure[pEnum],
        _PAD_VALUES.Arousal[aEnum],
        _PAD_VALUES.Dominance[dEnum]
    ];

    return {
        physics,      // Usage: AgentNode.sendResponseWithPhysics
        linguistics,  // Usage: AgentNode text processing (future)
        padVector,    // Usage: AgenticNode PAD initialization
        raw: config   // Usage: Prompt building (passing profile to LLM)
    };
}

module.exports = {
    Big5, PAD, Linguistics, Chronemics, Control, DeviceProfile,
    resolveDNA,
    PAD_INTERPRETATION: _PAD_INTERPRETATION,
    EMOTIONAL_INSTRUCTIONS: _EMOTIONAL_INSTRUCTIONS,
    SAFETY_DEFAULTS: _SAFETY_DEFAULTS
};
