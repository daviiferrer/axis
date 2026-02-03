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

// --- 7. Identity & Roles (Source of Truth) ---
const Identity = {
    Role: {
        SDR: 'Sales Development Representative',
        SUPPORT: 'Customer Support Specialist',
        EXECUTIVE: 'Account Executive',
        ONBOARDING: 'Onboarding Specialist',
        CONSULTANT: 'Technical Consultant',
        CONCIERGE: 'Concierge / Receptionist'
    }
};

// --- 8. Sales & Qualification ---
const SalesMethodology = {
    Framework: { SPIN: 'SPIN', BANT: 'BANT', GPCT: 'GPCT', MEDDIC: 'MEDDIC' },
    QualificationSlots: {
        NEED: 'need',
        BUDGET: 'budget',
        AUTHORITY: 'authority',
        TIMELINE: 'timeline',
        SOLUTION: 'solution',
        TIMING: 'timing'
    }
};

// --- 9. Industry Verticals (Business Context) ---
const Industry = {
    ADVOCACIA: 'ADVOCACIA',
    OFICINA_MECANICA: 'OFICINA_MECANICA',
    ASSISTENCIA_TECNICA: 'ASSISTENCIA_TECNICA',
    IMOBILIARIA: 'IMOBILIARIA',
    CLINICA: 'CLINICA',
    ECOMMERCE: 'ECOMMERCE',
    SAAS: 'SAAS',
    AGENCIA: 'AGENCIA',
    CONSULTORIA: 'CONSULTORIA',
    ACADEMIA: 'ACADEMIA',
    RESTAURANTE: 'RESTAURANTE',
    GENERIC: 'GENERIC'
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
    LOW_PLEASURE: `⚠️ ALERTA: Lead INSATISFEITO detectado (pleasure < 0.3)
        - PAUSE qualquer tentativa de venda
        - RECONHEÇA o problema: "Entendo sua frustração..."
        - SE você causou, PEÇA DESCULPAS: "Desculpa se não fui claro..."
        - FOQUE em resolver antes de avançar
        - Tom: Sério, profissional, sem brincadeiras
        - Objetivo: Reverter o sentimento negativo primeiro`,

    HIGH_AROUSAL_NEG: `🔥 ALERTA: Lead IRRITADO/FRUSTRADO (alta energia negativa)
        - Ele está bravo. DESESCALE primeiro.
        - Frases curtas e objetivas (nada de textão)
        - VALIDE: "Faz sentido você estar frustrado..."
        - NÃO justifique/defenda, apenas acolha
        - SE continuar agressivo: "Quer que a gente converse outro momento?"
        - Objetivo: Acalmar antes de qualquer outra ação`,

    HIGH_AROUSAL_POS: `🎉 Lead ENTUSIASMADO (alta energia positiva)
        - ACOMPANHE a energia! Use exclamações
        - Seja empolgado junto: "Que legal!", "Show!"
        - Momento ideal para avançar no objetivo
        - Aproveite o momentum positivo`,

    LOW_AROUSAL: `😴 Lead DESENGAJADO (baixa energia)
        - Respostas curtas, sem entusiasmo
        - REACENDA interesse com pergunta provocativa
        - Ou ofereça benefício direto e tangível
        - SE persistir: "Quer que eu mande por aqui pra você ver depois?"`,

    HIGH_DOMINANCE: `👔 Lead CONTROLADOR (quer dominar conversa)
        - Seja DIRETO e objetivo
        - DÊ opções: "Você prefere X ou Y?"
        - NÃO pressione, ele quer decidir
        - Postura de consultor, não vendedor`,

    LOW_DOMINANCE: `🤔 Lead INDECISO (precisa de guia)
        - ASSUMA liderança na conversa
        - RECOMENDE: "O ideal seria fazermos X..."
        - Faça escolhas por ele quando apropriado
        - Tom: Confiante e assertivo`,

    HIGH_PLEASURE: `😊 Lead FELIZ (ótimo humor)
        - Momento ideal para avançar!
        - Pode usar humor leve se DNA permitir
        - Aproveite para fechar próximo passo
        - Tom: Descontraído e amigável`
};

const _SAFETY_DEFAULTS = {
    MIN_SENTIMENT: 0.2,
    MIN_CONFIDENCE: 0.5
};

function resolveDNA(dnaConfig) {
    let config = dnaConfig || {}; // Handle defaults carefully

    // FIX: dna_config may come as JSON string from DB
    if (typeof config === 'string') {
        try {
            config = JSON.parse(config);
        } catch (e) {
            console.error('[resolveDNA] ❌ Failed to parse dna_config:', e.message);
            config = {};
        }
    }

    // DEBUG: Log burstiness resolution
    console.log('[resolveDNA] 🎯 Physics config:', {
        hasPhysics: !!config.physics,
        burstinessEnabled: config.physics?.burstiness?.enabled,
        chronemicsBurstiness: config.chronemics?.burstiness
    });

    // 1. Resolve Physics (Chronemics)
    const latencyEnum = config.chronemics?.latency_profile || 'MODERATE';

    // Support both canonical path (chronemics.burstiness) and direct path (physics.burstiness)
    // Direct path is used by agents stored in DB with their own physics config
    let burstinessConfig = _BURSTINESS_MAP['MEDIUM']; // Default to MEDIUM for more human behavior

    if (config.physics?.burstiness?.enabled !== undefined) {
        // Direct physics config from DB (preferred)
        burstinessConfig = config.physics.burstiness;
        console.log('[resolveDNA] Using direct physics.burstiness:', burstinessConfig);
    } else if (config.chronemics?.burstiness) {
        // Canonical enum path
        const burstEnum = config.chronemics.burstiness;
        burstinessConfig = _BURSTINESS_MAP[burstEnum] || _BURSTINESS_MAP['MEDIUM'];
        console.log('[resolveDNA] Resolved from chronemics:', { burstEnum, burstinessConfig });
    }

    const physics = {
        typing: _LATENCY_MAP[latencyEnum],
        burstiness: burstinessConfig
    };

    console.log('[resolveDNA] ✅ Final physics:', physics);

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
    Identity, SalesMethodology, Industry,
    resolveDNA,
    PAD_INTERPRETATION: _PAD_INTERPRETATION,
    EMOTIONAL_INSTRUCTIONS: _EMOTIONAL_INSTRUCTIONS,
    SAFETY_DEFAULTS: _SAFETY_DEFAULTS
};
