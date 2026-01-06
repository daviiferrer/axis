/**
 * WebContentService - RAG Context Extraction
 * 
 * Crawls lead websites to extract content for personalization.
 * Injects context into PromptService for hyper-personalized outreach.
 */
const logger = require('../../../shared/Logger').createModuleLogger('web-content');

class WebContentService {
    constructor(supabase, queueService) {
        this.supabase = supabase;
        this.queueService = queueService;
        this.MAX_PAGES = 5;
    }

    /**
     * Extract website content for a lead
     * Returns summarized context for RAG injection
     */
    async extractWebsiteContext(websiteUrl, leadId, userId) {
        if (!websiteUrl) return null;

        logger.info({ url: websiteUrl, leadId }, 'Queuing website content extraction');

        try {
            // Check cache first
            const cached = await this.getCachedContent(websiteUrl);
            if (cached) {
                logger.info({ url: websiteUrl }, 'Using cached content');
                return cached;
            }

            // Queue scraper job
            const job = await this.queueService.addScrapeJob({
                url: websiteUrl,
                leadId: leadId,
                userId: userId // Pass userId for socket events
            });

            logger.info({ jobId: job.id, url: websiteUrl }, 'Scrape job queued');

            // For now, return a placeholder or null, as the process is async.
            // In a synchronous workflow, we might wait for the job, but for best practice async:
            return { status: 'PENDING', jobId: job.id, message: 'Extraction started' };

        } catch (error) {
            logger.error({ url: websiteUrl, error: error.message }, 'Failed to queue content extraction');
            return null;
        }
    }

    /**
     * Compile extracted pages into a concise context
     */
    compileContext(pages, originalUrl) {
        const sections = [];

        // Home page summary
        const homePage = pages.find(p => p.url === originalUrl || p.url.endsWith('/'));
        if (homePage) {
            sections.push({
                type: 'about',
                content: this.summarize(homePage.text || homePage.markdown, 500)
            });
        }

        // Services/Products
        const servicesPage = pages.find(p =>
            /servic|product|soluc|oferta/i.test(p.url)
        );
        if (servicesPage) {
            sections.push({
                type: 'services',
                content: this.summarize(servicesPage.text || servicesPage.markdown, 300)
            });
        }

        // About page
        const aboutPage = pages.find(p =>
            /about|sobre|quem-somos|empresa/i.test(p.url)
        );
        if (aboutPage) {
            sections.push({
                type: 'company',
                content: this.summarize(aboutPage.text || aboutPage.markdown, 300)
            });
        }

        // Combine into context string
        const contextParts = sections.map(s =>
            `[${s.type.toUpperCase()}]\n${s.content}`
        );

        return {
            url: originalUrl,
            extractedAt: new Date().toISOString(),
            sections: sections,
            fullContext: contextParts.join('\n\n'),
            wordCount: contextParts.join(' ').split(/\s+/).length
        };
    }

    /**
     * Summarize text to max characters
     */
    summarize(text, maxChars) {
        if (!text) return '';

        // Clean the text
        const cleaned = text
            .replace(/\s+/g, ' ')
            .replace(/\n+/g, '\n')
            .trim();

        if (cleaned.length <= maxChars) return cleaned;

        // Cut at sentence boundary
        const cutPoint = cleaned.lastIndexOf('.', maxChars);
        return cutPoint > maxChars * 0.5
            ? cleaned.slice(0, cutPoint + 1)
            : cleaned.slice(0, maxChars) + '...';
    }

    /**
     * Get cached content
     */
    async getCachedContent(url) {
        const { data, error } = await this.supabase
            .from('website_cache')
            .select('context, extracted_at')
            .eq('url', url)
            .single();

        if (error || !data) return null;

        // Check if cache is stale (7 days)
        const extractedAt = new Date(data.extracted_at);
        const staleDays = 7;
        if (Date.now() - extractedAt > staleDays * 24 * 60 * 60 * 1000) {
            return null;
        }

        return data.context;
    }

    /**
     * Cache content
     */
    async cacheContent(url, context, leadId) {
        await this.supabase
            .from('website_cache')
            .upsert({
                url: url,
                context: context,
                lead_id: leadId,
                extracted_at: new Date().toISOString()
            }, { onConflict: 'url' });
    }

    /**
     * Format context for prompt injection
     */
    formatForPrompt(context) {
        if (!context) return '';

        return `
<website_context>
URL visitado: ${context.url}

${context.fullContext}
</website_context>`;
    }
}

module.exports = WebContentService;
