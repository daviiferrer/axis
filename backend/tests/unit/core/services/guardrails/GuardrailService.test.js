const GuardrailService = require('../../../../../src/core/services/guardrails/GuardrailService');

describe('GuardrailService', () => {
    let service;

    beforeEach(() => {
        service = new GuardrailService();
    });

    describe('validateCTA', () => {
        it('should return true if CTA link is present', () => {
            const text = "Agende aqui: https://cal.com/reuniao";
            expect(service.validateCTA(text)).toBe(true);
        });

        it('should return true if specific CTA text is present', () => {
            const text = "Vamos marcar um café?";
            expect(service.validateCTA(text, "marcar um café")).toBe(true);
        });

        it('should return false if CTA is missing', () => {
            const text = "Ok, entendi. Tchau.";
            expect(service.validateCTA(text, "link de pagamento")).toBe(false);
        });
    });

    describe('injectCTA', () => {
        it('should append missing CTA', () => {
            const text = "Foi um prazer falar com você.";
            const cta = "Clique aqui para comprar.";
            const result = service.injectCTA(text, cta, false);

            expect(result).toBe("Foi um prazer falar com você. Clique aqui para comprar.");
        });

        it('should force link format if flag is true', () => {
            const text = "Otimo.";
            const cta = "https://checkout.com";
            const result = service.injectCTA(text, cta, true);

            expect(result).toContain("👉 https://checkout.com");
        });
    });

    describe('sanitizeResponse', () => {
        it('should remove system tags leaks', () => {
            const text = "Olá <identity>Sou um assistente</identity>, como vai?";
            // <identity> and </identity> removed. "Sou um assistente" remains.
            // "Sou um assistente" might match other rules? No.
            expect(service.sanitizeResponse(text)).toBe("Olá Sou um assistente, como vai?");
        });

        it('should replace AI self-references', () => {
            const text = "Eu sou uma inteligência artificial treinada para ajudar.";
            const result = service.sanitizeResponse(text);
            expect(result).toContain("trabalho na equipe");
            expect(result).not.toContain("inteligência artificial");
        });
    });

    describe('intercept', () => {
        it('should ignore non-closing nodes', () => {
            const text = "Apenas uma conversa.";
            const nodeConfig = { type: 'conversation' }; // Not closing
            const result = service.intercept(text, nodeConfig);
            expect(result).toBe(text);
        });

        it('should enforce CTA on closing nodes', () => {
            const text = "Tudo bem, fechado.";
            const nodeConfig = {
                type: 'closing',
                cta: 'https://pagar.me',
                forceLink: true
            };

            const result = service.intercept(text, nodeConfig);
            expect(result).toContain(text);
            expect(result).toContain('https://pagar.me');
        });
    });
});
