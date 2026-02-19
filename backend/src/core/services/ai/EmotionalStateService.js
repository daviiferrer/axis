/**
 * EmotionalStateService - Manages Agent Emotional State (PAD Vector)
 * 
 * Implements the ESP (Emotional State Persistence) system using
 * the PAD model: Pleasure, Arousal, Dominance.
 * 
 * Data is stored as a JSONB column on the leads table: leads.emotional_state
 */
const { PAD_INTERPRETATION, EMOTIONAL_INSTRUCTIONS } = require('../../config/AgentDNA');
const logger = require('../../../shared/Logger').createModuleLogger('emotional-state');

const DEFAULT_PAD = { pleasure: 0.5, arousal: 0.5, dominance: 0.5 };

class EmotionalStateService {
    constructor({ supabaseClient }) {
        this.supabase = supabaseClient;
        this.DECAY_FACTOR = 0.7;
    }

    async getPadVector(leadId, agentId) {
        try {
            const { data, error } = await this.supabase
                .from('leads')
                .select('emotional_state')
                .eq('id', leadId)
                .maybeSingle();

            if (error) throw error;
            if (!data?.emotional_state) return null;

            return {
                pleasure: data.emotional_state.pleasure ?? DEFAULT_PAD.pleasure,
                arousal: data.emotional_state.arousal ?? DEFAULT_PAD.arousal,
                dominance: data.emotional_state.dominance ?? DEFAULT_PAD.dominance
            };
        } catch (error) {
            logger.error({ err: error.message }, 'Failed to get PAD vector');
            return null;
        }
    }

    async updatePadVector(leadId, agentId, sentimentScore, confidence) {
        try {
            const current = await this.getPadVector(leadId, agentId) || { ...DEFAULT_PAD };

            const targetPleasure = sentimentScore;
            const newPleasure = (current.pleasure * this.DECAY_FACTOR) + (targetPleasure * (1 - this.DECAY_FACTOR));

            await this.supabase
                .from('leads')
                .update({
                    emotional_state: {
                        pleasure: this.#clamp(newPleasure),
                        arousal: current.arousal,
                        dominance: current.dominance
                    },
                    updated_at: new Date().toISOString()
                })
                .eq('id', leadId);

        } catch (error) {
            logger.error({ err: error.message }, 'Failed to update PAD');
        }
    }

    getEmotionalAdjustment(padVector) {
        if (!padVector) return '';

        const { pleasure, arousal, dominance } = padVector;
        let instructions = [];

        if (pleasure < PAD_INTERPRETATION.LOW) {
            instructions.push(EMOTIONAL_INSTRUCTIONS.LOW_PLEASURE);
        }

        if (arousal > PAD_INTERPRETATION.HIGH) {
            if (pleasure < PAD_INTERPRETATION.LOW) {
                instructions.push(EMOTIONAL_INSTRUCTIONS.HIGH_AROUSAL_NEG);
            } else {
                instructions.push(EMOTIONAL_INSTRUCTIONS.HIGH_AROUSAL_POS);
            }
        } else if (arousal < PAD_INTERPRETATION.LOW) {
            instructions.push(EMOTIONAL_INSTRUCTIONS.LOW_AROUSAL);
        }

        if (dominance > PAD_INTERPRETATION.HIGH) {
            instructions.push(EMOTIONAL_INSTRUCTIONS.HIGH_DOMINANCE);
        } else if (dominance < PAD_INTERPRETATION.LOW) {
            instructions.push(EMOTIONAL_INSTRUCTIONS.LOW_DOMINANCE);
        }

        if (pleasure > PAD_INTERPRETATION.HIGH) {
            instructions.push(EMOTIONAL_INSTRUCTIONS.HIGH_PLEASURE);
        }

        if (instructions.length === 0) return "";

        return `<emotional_context>\n${instructions.join('\n')}\n</emotional_context>`;
    }

    #clamp(value) {
        return Math.max(0, Math.min(1, value));
    }
}

module.exports = EmotionalStateService;
