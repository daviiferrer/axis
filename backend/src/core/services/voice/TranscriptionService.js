const logger = require('../../../shared/Logger').createModuleLogger('transcription');

/**
 * TranscriptionService - Speech-to-Text (STT)
 * Transcreve áudios recebidos pelo lead usando Gemini API.
 * Extraído de ChatService para separação de responsabilidades.
 */
class TranscriptionService {
    constructor({ settingsService }) {
        this.settingsService = settingsService;
    }

    /**
     * Transcreve áudio usando Gemini API.
     * @param {{ mimetype: string, data: string }} audioData - Áudio em Base64
     * @param {string} userId - ID do usuário para buscar a API Key
     * @returns {Promise<string|null>} Texto transcrito ou null
     */
    async transcribe(audioData, userId) {
        try {
            // Get API Key from User Profile (via SettingsService helper)
            const apiKey = await this.settingsService.getProviderKey(userId, 'gemini');

            if (!apiKey) {
                logger.warn({ userId }, 'No Gemini API key found in profile, cannot transcribe audio');
                return null;
            }

            const { GoogleGenerativeAI } = require('@google/generative-ai');
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

            const audioPart = {
                inlineData: {
                    mimeType: audioData.mimetype,
                    data: audioData.data
                }
            };

            logger.info({ mimetype: audioData.mimetype, dataLength: audioData.data?.length }, 'Sending audio to Gemini for transcription');

            const result = await model.generateContent([
                {
                    text: `Você é um assistente de transcrição de áudio profissional.

INSTRUÇÕES:
1. Transcreva EXATAMENTE o que a pessoa está FALANDO no áudio
2. Retorne APENAS o texto falado, sem timestamps, sem marcadores de tempo, sem formatação
3. Se não conseguir entender algo, escreva [inaudível]
4. Não adicione comentários, análises ou descrições
5. IMPORTANTE: Não retorne timestamps como "00:00", "00:01", etc. Retorne apenas a FALA

EXEMPLO CORRETO:
Áudio: "Olá, gostaria de agendar uma reunião"
Resposta: "Olá, gostaria de agendar uma reunião"

EXEMPLO INCORRETO:
Resposta: "00:00\n00:01\n00:02"

Agora transcreva este áudio:`
                },
                audioPart
            ]);

            const transcription = result.response.text().trim();

            // Validation: Check if response is just timestamps (common Gemini bug)
            const isInvalidTimestamps = /^[\d:.\s\n]+$/.test(transcription);
            const hasOnlyTimePatterns = (transcription.match(/\d{1,2}:\d{2}/g) || []).length > 5;

            if (isInvalidTimestamps || hasOnlyTimePatterns) {
                logger.warn({ transcription: transcription.substring(0, 200) }, '⚠️ Gemini returned timestamps instead of transcription');
                return null;
            }

            logger.info({ length: transcription.length }, 'Transcription completed');
            return transcription || null;
        } catch (error) {
            logger.error({ error: error.message, stack: error.stack }, 'Failed to transcribe audio with Gemini');
            return null;
        }
    }
}

module.exports = TranscriptionService;
