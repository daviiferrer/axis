/**
 * HistoryService - Core Service for Chat History Retrieval
 */
class HistoryService {
    constructor({ supabaseClient }) {
        this.supabase = supabaseClient;
    }

    /**
     * Gets the recent history for a specific chat.
     */
    async getChatHistory(chatId, limit = 15) {
        const { data: messages, error } = await this.supabase
            .from('messages')
            .select('body, from_me, is_ai, created_at')
            .eq('chat_id', chatId)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) {
            console.error('[HistoryService] Error fetching history:', error.message);
            return [];
        }

        // Return in reverse chronological order as expected by Gemini
        return messages.reverse().map(m => ({
            role: m.from_me ? 'assistant' : 'user',
            content: m.body || '[Mídia/Múltiplas Parte]'
        }));
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
