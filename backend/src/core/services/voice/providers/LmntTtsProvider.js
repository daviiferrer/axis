const Speech = require('lmnt-node');
const logger = require('../../../../shared/Logger').createModuleLogger('lmnt-provider');

class LmntTtsProvider {
    constructor() {
        this.name = 'lmnt';
        this.synthesisModel = 'aurora'; // Default model (aurora or blizzard)
    }

    /**
     * Enrolls a new voice using a short audio sample (Instant Voice Cloning).
     * @param {string} apiKey - LMNT API Key
     * @param {string} audioBase64 - Audio file in Base64
     * @param {string} voiceName - Name of the voice
     * @returns {Promise<string>} The generated voice_id
     */
    async enrollVoice(apiKey, audioBase64, voiceName) {
        const client = new Speech({ apiKey: apiKey }); // SDK version 2.x requires config object

        // Sanitize base64 (remove data header if present)
        let cleanBase64 = audioBase64;
        if (audioBase64.startsWith('data:')) {
            cleanBase64 = audioBase64.replace(/^data:audio\/\w+;base64,/, '');
        }

        const audioBuffer = Buffer.from(cleanBase64, 'base64');

        try {
            logger.info({ voiceName, size: audioBuffer.length }, '🎙️ Enrolling voice on LMNT...');

            // Build a File object from the raw buffer for the FormData payload
            const audioFile = new File([audioBuffer], "sample.mp3", { type: "audio/mpeg" });

            // Correct SDK usage for version 2.x
            const voice = await client.voices.create({
                name: voiceName,
                files: [audioFile],
                type: 'instant'
            });

            if (!voice || !voice.id) {
                throw new Error('LMNT did not return a voice ID.');
            }

            logger.info({ voiceId: voice.id }, '✅ Voice enrolled (LMNT)');
            return voice.id;

        } catch (error) {
            logger.error({ err: error.message }, '❌ LMNT voice enrollment failed');
            throw new Error(`LMNT enrollment failed: ${error.message}`);
        }
    }

    /**
     * Synthesizes text to speech using a specific voice.
     * @param {string} apiKey 
     * @param {string} text 
     * @param {string} voiceId 
     * @param {string} [instruction] - Ignored by LMNT
     * @param {object} [options] - { speed, temperature, seed }
     * @returns {Promise<string>} Audio as Base64 string
     */
    async synthesize(apiKey, text, voiceId, instruction, options = {}) {
        const client = new Speech({ apiKey: apiKey });

        try {
            const synthesisOptions = {
                text: text,
                voice: voiceId,
                format: 'mp3',
                language: options.language || 'pt',
            };
            if (options.speed !== undefined) synthesisOptions.speed = options.speed;
            if (options.temperature !== undefined) synthesisOptions.temperature = options.temperature;
            if (options.seed !== undefined) synthesisOptions.seed = options.seed;

            logger.debug({ voiceId, options: synthesisOptions }, '🗣️ Synthesizing with LMNT');

            // SDK v2 requires a single object payload
            const response = await client.speech.generateDetailed(synthesisOptions);
            const audioBuffer = response.audio; // generateDetailed returns { audio: base64_string, durations: [...] }
            return audioBuffer;
        } catch (error) {
            logger.error({ err: error.message, voiceId }, '❌ LMNT synthesis failed');
            throw error;
        }
    }

    /**
     * Deletes a voice from LMNT.
     * @param {string} apiKey 
     * @param {string} voiceId 
     */
    async deleteVoice(apiKey, voiceId) {
        const client = new Speech({ apiKey: apiKey });
        try {
            await client.voices.delete(voiceId);
            logger.info({ voiceId }, '🗑️ Voice deleted from LMNT');
        } catch (error) {
            logger.warn({ err: error.message, voiceId }, '⚠️ Failed to delete voice from LMNT');
        }
    }
}

module.exports = LmntTtsProvider;
