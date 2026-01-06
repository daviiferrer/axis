const EmotionalStateService = require('../../../../../src/core/services/ai/EmotionalStateService');

describe('EmotionalStateService', () => {
    let service;
    let mockSupabase;

    beforeEach(() => {
        mockSupabase = {
            from: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn(),
            upsert: jest.fn().mockReturnThis()
        };
        service = new EmotionalStateService(mockSupabase);
    });

    describe('getEmotionalAdjustment', () => {
        it('should return XML-formatted context for extreme states', () => {
            const pad = { pleasure: 0.1, arousal: 0.9, dominance: 0.1 };
            const adjustment = service.getEmotionalAdjustment(pad);

            // Check for actual XML structure from implementation
            expect(adjustment).toContain('<emotional_context>');
            expect(adjustment).toContain('</emotional_context>');
            expect(adjustment).toContain('humor negativo');
        });

        it('should return empty string for neutral states', () => {
            const pad = { pleasure: 0.5, arousal: 0.5, dominance: 0.5 };
            const adjustment = service.getEmotionalAdjustment(pad);
            expect(adjustment).toBe('');
        });
    });
});
