const AgenticNode = require('../src/core/engines/workflow/nodes/AgenticNode');
const { NodeExecutionStateEnum } = require('../src/core/types/CampaignEnums');
const logger = require('../src/shared/Logger').createModuleLogger('demo');
const fs = require('fs');
const path = require('path');

// CLEANUP: Truncate test log to ensure we only see THIS run
const TEST_LOG_PATH = path.join(__dirname, '../tests/logs/test.log');
try {
    const dir = path.dirname(TEST_LOG_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(TEST_LOG_PATH, ''); // Clear file
} catch (e) { console.error('Failed to clear log:', e); }

// MOCKS
const mockSupabase = {
    from: () => ({
        select: () => ({
            eq: () => ({
                single: async () => ({ data: { id: 'chat_demo' } }),
                limit: () => ({ maybeSingle: async () => null })
            }),
            single: async () => ({ data: { id: 'lead_demo' } })
        }),
        insert: async () => ({ data: {} }),
        update: () => ({ eq: async () => ({ data: {} }) }),
        upsert: () => ({ select: () => ({ single: async () => ({ data: {} }) }) })
    })
};

const mockGemini = {
    generateSimple: async (model, prompt, instruction) => {
        // Simple heuristic to generate relevant responses
        let response = {
            thought: "User just said hello, I should greet them warmly.",
            response: "Olá! Tudo bem? Sou o assistente virtual da ÁXIS. Como posso ajudar você hoje?",
            sentiment_score: 0.8,
            confidence_score: 0.95,
            intent: "GREETING",
            crm_actions: []
        };

        if (prompt.includes("preço") || prompt.includes("custa")) {
            response = {
                thought: "User asking for price. I should provide the standard pricing.",
                response: "nossos planos começam a partir de R$ 997,00 mensais para a gestão completa de SDRs. Gostaria de saber mais detalhes?",
                sentiment_score: 0.6,
                confidence_score: 0.9,
                intent: "PRICING_QUERY",
                crm_actions: []
            };
        } else if (prompt.includes("funciona")) {
            response = {
                thought: "User asking about functionality. Explaining the AI agent process.",
                response: "O sistema funciona conectando seus leads ao nosso agente de IA, que qualifica e agenda reuniões automaticamente. É 100% integrado ao WhatsApp.",
                sentiment_score: 0.7,
                confidence_score: 0.92,
                intent: "QUESTION",
                crm_actions: []
            };
        } else if (prompt.includes("agendar") || prompt.includes("reunião")) {
            response = {
                thought: "User wants to book. Trying to schedule.",
                response: "Perfeito! Qual o melhor horário para você? Tenho terça às 14h ou 16h.",
                sentiment_score: 0.9,
                confidence_score: 0.98,
                intent: "CHECK_AVAILABILITY",
                crm_actions: []
            };
        }

        return {
            text: () => JSON.stringify(response)
        };
    }
};

const mockWaha = {
    sendText: async (session, chat, text) => {
        logger.info({ session, chat, text }, '📱 WAHA: Message Sent');
        return { id: 'msg_' + Date.now() };
    },
    sendTypingState: async () => { }
};

const mockPromptService = {
    buildStitchedPrompt: async () => "SYSTEM PROMPT MOCK"
};

const mockHistory = {
    getChatHistory: async () => [
        // Empty to start, or we can push to it in the loop
    ]
};

const mockServices = {
    supabase: mockSupabase,
    geminiClient: mockGemini,
    wahaClient: mockWaha,
    promptService: mockPromptService,
    historyService: mockHistory,
    agentService: { getAgent: async () => ({ id: 'agent_1', model: 'gemini-pro' }) },
    chatService: { ensureChat: async () => ({ id: 'chat_demo' }) },
    leadService: { updateLeadScore: async () => { } },
    emotionalStateService: { getPadVector: async () => null, getEmotionalAdjustment: () => '', updatePadVector: async () => { } },
    guardrailService: { process: (text) => ({ safetyViolated: false, text: text }) },
    modelService: null,
    campaignSocket: null
};

// INSTANTIATE
const agenticNode = new AgenticNode(mockServices);
// HACK: Override physics to skip delays in demo
agenticNode.sendResponseWithPhysics = async (lead, campaign, chatId, dbChatId, aiResponse, physics) => {
    // logger.info({ finalMessage: aiResponse.response }, '📤 AI Final Response Generated');
};

// DATA
const lead = { id: 'lead_demo', phone: '5511999999999', name: 'Cliente Teste', temperature: 0.5 };
const campaign = { id: 'camp_demo', session_id: 'session_demo', agents: { id: 'agent_1', dna_config: {} } };
const nodeConfig = { id: 'node_agent', data: { model: 'gemini-pro' } };
const graph = { nodes: [], edges: [] };

// INTERACTION LOOP
const userInputs = [
    "Olá, como funciona?",
    "E quanto custa?",
    "Quero agendar uma reunião"
];

async function runDemo() {
    logger.info('🚀 Starting Agent Demo Simulation');

    for (const input of userInputs) {
        logger.info({ user: 'Client', message: input }, '📨 Incoming Message');

        // Mock history update (conceptually)
        // in real AgenticNode, it fetches history. We mocked getChatHistory to return static or accumulated.
        // For this demo, we assume the node reads context from what we pass or just reacts to the latest lead update.
        // But AgentNode.js reads history from DB. 
        // We need to inject the input into the "history" the node sees, or else it won't know what to reply to.
        // AgentNode: const history = await this.historyService.getChatHistory(chat.id);
        // We should update the mockHistory return value

        const currentHistory = await mockHistory.getChatHistory();
        currentHistory.push({ role: 'user', content: input });
        mockHistory.getChatHistory = async () => currentHistory;

        // Hack: update promptService to include input so mockGemini sees it
        mockPromptService.buildStitchedPrompt = async () => `User said: ${input}`;

        const result = await agenticNode.execute(lead, campaign, nodeConfig, graph);

        if (result.output && result.output.response) {
            // Add bot reply to history for next turn
            currentHistory.push({ role: 'assistant', content: result.output.response });
        }

        await new Promise(r => setTimeout(r, 1000)); // Pause for readability
    }

    logger.info('✅ Demo Completed');

    // POST-PROCESSING: Generate Readable Transcript
    await generateTranscript();
}

async function generateTranscript() {
    console.log('📝 Generating Readable Transcript...');
    if (!fs.existsSync(TEST_LOG_PATH)) return;

    const logContent = fs.readFileSync(TEST_LOG_PATH, 'utf-8');
    const lines = logContent.split('\n').filter(line => line.trim());

    let transcript = '# Agent Demo Transcript\n\n';

    lines.forEach(line => {
        try {
            const log = JSON.parse(line);

            // Filter only relevant logs
            if (log.msg === '📨 Incoming Message') {
                transcript += `**User**: ${log.message}\n\n`;
            } else if (log.msg === '💭 AI Internal Reasoning') {
                transcript += `> **Agent Thought**: _${log.thought}_\n\n`;
            } else if (log.msg === '📤 AI Final Response Generated') {
                if (log.finalMessage) {
                    transcript += `**Agent**: ${log.finalMessage}\n\n---\n\n`;
                }
            } else if (log.intent) {
                transcript += `> [Classification]: Intent=${log.intent}, Sentiment=${log.sentiment}\n\n`;
            }
        } catch (e) {
            // Ignore parse errors
        }
    });

    const outputPath = path.join(__dirname, '../logs/agent_demo_transcript.md');
    const logDir = path.dirname(outputPath);
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

    fs.writeFileSync(outputPath, transcript);
    console.log(`✨ Transcript saved to: ${outputPath}`);
}

runDemo().catch(err => console.error(err));
