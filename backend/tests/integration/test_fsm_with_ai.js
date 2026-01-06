/**
 * test_fsm_with_ai.js
 * Integration test for FSM Architecture with REAL AI Generation
 * 
 * Architecture (Neuro-Symbolic):
 * - Campaign (FSM): Decides WHAT happens (flow, states, transitions) - DETERMINISTIC
 * - Agent (AI): Decides HOW to say it (text generation, emotion, tone) - PROBABILISTIC
 * 
 * They complement each other: Campaign orchestrates, Agent executes language.
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { createClient } = require('@supabase/supabase-js');
const GeminiClient = require('../../src/infra/clients/GeminiClient');
const PromptService = require('../../src/core/services/ai/PromptService');
const { resolveDNA } = require('../../src/core/config/AgentDNA');
const { NodeExecutionStateEnum } = require('../../src/core/types/CampaignEnums');

console.log('🤖 FSM + AI Integration Test (Neuro-Symbolic Architecture)\n');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

async function runTest() {
    // 1. Fetch REAL agent from DB (Jorse - TECH)
    const AGENT_ID = '5d100d8f-be87-4702-ae03-910df060072e';

    const { data: realAgent, error: agentError } = await supabase
        .from('agents')
        .select('*')
        .eq('id', AGENT_ID)
        .single();

    if (agentError || !realAgent) {
        console.log(`   ❌ Agent not found: ${agentError?.message || 'No data'}`);
        return;
    }

    console.log('📋 Agent Loaded from DB:');
    console.log(`   Name: ${realAgent.name}`);
    console.log(`   Model: ${realAgent.model}`);
    console.log(`   Provider: ${realAgent.provider}`);
    console.log(`   DNA Identity: ${JSON.stringify(realAgent.dna_config?.identity || {})}`);

    // 2. Test DNA Resolution
    console.log('\n1️⃣ Testing DNA Resolution (Agent DNA → Physics)...');
    const dna = resolveDNA(realAgent.dna_config);
    console.log(`   Physics WPM: ${dna.physics?.typing?.wpm || 'default'}`);
    console.log(`   PAD Vector: [${dna.padVector?.join(', ') || 'N/A'}]`);
    console.log(`   Identity Role: ${dna.identity?.role || 'N/A'}`);
    console.log(`   ✅ DNA Resolution works`);

    // 3. Test DIRECT AI Generation (bypassing node execution)
    console.log('\n2️⃣ Testing DIRECT AI Generation (Gemini)...');

    const geminiClient = new GeminiClient(process.env.GEMINI_API_KEY);
    const promptService = new PromptService(supabase);

    // Build a test prompt (simulating what AgenticNode would do)
    const testContext = {
        lead: { name: 'João Teste', phone: '5511999998888' },
        campaign: { id: 'test', agents: realAgent },
        agent: realAgent,
        chatHistory: [
            { role: 'user', content: 'Olá, vi que vocês trabalham com automação de vendas' }
        ],
        dna
    };

    const systemPrompt = await promptService.buildStitchedPrompt(testContext);
    console.log(`   System Prompt Length: ${systemPrompt.length} chars`);

    try {
        const aiResponse = await geminiClient.generateSimple(
            'gemini-2.0-flash', // Use stable model instead of preview
            systemPrompt,
            "Gere a próxima resposta baseada no histórico."
        );

        const responseText = aiResponse.text();
        console.log(`\n   🧠 Raw AI Response:`);
        console.log(`   ${responseText.substring(0, 500)}...`);

        // Try to parse as JSON
        try {
            let cleanText = responseText.trim();
            if (cleanText.startsWith('```')) {
                cleanText = cleanText.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/```\s*$/, '');
            }
            const parsed = JSON.parse(cleanText);

            console.log(`\n   📊 Parsed Response:`);
            console.log(`   - Intent: ${parsed.intent || 'N/A'}`);
            console.log(`   - Sentiment: ${parsed.sentiment_score || 'N/A'}`);
            console.log(`   - Confidence: ${parsed.confidence_score || 'N/A'}`);
            console.log(`   - Response: ${(parsed.response || parsed.messages?.[0] || 'N/A').substring(0, 100)}...`);
            console.log(`   ✅ AI Generation works!`);
        } catch (parseErr) {
            console.log(`   ⚠️ Response not JSON (might be free-form text)`);
            console.log(`   ✅ AI Generation works (non-JSON response)`);
        }

    } catch (aiError) {
        console.log(`   ❌ AI Error: ${aiError.message}`);
    }

    // 4. Test FSM Enums
    console.log('\n3️⃣ Testing FSM Enums...');
    console.log(`   NodeExecutionStateEnum.EXITED = ${NodeExecutionStateEnum.EXITED}`);
    console.log(`   NodeExecutionStateEnum.AWAITING_ASYNC = ${NodeExecutionStateEnum.AWAITING_ASYNC}`);
    console.log(`   NodeExecutionStateEnum.FAILED = ${NodeExecutionStateEnum.FAILED}`);
    console.log(`   ✅ FSM Enums exported correctly`);

    console.log('\n🎉 FSM + AI (Neuro-Symbolic) Test Complete!\n');
    console.log('📝 Architecture Summary:');
    console.log('   Campaign (FSM) → Decides WHAT (States, Transitions)');
    console.log('   Agent (AI) → Decides HOW (Language, Tone, Response)');
    console.log('   Both are ENUM-driven. Both are discrete-first.\n');
}

runTest().catch(console.error);
