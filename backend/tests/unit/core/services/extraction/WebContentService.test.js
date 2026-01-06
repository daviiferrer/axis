const WebContentService = require('../../../../../src/core/services/extraction/WebContentService');

describe('WebContentService', () => {
    let service;
    const mockSupabase = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: null })
    };

    beforeEach(() => {
        service = new WebContentService(mockSupabase);
    });

    describe('Content Cleaning and Summarization', () => {
        it('should summarize text and remove extra whitespace', () => {
            const longText = "This is a very long text that should be summarized. It has many sentences. We want to keep it concise and readable for the AI context. Let's see how it works.";
            const result = service.summarize(longText, 100);

            expect(result.length).toBeLessThanOrEqual(103); // maxChars + possible dots
            expect(result).toContain('sentences.');
        });

        it('should compile context from multiple pages', () => {
            const pages = [
                { url: 'https://test.com/', text: 'Welcome to TechCorp. We innovate things.' },
                { url: 'https://test.com/services', text: 'Our services include AI consulting and Cloud.' }
            ];

            const result = service.compileContext(pages, 'https://test.com/');

            expect(result.fullContext).toContain('[ABOUT]');
            expect(result.fullContext).toContain('Welcome to TechCorp');
            expect(result.fullContext).toContain('[SERVICES]');
            expect(result.fullContext).toContain('Our services include');
        });
    });

    describe('Prompt Formatting', () => {
        it('should format context for XML tag injection', () => {
            const context = {
                url: 'https://test.com',
                fullContext: 'Test Content'
            };
            const result = service.formatForPrompt(context);

            expect(result).toContain('<website_context>');
            expect(result).toContain('URL visitado: https://test.com');
            expect(result).toContain('Test Content');
            expect(result).toContain('</website_context>');
        });
    });
});
