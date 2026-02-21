const logger = require('../../../shared/Logger').createModuleLogger('voice-service');
const EmotionalStateService = require('../ai/EmotionalStateService');
const QwenTtsProvider = require('./providers/QwenTtsProvider');
const LmntTtsProvider = require('./providers/LmntTtsProvider');
const ModelPricingService = require('../ai/ModelPricing');

class VoiceService {
    constructor({ settingsService, supabaseClient }) {
        this.settingsService = settingsService;
        this.supabase = supabaseClient;
        this.emotionalService = new EmotionalStateService({ supabaseClient });

        // Provider registry (Strategy Pattern)
        this.providers = {
            qwen: new QwenTtsProvider(),
            lmnt: new LmntTtsProvider(), // Register LMNT
        };

        this.defaultProvider = 'qwen';
    }

    // =========================================
    // Speech Synthesis (TTS)
    // =========================================

    /**
     * Converts text to speech using a cloned voice.
     * @param {string} text - Text to speak
     * @param {string} voiceId - Voice ID from enrollment
     * @param {string} [instruction] - Emotional instruction
     * @param {string} [providerName] - Provider to use
     * @param {object} [options] - Extra context (leadId, agentId, voiceConfig)
     * @returns {Promise<string|null>} Audio as Base64
     */
    async synthesize(text, voiceId, instruction = '', providerName, options = {}) {
        const provider = this.#getProvider(providerName);
        const apiKey = await this.#getApiKey(providerName, options.userId);

        if (!apiKey) {
            logger.warn({ provider: provider.name, userId: options.userId }, '⚠️ TTS API Key missing. Skipping synthesis.');
            return null;
        }

        // --- DYNAMIC EMOTIONAL ADJUSTMENT (LMNT ONLY) ---
        let synthesisOptions = {};

        if (provider.name === 'lmnt' && options.voiceConfig) {
            const { speed = 1.0, temperature = 0.5, dynamic_emotion = false } = options.voiceConfig;

            // 1. Start with Base Personality
            let finalSpeed = parseFloat(speed);
            let finalTemp = parseFloat(temperature);

            // 2. Apply Emotional Modifiers if Enabled
            if (dynamic_emotion && options.leadId && options.agentId) {
                const pad = await this.emotionalService.getPadVector(options.leadId, options.agentId);

                if (pad) {
                    logger.debug({ pad, leadId: options.leadId }, '🧠 Adjusting Voice based on Lead Emotion (PAD)');

                    // High Arousal (Excited/Angry) -> Speak Faster & More Expressive
                    if (pad.arousal > 0.7) {
                        finalSpeed *= 1.1; // +10% Speed
                        finalTemp += 0.2;  // +0.2 Temp
                    }
                    // Low Pleasure (Sad/Frustrated) -> Speak Slower & Repressed
                    else if (pad.pleasure < 0.3) {
                        finalSpeed *= 0.9; // -10% Speed
                        finalTemp -= 0.1;  // -0.1 Temp (Calmer/Flatter)
                    }

                    // Clamp values
                    finalSpeed = Math.max(0.25, Math.min(2.0, finalSpeed));
                    finalTemp = Math.max(0.0, Math.min(1.0, finalTemp));
                }
            }

            synthesisOptions = {
                speed: finalSpeed,
                temperature: finalTemp,
                // seed: ... (optional)
            };
        }

        const audioBase64 = await provider.synthesize(apiKey, text, voiceId, instruction, synthesisOptions);

        if (audioBase64) {
            // Track TTS usage for billing
            this._logUsage(provider.name, text.length, options);
        }

        return audioBase64;
    }

    // =========================================
    // Provider Resolution
    // =========================================

    /**
     * Get the TTS provider instance by name.
     * @param {string} providerName 
     * @returns {object} Provider instance
     */
    #getProvider(providerName) {
        const name = providerName || this.defaultProvider;
        const provider = this.providers[name];
        if (!provider) {
            throw new Error(`Unknown TTS provider: "${name}". Available: ${Object.keys(this.providers).join(', ')}`);
        }
        return provider;
    }

    // Overloading #getApiKey to accept userId optionally
    async #getApiKey(providerName, userId) {
        const name = providerName || this.defaultProvider;

        if (name === 'qwen') {
            return this.settingsService.getDashscopeApiKey();
        }

        if (name === 'lmnt') {
            // 1. If we have a userId, fetch from profiles
            if (userId) {
                const { data, error } = await this.supabase
                    .from('profiles')
                    .select('lmnt_api_key')
                    .eq('id', userId)
                    .single();

                if (!error && data?.lmnt_api_key) {
                    return data.lmnt_api_key;
                }
            }
            // 2. Global System Settings Fallback
            const globalKey = await this.settingsService.getLmntApiKey();
            if (globalKey) return globalKey;

            // 3. Env var fallback
            if (process.env.LMNT_API_KEY) return process.env.LMNT_API_KEY;
        }

        return null;
    }

    // =========================================
    // Decision Logic (DETERMINISTIC - No AI)
    // =========================================

    /**
     * Determines if the current response should be Voice.
     * @param {object} voiceConfig - Agent's voice_config from dna_config
     * @param {object} context - Turn context (lastMessage, turnCount, intent, nodeGoal)
     * @returns {boolean}
     */
    shouldUseVoice(voiceConfig, context) {
        if (!voiceConfig?.enabled) return false;

        const mode = voiceConfig.response_mode;

        if (mode === 'voice_only') return true;
        if (mode === 'text_only') return false;

        if (mode === 'mirror') {
            return !!context.lastMessage?.is_voice_message;
        }

        if (mode === 'hybrid') {
            const triggers = voiceConfig.triggers || {};
            if (triggers.first_message && context.turnCount === 0) return true;
            if (triggers.mirror_audio && context.lastMessage?.is_voice_message) return true;
            if (triggers.after_objection && context.intent === 'OBJECTION') return true;
            if (triggers.on_close && (context.nodeGoal === 'CLOSE_SALE' || context.intent === 'CLOSING')) return true;
        }

        return false;
    }

    // =========================================
    // Voice Enrollment (Cloning)
    // =========================================

    /**
     * Enrolls a voice from a short audio sample.
     * @param {string} audioBase64 - Audio in Base64 (3-15s)
     * @param {string} voiceName - Friendly name for the voice
     * @param {string} [description] - Friendly description
     * @param {string} [providerName] - Provider to use (default: 'qwen')
     * @param {string} [userId] - User ID for storing the clone record
     * @param {string} [agentId] - Agent ID to associate with
     * @returns {Promise<{voice_id: string, provider: string}>}
     */
    async enrollVoice(audioBase64, voiceName = 'custom-voice', description, providerName, userId, agentId) {
        const provider = this.#getProvider(providerName);
        const apiKey = await this.#getApiKey(providerName, userId); // PAss userId

        if (!apiKey) {
            throw new Error(`API Key for TTS provider "${provider.name}" not configured. Go to System Settings or Profile.`);
        }

        const voiceId = await provider.enrollVoice(apiKey, audioBase64, voiceName);

        // 2. Persist to voice_clones table & Storage
        if (userId) {
            let sampleUrl = null;
            try {
                // Upload original sample to Storage
                const buffer = Buffer.from(audioBase64.replace(/^data:image\/\w+;base64,/, "").replace(/^data:audio\/\w+;base64,/, ""), 'base64');
                const fileName = `${userId}/${voiceId}_${Date.now()}.mp3`;

                const { error: uploadError } = await this.supabase.storage
                    .from('voice_samples')
                    .upload(fileName, buffer, {
                        contentType: 'audio/mpeg',
                        upsert: true
                    });

                if (!uploadError) {
                    const { data: publicUrlData } = this.supabase.storage
                        .from('voice_samples')
                        .getPublicUrl(fileName);
                    sampleUrl = publicUrlData.publicUrl;
                } else {
                    logger.warn({ error: uploadError.message }, '⚠️ Failed to upload voice sample to Storage');
                }

                await this.supabase.from('voice_clones').insert({
                    user_id: userId,
                    agent_id: agentId || null,
                    voice_id: voiceId,
                    provider: provider.name,
                    name: voiceName,
                    description: description || null,
                    sample_url: sampleUrl, // New field for playback
                    metadata: {
                        enrolled_at: new Date().toISOString(),
                        model: provider.synthesisModel || provider.name
                    }
                });
                logger.info({ voiceId, userId, sampleUrl }, '💾 Voice clone saved to DB with sample');
            } catch (dbErr) {
                logger.warn({ err: dbErr.message }, '⚠️ Failed to persist voice clone to DB (voice still usable)');
            }
        }

        return { voice_id: voiceId, provider: provider.name, sample_url: null }; // sample_url not strictly needed in return but good for debug
    }

    // =========================================
    // Voice Management
    // =========================================

    /**
     * List all cloned voices for a user or agent.
     * @param {string} userId
     * @param {string} [agentId] - Optional filter by agent
     * @returns {Promise<Array>}
     */
    async listVoices(userId, agentId) {
        // We now show ALL voices belonging to the user (Global Library)
        // Regardless of which agent they were created for.
        const query = this.supabase
            .from('voice_clones')
            .select('*')
            .eq('user_id', userId)
            .eq('is_active', true)
            .order('created_at', { ascending: false });

        const { data, error } = await query;
        if (error) {
            logger.error({ err: error.message }, '❌ Failed to list voices');
            throw error;
        }
        return data || [];
    }

    /**
     * Delete a cloned voice (soft delete + provider cleanup).
     * @param {string} cloneId - UUID from voice_clones table
     * @param {string} userId - For ownership validation
     * @returns {Promise<boolean>}
     */
    async deleteVoice(cloneId, userId) {
        // Get the clone record
        const { data: clone, error: fetchErr } = await this.supabase
            .from('voice_clones')
            .select('*')
            .eq('id', cloneId)
            .eq('user_id', userId)
            .single();

        if (fetchErr || !clone) {
            logger.warn({ cloneId }, '⚠️ Voice clone not found or access denied');
            return false;
        }

        // Try to delete from provider
        try {
            const provider = this.#getProvider(clone.provider);
            const apiKey = await this.#getApiKey(clone.provider, userId); // PAss userId
            if (apiKey) {
                await provider.deleteVoice(apiKey, clone.voice_id);
            }
        } catch (providerErr) {
            logger.warn({ err: providerErr.message }, '⚠️ Provider deletion failed (marking inactive anyway)');
        }

        // Soft delete in DB
        const { error: updateErr } = await this.supabase
            .from('voice_clones')
            .update({ is_active: false })
            .eq('id', cloneId);

        if (updateErr) {
            logger.error({ err: updateErr.message }, '❌ Failed to deactivate voice clone');
            return false;
        }

        logger.info({ cloneId, voiceId: clone.voice_id }, '🗑️ Voice clone deactivated');
        return true;
    }

    /**
     * Generate a preview audio for a cloned voice.
     * @param {string} voiceId - Voice ID from enrollment
     * @param {string} text - Preview text
     * @param {string} [providerName]
     * @returns {Promise<string|null>} Audio as base64
     */
    async previewVoice(voiceId, text, providerName, options = {}) {
        const previewText = text || 'Olá! Esta é uma prévia da minha voz clonada. Como você está?';
        return this.synthesize(previewText, voiceId, '', providerName, options); // use synthesize method
    }

    // =========================================
    // Billing & Tracking
    // =========================================

    /**
     * Logs TTS Usage to Supabase (Async - Fire & Forget)
     */
    async _logUsage(providerName, characterCount, context = {}) {
        if (!this.settingsService?.supabase) return;

        const { companyId, campaignId, userId, leadId } = context;
        if (!userId && !companyId) return; // Need an owner

        try {
            const isUUID = (str) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

            // Calculate Cost using 2026 Real Pricing
            // For TTS, we use character count as tokens_input
            const cost = ModelPricingService.calculateCost(providerName, characterCount, 0);

            const logEntry = {
                user_id: isUUID(userId) ? userId : null,
                company_id: isUUID(companyId) ? companyId : null,
                campaign_id: isUUID(campaignId) ? campaignId : null,
                lead_id: isUUID(leadId) ? leadId : null,
                model: providerName, // lmnt or qwen
                provider: providerName,
                tokens_input: characterCount,
                tokens_output: 0,
                cost_usd: cost,
                purpose: 'voice_synthesis',
                metadata: {}
            };

            const { error } = await this.settingsService.supabase.from('usage_events').insert(logEntry);

            if (error) {
                logger.error({ error: error.message, provider: providerName }, 'Supabase TTS usage insert failed');
            } else {
                logger.debug({ provider: providerName, cost, characters: characterCount }, 'Voice TTS usage logged successfully');
            }
        } catch (e) {
            logger.error({ error: e.message }, 'Failed to log Voice TTS usage');
        }
    }
}

module.exports = VoiceService;
