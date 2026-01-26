/**
 * ÁXIS Real E2E Test - Multi-Company Simulation v2
 * 
 * Teste REAL com:
 * - WAHA (WhatsApp) enviando mensagens reais
 * - Gemini AI gerando respostas reais
 * - 4 campanhas diferentes (usando o agente existente)
 * - Número de teste: 5551999794450
 * - Sessão WAHA: teste_axis
 * 
 * Run: node tests/integration/REAL_E2E_TEST.js
 */
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// ==============================================================================
// CONFIG
// ==============================================================================

const CONFIG = {
    testPhone: '555199794450',
    wahaSession: 'teste_axis',
    wahaUrl: process.env.WAHA_API_URL || 'http://localhost:3000',
    userId: 'a0942102-6e31-481f-a026-2c57a310cad8',
    existingAgentId: '8922aa11-a7e8-447c-b1c3-58f8d73898ac', // Existing agent in DB

    // 4 campanhas/empresas simuladas
    companies: [
        {
            name: 'ÁXIS Tech',
            product: 'Plataforma de Automação com IA',
            agentName: 'Ana',
            tone: ['profissional', 'consultivo'],
            methodology: 'SPIN Selling'
        },
        {
            name: 'Solar Prime',
            product: 'Painéis Solares Residenciais',
            agentName: 'Carlos',
            tone: ['amigável', 'técnico'],
            methodology: 'BANT'
        },
        {
            name: 'FitPro Academia',
            product: 'Plano Mensal All-Inclusive',
            agentName: 'Marina',
            tone: ['energético', 'motivador'],
            methodology: 'Challenger Sale'
        },
        {
            name: 'Curso Online Pro',
            product: 'Curso de Marketing Digital',
            agentName: 'Pedro',
            tone: ['educativo', 'empolgante'],
            methodology: 'MEDDIC'
        }
    ]
};

// ==============================================================================
// SETUP
// ==============================================================================

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const axios = require('axios');

const testResults = {
    passed: 0,
    failed: 0,
    details: []
};

function log(emoji, message) {
    const timestamp = new Date().toLocaleTimeString('pt-BR');
    console.log(`[${timestamp}] ${emoji} ${message}`);
}

function pass(testName, details = '') {
    testResults.passed++;
    testResults.details.push({ status: 'PASS', test: testName, details });
    log('✅', `PASS: ${testName}`);
}

function fail(testName, error) {
    testResults.failed++;
    testResults.details.push({ status: 'FAIL', test: testName, error: error.message || error });
    log('❌', `FAIL: ${testName} - ${error.message || error}`);
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ==============================================================================
// WAHA CLIENT (Direct)
// ==============================================================================

async function wahaSendText(session, chatId, text) {
    const url = `${CONFIG.wahaUrl}/api/sendText`;
    const response = await axios.post(url, { session, chatId, text });
    return response.data;
}

async function wahaCheckHealth() {
    const url = `${CONFIG.wahaUrl}/api/sessions/${CONFIG.wahaSession}`;
    const response = await axios.get(url);
    return response.data;
}

async function wahaStartTyping(session, chatId) {
    const url = `${CONFIG.wahaUrl}/api/startTyping`;
    try {
        await axios.post(url, { session, chatId });
    } catch (e) {
        // Ignore typing errors
    }
}

// ==============================================================================
// TEST: WAHA Connection
// ==============================================================================

async function testWahaConnection() {
    try {
        const session = await wahaCheckHealth();

        if (session.status === 'WORKING') {
            pass('WAHA Connection', `Session "${CONFIG.wahaSession}" is WORKING`);
            return true;
        } else {
            fail('WAHA Connection', `Session status: ${session.status}`);
            return false;
        }
    } catch (e) {
        fail('WAHA Connection', e);
        return false;
    }
}

// ==============================================================================
// TEST: Real Gemini AI Call
// ==============================================================================

async function testGeminiAI() {
    const GeminiClient = require('../../src/infra/clients/GeminiClient');
    const PromptService = require('../../src/core/services/ai/PromptService');

    try {
        // Get API key
        const { data: settings } = await supabase
            .from('system_settings')
            .select('gemini_api_key')
            .limit(1)
            .single();

        if (!settings?.gemini_api_key) {
            fail('GeminiAI - API Key', 'No API key in system_settings');
            return null;
        }

        const gemini = new GeminiClient(settings.gemini_api_key);
        const promptService = new PromptService();

        // Simple test call
        const response = await gemini.generateSimple(
            'gemini-2.0-flash',
            'Você é um SDR profissional. Responda em JSON: {"response": "string"}',
            'Diga "Olá, como posso ajudá-lo hoje?"'
        );

        const text = response.text();
        if (text && text.length > 0) {
            pass('GeminiAI - Connection', `Response OK (${text.length} chars)`);
            return { gemini, promptService };
        } else {
            fail('GeminiAI - Connection', 'Empty response');
            return null;
        }

    } catch (e) {
        fail('GeminiAI', e);
        return null;
    }
}

// ==============================================================================
// TEST: Node Execution Flow
// ==============================================================================

async function testNodeExecution() {
    const testPrefix = 'Node Execution';

    try {
        const DelayNode = require('../../src/core/engines/workflow/nodes/DelayNode');
        const LogicNode = require('../../src/core/engines/workflow/nodes/LogicNode');

        // Test DelayNode
        const delayNode = new DelayNode();
        const delayResult = await delayNode.execute(
            { id: 'test-lead' },
            { id: 'test-campaign' },
            { id: 'delay-1', data: { delayValue: 1, delayUnit: 'm' } }
        );

        if (delayResult.checkpoint?.waitingFor === 'TIMER') {
            pass(`${testPrefix} - DelayNode`, `Timer checkpoint OK`);
        } else {
            fail(`${testPrefix} - DelayNode`, 'No TIMER checkpoint');
        }

        // Test LogicNode
        const logicNode = new LogicNode();
        const logicResult = await logicNode.execute(
            { id: 'test-lead', context: { lastIntent: 'INTERESTED' } },
            {},
            { id: 'logic-1' }
        );

        if (logicResult.edge === 'INTERESTED') {
            pass(`${testPrefix} - LogicNode`, 'Routing OK');
        } else {
            fail(`${testPrefix} - LogicNode`, `Unexpected edge: ${logicResult.edge}`);
        }

    } catch (e) {
        fail(testPrefix, e);
    }
}

// ==============================================================================
// MAIN: Generate and Send AI Messages
// ==============================================================================

async function generateAndSendMessages(aiTools) {
    const { gemini, promptService } = aiTools;
    const chatId = `${CONFIG.testPhone}@c.us`;

    log('🤖', '\n' + '='.repeat(60));
    log('🤖', 'GENERATING AI MESSAGES FOR 4 COMPANIES');
    log('🤖', '='.repeat(60) + '\n');

    for (let i = 0; i < CONFIG.companies.length; i++) {
        const company = CONFIG.companies[i];

        log('🏢', `\n--- ${company.name} ---`);
        log('👤', `Agente: ${company.agentName}`);
        log('📦', `Produto: ${company.product}`);
        log('🎯', `Metodologia: ${company.methodology}`);

        try {
            // Build prompt específico para cada empresa
            const promptData = {
                agent: {
                    name: company.agentName,
                    dna_config: {
                        identity: { role: 'SDR', company: company.name },
                        brand_voice: { tone: company.tone, emojis_allowed: true }
                    }
                },
                campaign: { name: `Campaign ${company.name}` },
                lead: { name: 'Lead Teste', phone: CONFIG.testPhone },
                product: {
                    name: company.product,
                    mainBenefit: `O melhor ${company.product} para você!`,
                    differentials: ['Atendimento 24h', 'Garantia de satisfação']
                },
                methodology: { framework: company.methodology },
                chatHistory: [],
                nodeDirective: `Você é ${company.agentName}, vendedor consultivo da ${company.name}. 
                                Use a metodologia ${company.methodology}. 
                                Faça uma abordagem inicial criativa e personalizada.
                                Seja natural, humano e convincente.
                                Sua mensagem deve ter no MÁXIMO 2 linhas.`,
                scopePolicy: 'READ_ONLY'
            };

            const systemInstruction = await promptService.buildStitchedPrompt(promptData);

            // Generate AI response
            const response = await gemini.generateSimple(
                'gemini-2.0-flash',
                systemInstruction,
                'Gere a primeira mensagem de prospecção. Seja breve (máximo 2 linhas).'
            );

            const text = response.text();
            let message = text;

            // Parse JSON if applicable
            try {
                const parsed = JSON.parse(text.replace(/```json?\n?/g, '').replace(/```/g, '').trim());
                message = parsed.messages?.[0] || parsed.response || text;
            } catch (e) {
                // Use raw text if not JSON
            }

            // Clean up message
            message = message.replace(/^["']|["']$/g, '').trim();

            log('💬', `Mensagem: "${message}"`);

            // Send via WAHA with company prefix
            await wahaStartTyping(CONFIG.wahaSession, chatId);

            const typingDelay = Math.min(message.length * 40, 3000);
            log('⏳', `Digitando (${typingDelay}ms)...`);
            await sleep(typingDelay);

            // Prepend company name for identification
            const fullMessage = `🏢 [${company.name}]\n\n${message}`;

            await wahaSendText(CONFIG.wahaSession, chatId, fullMessage);

            pass(`Message Sent (${company.name})`, `Via WAHA → ${CONFIG.testPhone}`);

            // Wait between messages
            if (i < CONFIG.companies.length - 1) {
                log('⏳', 'Aguardando 4s antes da próxima empresa...');
                await sleep(4000);
            }

        } catch (e) {
            fail(`Message (${company.name})`, e);
        }
    }
}

// ==============================================================================
// MAIN
// ==============================================================================

async function runFullE2ETest() {
    console.log('\n');
    console.log('═'.repeat(70));
    console.log('   ÁXIS Real E2E Test - Multi-Company AI Simulation');
    console.log('   🔥 REAL WAHA | 🤖 REAL GEMINI AI | 📱 REAL MESSAGES');
    console.log('═'.repeat(70));
    console.log(`   📱 Phone: ${CONFIG.testPhone}`);
    console.log(`   📡 Session: ${CONFIG.wahaSession}`);
    console.log(`   🏢 Companies: ${CONFIG.companies.length}`);
    console.log('═'.repeat(70));
    console.log('\n');

    // 1. Test WAHA Connection
    log('📡', 'Testing WAHA Connection...');
    const wahaOk = await testWahaConnection();

    if (!wahaOk) {
        log('❌', 'WAHA not available. Aborting E2E test.');
        console.log('\n💡 Make sure Docker is running with WAHA container.');
        process.exit(1);
    }

    // 2. Test Gemini AI
    log('🧠', 'Testing Gemini AI...');
    const aiTools = await testGeminiAI();

    if (!aiTools) {
        log('❌', 'Gemini AI not available. Aborting E2E test.');
        process.exit(1);
    }

    // 3. Test Node Execution
    log('🔧', 'Testing Node Execution...');
    await testNodeExecution();

    // 4. Generate and Send AI Messages for 4 Companies
    await generateAndSendMessages(aiTools);

    // 5. Summary
    console.log('\n');
    console.log('═'.repeat(70));
    console.log('   TEST SUMMARY');
    console.log('═'.repeat(70));
    console.log(`   ✅ Passed:  ${testResults.passed}`);
    console.log(`   ❌ Failed:  ${testResults.failed}`);
    console.log(`   📊 Total:   ${testResults.passed + testResults.failed}`);
    console.log('═'.repeat(70));

    if (testResults.failed > 0) {
        console.log('\n❌ FAILURES:');
        testResults.details
            .filter(d => d.status === 'FAIL')
            .forEach((err, i) => {
                console.log(`   ${i + 1}. ${err.test}: ${err.error}`);
            });
    }

    console.log('\n📱 Check your WhatsApp! You should have received 4 messages from 4 different "companies".');
    console.log('\n');

    process.exit(testResults.failed > 0 ? 1 : 0);
}

runFullE2ETest().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
