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

    async getPadVector(leadId, agentId) {
        try {
            const { data, error } = await this.supabase
                .from('emotional_state')
                .select('pleasure, arousal, dominance')
                .eq('lead_id', leadId)
                //.eq('agent_id', agentId) // Optional: if we track per agent
                .limit(1)
                .maybeSingle();

            if (error) throw error;
            if (!data) return null;

            return {
                pleasure: data.pleasure,
                arousal: data.arousal,
                dominance: data.dominance
            };
        } catch (error) {
            console.error('[EmotionalStateService] Failed to get PAD vector:', error.message);
            return null;
        }
    }

    async updatePadVector(leadId, agentId, sentimentScore, confidence) {
        // Simple implementation: decay current state and nudge towards new sentiment
        // This is a placeholder for the full PAD logic
        try {
            const current = await this.getPadVector(leadId, agentId) || { pleasure: 0.5, arousal: 0.5, dominance: 0.5 };

            // Map sentiment (-1 to 1) to Pleasure (0 to 1)
            // -1 -> 0, 0 -> 0.5, 1 -> 1
            const targetPleasure = (sentimentScore + 1) / 2;

            const newPleasure = (current.pleasure * this.DECAY_FACTOR) + (targetPleasure * (1 - this.DECAY_FACTOR));

            await this.supabase.from('emotional_state').upsert({
                lead_id: leadId,
                pleasure: newPleasure,
                arousal: current.arousal, // Todo: implement arousal logic
                dominance: current.dominance,
                updated_at: new Date().toISOString()
            }, { onConflict: 'lead_id' });

        } catch (error) {
            console.error('[EmotionalStateService] Failed to update PAD:', error.message);
        }
    }

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
