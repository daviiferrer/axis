/**
 * SpintaxService - Content Diversification Engine
 * 
 * Spintax prevents spam detection by varying message structure.
 * Format: {option1|option2|option3}
 */
const logger = require('../../../shared/Logger').createModuleLogger('spintax');

class SpintaxService {
    /**
     * Process spintax template and return randomized text.
     * Example: "{Olá|Oi}! {Como vai|Tudo bem}?" → "Oi! Tudo bem?"
     */
    static spin(template) {
        if (!template) return '';

        return template.replace(/\{([^{}]+)\}/g, (match, group) => {
            const options = group.split('|');
            return options[Math.floor(Math.random() * options.length)];
        });
    }

    /**
     * Apply common diversification patterns to plain text.
     * Converts common words to spintax for variation.
     */
    static diversify(text) {
        if (!text) return '';

        const patterns = {
            'Olá': '{Olá|Oi|E aí|Fala}',
            'olá': '{olá|oi|e aí|fala}',
            'Oi': '{Oi|Olá|E aí}',
            'oi': '{oi|olá|e aí}',
            'obrigado': '{obrigado|valeu|agradeço}',
            'Obrigado': '{Obrigado|Valeu|Agradeço}',
            'Tudo bem': '{Tudo bem|Como vai|Tudo certo}',
            'tudo bem': '{tudo bem|como vai|tudo certo}',
            'perfeito': '{perfeito|ótimo|excelente|maravilha}',
            'Perfeito': '{Perfeito|Ótimo|Excelente|Maravilha}',
            'claro': '{claro|com certeza|sem dúvida}',
            'Claro': '{Claro|Com certeza|Sem dúvida}',
            'entendi': '{entendi|compreendi|captei}',
            'Entendi': '{Entendi|Compreendi|Captei}'
        };

        let result = text;
        for (const [word, spintax] of Object.entries(patterns)) {
            result = result.replace(new RegExp(`\\b${word}\\b`, 'g'), spintax);
        }

        return this.spin(result);
    }

    /**
     * Generate fallback messages for when AI is unavailable.
     */
    static getFallbackMessage() {
        const templates = [
            "{Oi|Olá}! {Desculpe a demora|Perdão pelo atraso}, estou {com alta demanda|atendendo muitas pessoas}. {Te retorno em breve|Já já te respondo}! 😊",
            "{E aí|Fala}! {Tô com|Estou com} {muita coisa aqui|bastante movimento}. {Posso te chamar daqui a pouco|Te chamo já já}?",
            "{Oi|Olá}! {Um momento|Um instante}, por favor. {Volto logo|Retorno em breve}! 🙏"
        ];

        const template = templates[Math.floor(Math.random() * templates.length)];
        return this.spin(template);
    }

    /**
     * Add subtle variation to punctuation and emojis.
     */
    static varyPunctuation(text) {
        const emojiSets = {
            '😊': ['😊', '🙂', '😄', '☺️'],
            '👍': ['👍', '✅', '💪', '🤝'],
            '🚀': ['🚀', '💪', '⚡', '🔥']
        };

        let result = text;
        for (const [emoji, alternatives] of Object.entries(emojiSets)) {
            if (result.includes(emoji)) {
                const replacement = alternatives[Math.floor(Math.random() * alternatives.length)];
                result = result.replace(emoji, replacement);
            }
        }

        return result;
    }
}

module.exports = SpintaxService;
