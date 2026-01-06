/**
 * EmotionalStateService - Manages Agent Emotional State (PAD Vector)
 * 
 * Implements the ESP (Emotional State Persistence) system using
 * the PAD model: Pleasure, Arousal, Dominance.
 */
const { createClient } = require('@supabase/supabase-js');
const { PAD_INTERPRETATION, EMOTIONAL_INSTRUCTIONS } = require('../../../config/AgentDNA');

/**
 * Service to manage Lead's Emotional State (PAD Model).
 * P: Pleasure (Valence)
 * A: Arousal (Energy)
 * D: Dominance (Control)
 */
class EmotionalStateService {
    constructor(supabaseClient) {
        this.supabase = supabaseClient;
        this.DECAY_FACTOR = 0.9; // Retention of previous state (0.9 = high retention)
    }

    // ... (rest of methods)

    getEmotionalAdjustment(padVector) {
        if (!padVector) return '';

        const { pleasure, arousal, dominance } = padVector;
        let instructions = [];

        // Low pleasure → be more careful and serious
        if (pleasure < PAD_INTERPRETATION.LOW) {
            instructions.push(EMOTIONAL_INSTRUCTIONS.LOW_PLEASURE);
        }

        // High arousal → match energy or calm down
        if (arousal > PAD_INTERPRETATION.HIGH) {
            if (pleasure < PAD_INTERPRETATION.LOW) {
                instructions.push(EMOTIONAL_INSTRUCTIONS.HIGH_AROUSAL_NEG);
            } else {
                instructions.push(EMOTIONAL_INSTRUCTIONS.HIGH_AROUSAL_POS);
            }
        } else if (arousal < PAD_INTERPRETATION.LOW) {
            instructions.push(EMOTIONAL_INSTRUCTIONS.LOW_AROUSAL);
        }

        // Dominance Handling
        if (dominance > PAD_INTERPRETATION.HIGH) {
            instructions.push(EMOTIONAL_INSTRUCTIONS.HIGH_DOMINANCE);
        } else if (dominance < PAD_INTERPRETATION.LOW) {
            instructions.push(EMOTIONAL_INSTRUCTIONS.LOW_DOMINANCE);
        }

        // High pleasure → be warmer
        if (pleasure > PAD_INTERPRETATION.HIGH) {
            instructions.push(EMOTIONAL_INSTRUCTIONS.HIGH_PLEASURE);
        }

        if (instructions.length === 0) return "";

        return `<emotional_context>\n${instructions.join('\n')}\n</emotional_context>`;
    }

    /**
     * Clamp value between 0 and 1.
     */
    #clamp(value) {
        return Math.max(0, Math.min(1, value));
    }
}

module.exports = EmotionalStateService;
