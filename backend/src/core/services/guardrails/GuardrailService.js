/**
 * GuardrailService - Response Validation and CTA Injection
 * 
 * Middleware that intercepts AI responses before sending to WhatsApp.
 * Ensures closing nodes always include the required CTA.
 */
const logger = require('../../../shared/Logger').createModuleLogger('guardrail');

class GuardrailService {
    constructor() {
        this.ctaPatterns = {
            link: /https?:\/\/[^\s]+/i,
            phone: /\(\d{2}\)\s?\d{4,5}-?\d{4}/,
            calendar: /calendly|cal\.com|agendamento|marcar|agendar/i
        };
    }

    /**
     * Intercept and validate response before sending.
     * 
     * @param {string} response - AI generated response
     * @param {object} nodeConfig - Current node configuration
     * @returns {string} - Validated/modified response
     */
    intercept(response, nodeConfig) {
        const { type, cta, forceLink } = nodeConfig || {};

        // Only enforce CTA on closing/conversion nodes
        if (type === 'closing' || type === 'conversion' || type === 'cta') {
            if (!this.validateCTA(response, cta)) {
                logger.warn({ nodeType: type }, '⚠️ CTA missing in closing node - injecting');
                return this.injectCTA(response, cta, forceLink);
            }
        }

        // Validate no prohibited content
        const sanitized = this.sanitizeResponse(response);

        return sanitized;
    }

    /**
     * Check if response contains the required CTA.
     */
    validateCTA(text, expectedCta) {
        if (!expectedCta) return true;

        // Check for link pattern
        if (this.ctaPatterns.link.test(text)) return true;

        // Check for specific CTA text
        if (text.toLowerCase().includes(expectedCta.toLowerCase())) return true;

        // Check for calendar/scheduling keywords
        if (this.ctaPatterns.calendar.test(text)) return true;

        return false;
    }

    /**
     * Inject CTA at the end of the response.
     */
    injectCTA(text, cta, forceLink) {
        const separator = text.endsWith('!') || text.endsWith('?') ? '\n\n' : ' ';

        const ctaText = forceLink
            ? `${separator}👉 ${cta || 'Agende agora: https://calendly.com/agendamento'}`
            : `${separator}${cta || 'Que tal agendarmos uma conversa rápida?'}`;

        return text + ctaText;
    }

    /**
     * Remove prohibited content from response.
     */
    sanitizeResponse(text) {
        // Remove any accidental system prompts leaked
        let sanitized = text.replace(/<[^>]+>/g, '');

        // Remove multiple newlines
        sanitized = sanitized.replace(/\n{3,}/g, '\n\n');

        // Remove self-references to being AI
        sanitized = sanitized.replace(/sou uma? (IA|inteligência artificial|bot|robô)/gi, 'trabalho na equipe');

        return sanitized.trim();
    }

    /**
     * Validate response length for WhatsApp best practices.
     */
    validateLength(text, maxLength = 500) {
        if (text.length > maxLength) {
            logger.warn({ length: text.length, max: maxLength }, 'Response too long - truncating');
            // Find last sentence before limit
            const truncated = text.substring(0, maxLength);
            const lastPeriod = truncated.lastIndexOf('.');
            return lastPeriod > 0 ? truncated.substring(0, lastPeriod + 1) : truncated;
        }
        return text;
    }

    /**
     * Full guardrail pipeline.
     * @returns {Object} { text: string, safetyViolated: boolean, reason: string }
     */
    process(response, nodeConfig, options = {}) {
        let result = response;
        let safetyViolated = false;
        let violationReason = null;

        // 1. Sanitize
        result = this.sanitizeResponse(result);

        // 2. CTA check
        result = this.intercept(result, nodeConfig);

        // 3. Length check
        if (options.maxLength) {
            result = this.validateLength(result, options.maxLength);
        }

        // 4. Safety Guardrails (Sentiment & Toxicity)
        // These are driven by the new UI settings in PropertiesPanel
        const { sentiment_threshold, block_toxicity, last_sentiment } = nodeConfig;

        if (block_toxicity && this.isToxic(result)) {
            safetyViolated = true;
            violationReason = 'TOXICITY_DETECTED';
            logger.warn({ reason: violationReason }, '🚫 Toxicity guardrail triggered');
        }

        // Sentiment threshold check (e.g. if sentiment < threshold, trigger safety)
        // Sentiment values: VERY_NEGATIVE(0.0) -> VERY_POSITIVE(1.0)
        const thresholdMap = {
            'VERY_NEGATIVE': 0.1,
            'NEGATIVE': 0.3,
            'NEUTRAL': 0.5,
            'POSITIVE': 0.7,
            'VERY_POSITIVE': 0.9
        };

        if (sentiment_threshold && last_sentiment !== undefined) {
            const minScore = thresholdMap[sentiment_threshold] || 0.3;
            if (last_sentiment < minScore) {
                safetyViolated = true;
                violationReason = 'SENTIMENT_BELOW_THRESHOLD';
                logger.warn({ last_sentiment, threshold: sentiment_threshold }, '📉 Sentiment guardrail triggered');
            }
        }

        return {
            text: result,
            safetyViolated,
            reason: violationReason
        };
    }

    /**
     * Basic toxicity detection (placeholder for more advanced NLP)
     */
    isToxic(text) {
        const toxicPatterns = [
            /idiota|burro|lixo|merda|porra|vai se/i, // Portuguese profanity
            /hate|stupid|idiot|fuck|shit/i              // English profanity (backup)
        ];
        return toxicPatterns.some(p => p.test(text));
    }
}

module.exports = GuardrailService;
