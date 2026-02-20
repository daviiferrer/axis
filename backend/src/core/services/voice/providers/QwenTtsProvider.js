const axios = require('axios');
const logger = require('../../../../shared/Logger').createModuleLogger('qwen-tts');

/**
 * QwenTtsProvider - Qwen3-TTS-VC via DashScope API
 * 
 * Implements voice enrollment (cloning) and speech synthesis
 * using the Qwen3-TTS-VC model via DashScope International API.
 * 
 * Provider Interface:
 *   - enrollVoice(apiKey, audioBase64, voiceName) → voiceId
 *   - synthesize(apiKey, text, voiceId) → audioBase64
 *   - deleteVoice(apiKey, voiceId) → boolean
 */
class QwenTtsProvider {
    constructor() {
        this.name = 'qwen';
        this.baseUrl = 'https://dashscope-intl.aliyuncs.com/api/v1';
        this.enrollmentModel = 'qwen-voice-enrollment';
        this.synthesisModel = 'qwen3-tts-vc-2026-01-22';
    }

    /**
     * Enroll (clone) a voice from a short audio sample.
     * @param {string} apiKey - DashScope API key
     * @param {string} audioBase64 - Raw base64 audio data (no data URI prefix)
     * @param {string} voiceName - Friendly name for the voice (alphanumeric, no spaces)
     * @returns {Promise<string>} The generated voice_id
     */
    async enrollVoice(apiKey, audioBase64, voiceName = 'clonedvoice') {
        // Sanitize voice name: Allows a-z, 0-9, and underscores. Min 1, Max 20 chars.
        // DashScope requires: 1-20 chars, letters, numbers, underscores.
        let safeName = voiceName.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 20);
        if (!safeName) safeName = `voice_${Date.now()}`;

        // Detect mime type from base64 header or default to mp3
        let mimeType = 'audio/mp3';
        let cleanBase64 = audioBase64;

        if (audioBase64.startsWith('data:')) {
            const match = audioBase64.match(/^data:([^;]+);base64,/);
            if (match) {
                mimeType = match[1];
                // Dashscope prefers mp3 over mpeg
                if (mimeType === 'audio/mpeg') mimeType = 'audio/mp3';
                cleanBase64 = audioBase64.replace(/^data:[^;]+;base64,/, '');
            }
        }

        const dataUri = `data:${mimeType};base64,${cleanBase64}`;

        const createPayload = (name) => ({
            model: this.enrollmentModel,
            input: {
                action: 'create',
                target_model: this.synthesisModel,
                preferred_name: name,
                audio: { data: dataUri }
            }
        });

        const executeEnrollment = async (nameToTry) => {
            logger.info({ voiceName: nameToTry, audioSize: cleanBase64.length }, '🎙️ Enrolling voice on DashScope (Qwen3)...');
            const response = await axios.post(
                `${this.baseUrl}/services/audio/tts/customization`,
                createPayload(nameToTry),
                {
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 30000
                }
            );
            return response.data?.output?.voice;
        };

        try {
            const voiceId = await executeEnrollment(safeName);
            if (!voiceId) throw new Error('No voice ID returned');
            logger.info({ voiceId }, '✅ Voice enrolled (Qwen3-TTS-VC)');
            return voiceId;
        } catch (error) {
            const detail = error.response?.data || error.message;
            const errorCode = detail?.code || '';
            const errorMessage = detail?.message || error.message;

            // HANDLE 1: NAME INVALID -> RETRY WITH FALLBACK
            if (errorCode === 'InvalidParameter' && errorMessage.includes('preferred_name')) {
                logger.warn({ failedName: safeName }, '⚠️ Enrollment name rejected, retrying with fallback...');
                try {
                    const fallbackName = `voice_${Date.now().toString().slice(-6)}`;
                    const voiceId = await executeEnrollment(fallbackName);
                    return voiceId;
                } catch (retryErr) {
                    throw new Error(`Voice enrollment failed (Retry): ${retryErr.response?.data?.message || retryErr.message}`);
                }
            }

            // HANDLE 2: DURATION LIMIT
            if (errorCode === 'Audio.DurationLimitError' || errorMessage.includes('duration')) {
                throw new Error('AUDIO_TOO_LONG: O áudio deve ter entre 3 e 60 segundos.'); // Frontend will catch this
            }

            logger.error({ err: detail }, '❌ Qwen voice enrollment failed');
            throw new Error(`Voice enrollment failed: ${JSON.stringify(detail)}`);
        }
    }

    /**
     * Synthesize text to speech using a cloned voice.
     * @param {string} apiKey - DashScope API key
     * @param {string} text - Text to speak
     * @param {string} voiceId - Voice ID from enrollment
     * @returns {Promise<string|null>} Audio as base64 string, or null on failure
     */
    async synthesize(apiKey, text, voiceId) {
        try {
            logger.debug({ voiceId, textLen: text.length }, '🗣️ Synthesizing with Qwen3-TTS-VC...');

            // Use DashScope MultiModalConversation-compatible endpoint
            const payload = {
                model: this.synthesisModel,
                input: {
                    text: text || 'Olá, esta é uma amostra da voz configurada.',
                    voice: voiceId
                },
                parameters: {
                    // voice: voiceId // MOVED TO INPUT
                }
            };

            logger.info({ payload: JSON.stringify(payload) }, '🔍 Qwen Synthesis Payload Debug');

            const response = await axios.post(
                `${this.baseUrl}/services/aigc/multimodal-generation/generation`,
                payload,
                {
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 60000
                }
            );

            // Extract audio URL from response
            const audioUrl = response.data?.output?.audio?.url;
            if (!audioUrl) {
                logger.warn({ response: JSON.stringify(response.data).substring(0, 300) }, '⚠️ No audio URL in response');
                return null;
            }

            // Download the audio file
            const audioResponse = await axios.get(audioUrl, {
                responseType: 'arraybuffer',
                timeout: 30000
            });

            const audioBase64 = Buffer.from(audioResponse.data, 'binary').toString('base64');
            logger.info({ audioSize: audioBase64.length }, '✅ Speech synthesized (Qwen3)');
            return audioBase64;

        } catch (error) {
            logger.error({ err: error.response?.data || error.message }, '❌ Qwen synthesis failed');
            return null;
        }
    }

    /**
     * Delete a cloned voice from DashScope.
     * @param {string} apiKey - DashScope API key
     * @param {string} voiceId - Voice ID to delete
     * @returns {Promise<boolean>}
     */
    async deleteVoice(apiKey, voiceId) {
        try {
            const payload = {
                model: this.enrollmentModel,
                input: {
                    action: 'delete',
                    voice_id: voiceId
                }
            };

            await axios.post(
                `${this.baseUrl}/services/audio/tts/customization`,
                payload,
                {
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 15000
                }
            );

            logger.info({ voiceId }, '🗑️ Voice deleted from DashScope');
            return true;
        } catch (error) {
            logger.error({ err: error.response?.data || error.message }, '❌ Voice deletion failed');
            return false;
        }
    }
}

module.exports = QwenTtsProvider;
