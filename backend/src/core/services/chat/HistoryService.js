/**
 * HistoryService - Core Service for Chat History Retrieval
 */
const logger = require('../../../shared/Logger').createModuleLogger('history');
const { MAX_HISTORY_MESSAGES } = require('../../../config/constants');

class HistoryService {
    constructor({ supabaseClient }) {
        this.supabase = supabaseClient;
    }

    /**
     * Gets the recent history for a specific chat.
     * @param {string} chatId - The chat ID
     * @param {number} limit - Max messages to retrieve (default from constants)
     */
    async getChatHistory(chatId, limit = MAX_HISTORY_MESSAGES) {
        const { data: messages, error } = await this.supabase
            .from('messages')
            .select('body, from_me, is_ai, created_at, is_voice_message')
            .eq('chat_id', chatId)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) {
            logger.error({ chatId, error: error.message }, 'Error fetching history');
            return [];
        }

        // Return in reverse chronological order as expected by Gemini
        return messages.reverse().map(m => {
            let content = m.body || '[Mídia/Múltiplas Parte]';

            // FIX: Inform AI that this valid text comes from an audio transcription
            if (m.is_voice_message) {
                content = `[Transcrição de Áudio]: ${content}`;
            }

            return {
                role: m.from_me ? 'assistant' : 'user',
                content
            };
        });
    }

    /**
     * Gets paginated chat history for UI display.
     * @param {string} chatId - The chat ID
     * @param {number} page - Page number (1-indexed)
     * @param {number} pageSize - Messages per page
     * @returns {Object} { messages, total, hasMore }
     */
    async getPaginatedHistory(chatId, page = 1, pageSize = 50) {
        const offset = (page - 1) * pageSize;

        // Get messages for this page
        const { data: messages, error, count } = await this.supabase
            .from('messages')
            .select('id, body, from_me, is_ai, status, created_at, message_id', { count: 'exact' })
            .eq('chat_id', chatId)
            .order('created_at', { ascending: false })
            .range(offset, offset + pageSize - 1);

        if (error) {
            logger.error({ chatId, page, error: error.message }, 'Error fetching paginated history');
            return { messages: [], total: 0, hasMore: false };
        }

        return {
            messages: messages.reverse(), // Return chronological order
            total: count || 0,
            hasMore: count ? (offset + pageSize) < count : false,
            page,
            pageSize
        };
    }

    /**
     * Formats history for a manual human hint.
     */
    async getFormattedHistoryForHint(chatId, limit = 15) {
        const history = await this.getChatHistory(chatId, limit);
        if (history.length === 0) return 'Novo lead - inicie a conversa!';

        return history
            .map(m => `${m.role === 'assistant' ? 'Você' : 'Cliente'}: ${m.content}`)
            .join('\n');
    }
}

module.exports = HistoryService;

