class GeminiClientMock {
    constructor(apiKey) {
        this.apiKey = apiKey;
    }

    async generateSimpleText(model, system, prompt) {
        return "Resposta simulada do Gemini";
    }

    async generateContent(model, system, history) {
        return {
            response: "Resposta simulada do Gemini",
            usage: { totalTokens: 100 }
        };
    }
}

module.exports = GeminiClientMock;
