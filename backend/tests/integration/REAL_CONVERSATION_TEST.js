/**
 * ÁXIS Real Bidirectional Conversation Test
 * 
 * TESTE REAL DE CONVERSA COM IA:
 * 1. Bot envia mensagem inicial
 * 2. Simula resposta do usuário via webhook
 * 3. IA processa e gera resposta
 * 4. Bot responde com mensagem gerada pela IA
 * 
 * Run: node tests/integration/REAL_CONVERSATION_TEST.js
 */
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

// ==============================================================================
// CONFIG
// ==============================================================================

const CONFIG = {
    testPhone: '555199794450',
    wahaSession: 'teste_axis',
    wahaUrl: process.env.WAHA_API_URL || 'http://localhost:3000',
    backendUrl: process.env.BACKEND_URL || 'http://localhost:8000',
    userId: 'a0942102-6e31-481f-a026-2c57a310cad8'
};

// ==============================================================================
// SETUP
// ==============================================================================

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

function log(emoji, message) {
    const timestamp = new Date().toLocaleTimeString('pt-BR');
    console.log(`[${timestamp}] ${emoji} ${message}`);
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ==============================================================================
// WAHA Functions
// ==============================================================================

async function wahaSendText(chatId, text) {
    const url = `${CONFIG.wahaUrl}/api/sendText`;
    const response = await axios.post(url, {
        session: CONFIG.wahaSession,
        chatId,
        text
    });
    return response.data;
}

async function wahaStartTyping(chatId) {
    try {
        await axios.post(`${CONFIG.wahaUrl}/api/startTyping`, {
            session: CONFIG.wahaSession,
            chatId
        });
    } catch (e) { }
}

// ==============================================================================
// MAIN CONVERSATION TEST
// ==============================================================================

async function runConversationTest() {
    console.log('\n');
    console.log('═'.repeat(70));
    console.log('   ÁXIS Real Bidirectional Conversation Test');
    console.log('   🔄 REAL AI CONVERSATION - Send & Receive');
    console.log('═'.repeat(70));
    console.log(`   📱 Phone: ${CONFIG.testPhone}`);
    console.log(`   📡 Session: ${CONFIG.wahaSession}`);
    console.log('═'.repeat(70));
    console.log('\n');

    const chatId = `${CONFIG.testPhone}@c.us`;

    try {
        // =====================================================================
        // STEP 1: Get API Key from DB
        // =====================================================================
        log('🔑', 'Getting Gemini API Key from DB...');

        const { data: settings, error: settingsError } = await supabase
            .from('system_settings')
            .select('gemini_api_key')
            .limit(1)
            .single();

        if (settingsError || !settings?.gemini_api_key) {
            throw new Error('Gemini API Key not found in system_settings');
        }

        const apiKey = settings.gemini_api_key;
        log('✅', 'API Key loaded successfully');

        // =====================================================================
        // STEP 2: Initialize Gemini with API Key
        // =====================================================================
        log('🧠', 'Initializing Gemini AI...');

        const { GoogleGenerativeAI } = require('@google/generative-ai');
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        log('✅', 'Gemini initialized');

        // =====================================================================
        // STEP 3: Test AI Generation
        // =====================================================================
        log('🤖', 'Testing AI generation...');

        const testPrompt = `Você é Ana, uma SDR da empresa ÁXIS.
        Fale de forma natural e humana.
        Gere uma mensagem de saudação curta (máximo 1 linha) para um lead.
        Responda APENAS a mensagem, sem JSON ou formatação extra.`;

        const testResult = await model.generateContent(testPrompt);
        const testMessage = testResult.response.text().trim();

        log('✅', `AI Test Response: "${testMessage}"`);

        // =====================================================================
        // STEP 4: Send Initial Message via WAHA
        // =====================================================================
        log('📤', 'Sending initial message via WAHA...');

        await wahaStartTyping(chatId);
        await sleep(1000);

        const initialMessage = `🤖 [TESTE ÁXIS - IA REAL]\n\n${testMessage}`;
        await wahaSendText(chatId, initialMessage);

        log('✅', 'Initial message sent!');

        // =====================================================================
        // STEP 5: Wait for user response simulation
        // =====================================================================
        log('⏳', '\n' + '='.repeat(50));
        log('📱', 'AGORA RESPONDA NO WHATSAPP!');
        log('📱', `Mande uma mensagem para o número conectado à sessão "${CONFIG.wahaSession}"`);
        log('📱', 'A IA vai responder automaticamente!');
        log('⏳', '='.repeat(50) + '\n');

        log('⏳', 'Aguardando 30 segundos para você responder...');

        // Poll for new messages
        let attempts = 0;
        const maxAttempts = 30; // 30 seconds
        let userMessage = null;

        while (attempts < maxAttempts) {
            await sleep(1000);
            attempts++;

            // Check for new messages in leads table
            const { data: lead } = await supabase
                .from('leads')
                .select('last_message_body, last_user_message_at, status')
                .eq('phone', CONFIG.testPhone)
                .order('last_user_message_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (lead?.last_message_body && lead.last_user_message_at) {
                const messageTime = new Date(lead.last_user_message_at);
                const now = new Date();
                const diffSeconds = (now - messageTime) / 1000;

                // If message is recent (within last 30 seconds)
                if (diffSeconds < 35 && diffSeconds > 0) {
                    userMessage = lead.last_message_body;
                    log('📩', `User message received: "${userMessage}"`);
                    break;
                }
            }

            if (attempts % 5 === 0) {
                log('⏳', `Waiting... ${maxAttempts - attempts}s remaining`);
            }
        }

        if (!userMessage) {
            log('⚠️', 'No user message received after 30s. Simulating a response...');
            userMessage = 'Olá! Tenho interesse em saber mais sobre o produto.';
        }

        // =====================================================================
        // STEP 6: Generate AI Response to User Message
        // =====================================================================
        log('🧠', `Generating AI response to: "${userMessage}"`);

        const responsePrompt = `Você é Ana, uma SDR experiente da empresa ÁXIS.
        
O lead disse: "${userMessage}"

Sua tarefa:
1. Responda de forma natural, consultiva e empática
2. Use a metodologia SPIN Selling
3. Faça uma pergunta para entender melhor a situação do lead
4. Máximo 2 linhas

Responda APENAS a mensagem, sem JSON ou formatação extra.`;

        const aiResult = await model.generateContent(responsePrompt);
        const aiResponse = aiResult.response.text().trim();

        log('💡', `AI Generated: "${aiResponse}"`);

        // =====================================================================
        // STEP 7: Send AI Response via WAHA
        // =====================================================================
        log('📤', 'Sending AI response via WAHA...');

        await wahaStartTyping(chatId);
        await sleep(Math.min(aiResponse.length * 50, 3000));

        const finalMessage = `🤖 [IA REAL - RESPOSTA]\n\n${aiResponse}`;
        await wahaSendText(chatId, finalMessage);

        log('✅', 'AI response sent!');

        // =====================================================================
        // STEP 8: Another round? (Manual conversation mode)
        // =====================================================================
        log('🔄', '\n' + '='.repeat(50));
        log('🔄', 'MODO CONVERSA CONTÍNUA');
        log('🔄', 'Continue respondendo no WhatsApp para testar mais!');
        log('🔄', 'O teste vai continuar por mais 60 segundos...');
        log('🔄', '='.repeat(50) + '\n');

        let conversationRounds = 0;
        const maxRounds = 3;
        let lastProcessedMessage = userMessage;

        while (conversationRounds < maxRounds) {
            await sleep(1000);

            // Check for new messages
            const { data: lead } = await supabase
                .from('leads')
                .select('last_message_body, last_user_message_at')
                .eq('phone', CONFIG.testPhone)
                .order('last_user_message_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (lead?.last_message_body && lead.last_message_body !== lastProcessedMessage) {
                const newMessage = lead.last_message_body;
                lastProcessedMessage = newMessage;

                log('📩', `New message: "${newMessage}"`);
                log('🧠', 'Generating response...');

                const roundPrompt = `Você é Ana, SDR da ÁXIS. Contexto da conversa anterior.
O lead disse: "${newMessage}"
Responda de forma natural e consultiva (máximo 2 linhas).
Responda APENAS a mensagem, sem JSON.`;

                const roundResult = await model.generateContent(roundPrompt);
                const roundResponse = roundResult.response.text().trim();

                log('💡', `AI: "${roundResponse}"`);

                await wahaStartTyping(chatId);
                await sleep(Math.min(roundResponse.length * 50, 3000));

                await wahaSendText(chatId, `🤖 [IA]\n\n${roundResponse}`);
                log('✅', 'Response sent!');

                conversationRounds++;
                log('🔄', `Round ${conversationRounds}/${maxRounds} complete`);
            }

            // Timeout after 60 seconds of no activity
            if (conversationRounds === 0) {
                await sleep(60000);
                break;
            }
        }

        // =====================================================================
        // SUMMARY
        // =====================================================================
        console.log('\n');
        console.log('═'.repeat(70));
        console.log('   TEST COMPLETE');
        console.log('═'.repeat(70));
        console.log('   ✅ API Key loaded from DB');
        console.log('   ✅ Gemini AI initialized');
        console.log('   ✅ Initial message sent');
        console.log('   ✅ AI response generated and sent');
        console.log(`   📊 Conversation rounds: ${conversationRounds}`);
        console.log('═'.repeat(70));
        console.log('\n');

    } catch (error) {
        log('❌', `ERROR: ${error.message}`);
        console.error(error);
        process.exit(1);
    }
}

runConversationTest();
