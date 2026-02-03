const logger = require('../../../shared/Logger').createModuleLogger('jid-service');

/**
 * Service to handle WhatsApp ID Normalization (9th digit issues).
 * Follows User Architecture Spec: "Source of Truth is WAHA check-exists".
 * Centralizes LID bypass and real number extraction.
 */
class JidNormalizationService {
    constructor({ wahaClient, supabaseClient }) {
        this.wahaClient = wahaClient;
        this.supabase = supabaseClient;
        this.jidCache = new Map();
    }

    /**
     * Entry point for incoming webhooks.
     * Extracts real number from LID and normalizes JID.
     */
    async normalizePayload(payload) {
        if (!payload) return null;

        const realNumber = this.extractRealNumber(payload);
        // If we have a real number, we ignore the LID and use the real JID format
        const source = realNumber ? `${realNumber}@s.whatsapp.net` : payload.from;

        const normalized = await this.resolveJid(source);
        if (normalized) {
            // Standardize suffix to @s.whatsapp.net for internal consistency
            payload.from = normalized.replace('@c.us', '@s.whatsapp.net');
        }

        if (payload.author) {
            payload.author = await this.resolveJid(payload.author);
            if (payload.author) payload.author = payload.author.replace('@c.us', '@s.whatsapp.net');
        }

        return payload.from;
    }

    /**
     * Resolves the correct JID for a given phone number.
     */
    async resolveJid(rawPhone) {
        if (!rawPhone) return null;

        // LID is a system identity, but we want to resolve to the canonical phone JID if possible
        // if (rawPhone.endsWith('@lid')) {
        //     return rawPhone;
        // }

        const cleaned = this.extractDigits(rawPhone);
        if (!cleaned) return rawPhone;

        const fullPhone = (cleaned.length >= 10 && !cleaned.startsWith('55')) ? `55${cleaned}` : cleaned;

        if (this.jidCache.has(fullPhone)) {
            return this.jidCache.get(fullPhone);
        }

        const normalizedJid = await this.findInDb(fullPhone);
        if (normalizedJid) {
            const standardized = normalizedJid.replace('@c.us', '@s.whatsapp.net');
            this.jidCache.set(fullPhone, standardized);
            return standardized;
        }

        try {
            const exists = await this.wahaClient.checkExists(fullPhone);
            if (exists && exists.numberExists) {
                const jid = exists.chatId.replace('@c.us', '@s.whatsapp.net');
                this.jidCache.set(fullPhone, jid);
                return jid;
            }
        } catch (e) {
            if (e.response?.status !== 422) {
                logger.warn({ error: e.message, phone: fullPhone }, 'WAHA check-exists failed');
            }
        }

        const heuristic = this.applyHeuristicNormalization(fullPhone);
        const finalJid = `${heuristic}@s.whatsapp.net`;
        this.jidCache.set(fullPhone, finalJid);
        return finalJid;
    }

    async findInDb(phone) {
        let { data: contact } = await this.supabase
            .from('leads')
            .select('phone')
            .eq('phone', phone)
            .limit(1)
            .maybeSingle();

        if (contact) return `${contact.phone}@s.whatsapp.net`;

        if (phone.startsWith('55')) {
            if (phone.length === 13) {
                const legacy = phone.slice(0, 4) + phone.slice(5);
                ({ data: contact } = await this.supabase.from('leads').select('phone').eq('phone', legacy).maybeSingle());
                if (contact) return `${contact.phone}@s.whatsapp.net`;
            } else if (phone.length === 12) {
                const modern = phone.slice(0, 4) + '9' + phone.slice(4);
                ({ data: contact } = await this.supabase.from('leads').select('phone').eq('phone', modern).maybeSingle());
                if (contact) return `${contact.phone}@s.whatsapp.net`;
            }
        }
        return null;
    }

    applyHeuristicNormalization(phone) {
        if (phone.startsWith('55') && phone.length > 4) {
            const ddd = parseInt(phone.substring(2, 4));
            const body = phone.substring(4);
            if (ddd > 30 && body.length === 9 && body.startsWith('9')) {
                return `55${ddd}${body.substring(1)}`;
            }
        }
        return phone;
    }

    extractDigits(phone) {
        if (!phone) return '';
        return String(phone).replace(/\D/g, '');
    }

    formatToJid(phone) {
        let clean = this.extractDigits(phone);
        if (clean.length >= 10 && !clean.startsWith('55')) {
            clean = '55' + clean;
        }
        return `${clean}@s.whatsapp.net`;
    }

    extractRealNumber(payload) {
        if (!payload) return null;

        const realJid = payload._data?.Info?.SenderAlt || payload._data?.Info?.RecipientAlt;
        if (realJid && realJid.includes('@s.whatsapp.net')) {
            // Extract number from JID (e.g. 555195698519:81@s.whatsapp.net -> 555195698519)
            // Handle JIDs with device ID suffix (:81)
            let cleanJid = realJid.replace('@s.whatsapp.net', '');
            if (cleanJid.includes(':')) {
                cleanJid = cleanJid.split(':')[0];
            }
            return cleanJid;
        }

        if (payload.from && !payload.from.endsWith('@lid')) {
            return this.extractDigits(payload.from);
        }

        return null;
    }
}

module.exports = JidNormalizationService;
