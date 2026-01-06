/**
 * LeadTransformerService - Universal Schema Normalizer
 * 
 * Converts heterogeneous data from Apify actors (LinkedIn, Maps, Web)
 * into a standardized prospect format for the Supabase database.
 */
const { parsePhoneNumberFromString } = require('libphonenumber-js');
const logger = require('../../../shared/Logger').createModuleLogger('lead-transformer');

class LeadTransformerService {
    /**
     * Normalize LinkedIn profile data (HarvestAPI, Dev Fusion)
     */
    normalizeFromLinkedIn(data, campaignId) {
        return data.map(item => {
            const phone = this.normalizePhone(item.phoneNumber || item.phone);

            return {
                source: 'linkedin',
                source_id: item.linkedinUrl || item.profileUrl || item.id,
                name: this.normalizeName(item.fullName || item.name || `${item.firstName} ${item.lastName}`),
                company: item.companyName || item.company || item.currentCompany || '',
                title: item.jobTitle || item.title || item.headline || '',
                phone: phone,
                email: (item.email || '').toLowerCase().trim(),
                website: item.companyWebsite || item.website || '',
                linkedin_url: item.linkedinUrl || item.profileUrl || '',
                location: item.location || item.city || '',
                raw_data: item,
                campaign_id: campaignId,
                status: phone ? 'ready' : 'enriching'
            };
        }).filter(p => p.name && (p.phone || p.email || p.linkedin_url));
    }

    /**
     * Normalize Google Maps data (Compass, Lukáš Křivka)
     */
    normalizeFromMaps(data, campaignId) {
        return data.map(item => {
            const phone = this.normalizePhone(item.phone || item.phoneNumber);

            return {
                source: 'maps',
                source_id: item.placeId || item.cid || item.url,
                name: this.normalizeName(item.title || item.name || item.businessName),
                company: item.title || item.name || item.businessName || '',
                title: item.category || item.categories?.[0] || '',
                phone: phone,
                email: this.extractEmail(item.website, item.emails) || '',
                website: item.website || item.url || '',
                linkedin_url: '',
                location: item.address || `${item.city}, ${item.state}` || '',
                raw_data: item,
                campaign_id: campaignId,
                status: phone ? 'ready' : 'enriching'
            };
        }).filter(p => p.name && (p.phone || p.email || p.website));
    }

    /**
     * Normalize generic web/contact data (Vojta Drmota, Dxbear)
     */
    normalizeFromWeb(data, campaignId) {
        return data.map(item => {
            const phone = this.normalizePhone(item.phone || item.phoneNumber);
            const emails = Array.isArray(item.emails) ? item.emails : [item.email];

            return {
                source: 'web',
                source_id: item.url || item.domain || item.id,
                name: this.normalizeName(item.name || item.contactPerson || this.extractNameFromEmail(emails[0])),
                company: item.company || item.organization || this.extractCompanyFromDomain(item.domain) || '',
                title: item.title || '',
                phone: phone,
                email: (emails[0] || '').toLowerCase().trim(),
                website: item.url || item.domain || '',
                linkedin_url: item.linkedin || '',
                location: item.location || item.country || '',
                raw_data: item,
                campaign_id: campaignId,
                status: phone ? 'ready' : 'enriching'
            };
        }).filter(p => p.name && (p.phone || p.email));
    }

    /**
     * Normalize Instagram/Social data (API Dojo, Clockworks)
     */
    normalizeFromSocial(data, campaignId, platform = 'instagram') {
        return data.map(item => {
            return {
                source: platform,
                source_id: item.id || item.username || item.profileUrl,
                name: this.normalizeName(item.fullName || item.name || item.username),
                company: item.businessName || item.bio?.slice(0, 100) || '',
                title: item.category || 'Creator',
                phone: '',
                email: item.publicEmail || item.businessEmail || '',
                website: item.externalUrl || item.website || '',
                linkedin_url: '',
                location: item.location || '',
                raw_data: item,
                campaign_id: campaignId,
                status: 'enriching' // Social usually needs phone enrichment
            };
        }).filter(p => p.name);
    }

    /**
     * Auto-detect source and normalize
     */
    normalizeAuto(data, campaignId, actorId) {
        const actorMap = {
            'harvest-api': 'linkedin',
            'harvest': 'linkedin',
            'linkedin-scraper': 'linkedin',
            'linkedin-companies': 'linkedin',
            'linkedin-jobs': 'linkedin',
            'google-maps-scraper': 'maps',
            'google-maps-email': 'maps',
            'instagram-scraper': 'social',
            'tiktok-scraper': 'social',
            'contact-details': 'web',
            'fast-email-finder': 'web'
        };

        const sourceType = Object.entries(actorMap).find(([key]) =>
            actorId.toLowerCase().includes(key)
        )?.[1] || 'web';

        logger.info({ actorId, sourceType, count: data.length }, 'Auto-detecting source type');

        switch (sourceType) {
            case 'linkedin':
                return this.normalizeFromLinkedIn(data, campaignId);
            case 'maps':
                return this.normalizeFromMaps(data, campaignId);
            case 'social':
                return this.normalizeFromSocial(data, campaignId);
            default:
                return this.normalizeFromWeb(data, campaignId);
        }
    }

    /**
     * Deduplicate leads by phone (primary) or website (secondary)
     */
    deduplicate(leads, existingPhones = new Set(), existingWebsites = new Set()) {
        const seen = {
            phones: new Set(existingPhones),
            websites: new Set(existingWebsites)
        };
        const unique = [];
        const duplicates = [];

        for (const lead of leads) {
            const isDuplicate =
                (lead.phone && seen.phones.has(lead.phone)) ||
                (lead.website && seen.websites.has(lead.website));

            if (isDuplicate) {
                duplicates.push(lead);
            } else {
                if (lead.phone) seen.phones.add(lead.phone);
                if (lead.website) seen.websites.add(lead.website);
                unique.push(lead);
            }
        }

        logger.info({
            total: leads.length,
            unique: unique.length,
            duplicates: duplicates.length
        }, 'Deduplication complete');

        return { unique, duplicates };
    }

    // ============ UTILITY METHODS ============

    /**
     * Normalize phone to E.164 format (required for WAHA)
     */
    normalizePhone(phone) {
        if (!phone) return '';

        // Clean the input
        const cleaned = String(phone).replace(/[^\d+]/g, '');
        if (!cleaned || cleaned.length < 8) return '';

        try {
            // Try parsing with BR as default
            let parsed = parsePhoneNumberFromString(cleaned, 'BR');

            // If no country code, try adding +55
            if (!parsed && !cleaned.startsWith('+')) {
                parsed = parsePhoneNumberFromString(`+55${cleaned}`, 'BR');
            }

            if (parsed && parsed.isValid()) {
                return parsed.format('E.164'); // +5511999991234
            }
        } catch (e) {
            logger.debug({ phone, error: e.message }, 'Phone parsing failed');
        }

        return '';
    }

    /**
     * Normalize name (capitalize, remove extra spaces)
     */
    normalizeName(name) {
        if (!name) return '';
        return name
            .trim()
            .replace(/\s+/g, ' ')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    }

    /**
     * Extract email from website scrape data
     */
    extractEmail(website, emails) {
        if (Array.isArray(emails) && emails.length > 0) {
            return emails[0].toLowerCase().trim();
        }
        return '';
    }

    /**
     * Extract name from email address
     */
    extractNameFromEmail(email) {
        if (!email) return '';
        const local = email.split('@')[0];
        return local
            .replace(/[._]/g, ' ')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    /**
     * Extract company name from domain
     */
    extractCompanyFromDomain(domain) {
        if (!domain) return '';
        return domain
            .replace(/^www\./, '')
            .split('.')[0]
            .replace(/-/g, ' ')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }
}

module.exports = LeadTransformerService;
