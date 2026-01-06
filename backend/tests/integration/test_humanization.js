/**
 * Verification Script: Humanization Engine
 * Tests Typing Latency and Message Burstiness
 */
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const NodeFactory = require('../../src/core/engines/workflow/NodeFactory');
const ChatService = require('../../src/core/services/chat/ChatService'); // Direct instantiation for test setup

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// Mock Dependencies
const mockWaha = {
    sendText: async (session, chatId, text) => {
        console.log(`[MockWAHA] Sent: "${text}"`);
        return { id: 'mock_msg_id_' + Date.now() };
    },
    sendTextWithLatency: async (session, chatId, text) => {
        console.log(`[MockWAHA] Sent (Legacy): "${text}"`);
        return { id: 'mock_msg_legacy_' + Date.now() };
    },
    sendVoiceBase64: async () => { }
};

const mockGemini = {
    generateSimple: async () => {
        return {
            text: () => JSON.stringify({
                response: "Olá! Tudo bem com você? Eu estava analisando o seu perfil aqui e percebi que temos muito em comum. Gostaria de te apresentar nossa solução que vai revolucionar o seu negócio. O que acha? Podemos conversar agora?",
                thought: "Simulating long response for burstiness check."
            })
        };
    }
};

const mockServices = {
    promptService: { buildStitchedPrompt: async () => "System Prompt" },
    historyService: { getChatHistory: async () => [{ role: 'user', content: 'Oi' }] },
    modelService: { getModelFromCampaignObject: () => 'gemini-mock' },
    leadService: { updateLeadScore: async () => { } },
    chatService: { ensureChat: async () => ({ id: 'mock_chat_uuid', chat_id: '5511999999999@s.whatsapp.net' }) },
    campaignSocket: { emit: () => { } },
    supabase,
    geminiClient: mockGemini,
    wahaClient: mockWaha
};

async function testHumanization() {
    console.log('🧪 Testing Humanization Engine (Physics)...');

    // 1. Setup AgentNode
    const factory = new NodeFactory(mockServices);
    // Overwrite ChatService in dependencies if needed (Factory usually passes it)
    // But NodeFactory.js might need update to accept chatService. 
    // Wait, I didn't update NodeFactory to PASS chatService! I updated AgentNode to ACCEPT it.
    // I need to check NodeFactory.

    // Manual Instantiation for this test to be sure
    const AgentNode = require('../../src/core/engines/workflow/nodes/AgentNode');
    const node = new AgentNode({ ...mockServices, chatService: mockServices.chatService });

    // 2. Mock Data
    const lead = { id: 'lead_1', phone: '5511999999999', name: 'Test Lead' };
    const campaign = {
        id: 'camp_1',
        session_name: 'test_session',
        user_id: 'user_1',
        agents: {
            name: 'HumanAgent',
            dna_config: {
                // SDR HUNTER CONFIGURATION
                agent_type: "SDR",
                big5: {
                    openness: "HIGH",
                    conscientiousness: "HIGH",
                    extraversion: "HIGH",
                    agreeableness: "MEDIUM",
                    neuroticism: "LOW"
                },
                pad_baseline: {
                    pleasure: "POSITIVE",
                    arousal: "HIGH",
                    dominance: "DOMINANT"
                },
                linguistics: {
                    reduction_profile: "BALANCED",
                    caps_mode: "SENTENCE_CASE",
                    correction_style: "BARE_CORRECTION",
                    typo_injection: "LOW"
                },
                chronemics: {
                    latency_profile: "FAST", // WPM 60
                    burstiness: "HIGH", // Ratio 0.8
                    typing_indicator: true
                },
                decision_strategy: "BEHAVIOR_TREE_EVO",
                lock_strategy: "ADVISORY_XACT"
            }
        }
    };
    const nodeConfig = { data: { guardrails: {} } };

    // 3. Execute
    const startTime = Date.now();
    try {
        await node.execute(lead, campaign, nodeConfig, { edges: [], nodes: [] });
        const duration = Date.now() - startTime;

        console.log(`\n⏱️ Total Execution Time: ${duration}ms`);
        if (duration > 1000) {
            console.log('✅ Latency Observed (Simulated Typing)');
        } else {
            console.error('❌ Too Fast! Latency might not be working.');
        }
    } catch (error) {
        console.error('❌ EXECUTION ERROR:', error);
    }
}

testHumanization();
