const axios = require('axios');

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Human-Like Latency Simulation (inspired by WahaClient.sendTextWithLatency)
 */
async function humanLatency(text, chatId, baseUrl, sessionName) {
    const words = text.split(/\s+/).length;
    const delayMs = Math.min((words * 300) + 2500, 15000);
    console.log(`   -> ⏳ Human Latency: ${delayMs}ms for ${words} words`);

    try {
        await axios.post(`${baseUrl}/chatting/startTyping`, { session: sessionName, chatId });
    } catch (e) { /* ignore typing errors */ }
    await delay(delayMs);
    return delayMs;
}

/**
 * Wrapper to run a test step with error handling - NEVER STOPS
 */
async function runStep(stepName, stepFn) {
    try {
        await stepFn();
        return true;
    } catch (error) {
        console.error(`   ❌ ${stepName} FAILED!`);
        if (error.response) {
            console.error(`      Status: ${error.response.status}`);
            console.error(`      Data: ${JSON.stringify(error.response.data)}`);
        } else {
            console.error(`      Error: ${error.message}`);
        }
        console.log(`   ⚠️ Continuing to next test...`);
        return false;
    }
}

async function runTests() {
    const baseUrl = 'http://localhost:8000/api/v1/waha';
    const targetNumber = '5518998232124@c.us';
    let sessionName = 'Davi';
    let msgId = null;
    let passed = 0;
    let failed = 0;

    console.log('🚀 Starting Comprehensive WAHA Chatting Tests...');
    console.log(`🎯 Target: ${targetNumber}`);
    console.log(`🔌 Base URL: ${baseUrl}`);

    // --- 1. Session Check ---
    console.log('\n[1/10] Checking Session...');
    const sessionOk = await runStep('Session Check', async () => {
        const sessionRes = await axios.get(`${baseUrl}/sessions`);
        const activeSession = sessionRes.data.find(s => s.status === 'WORKING');
        if (activeSession) {
            sessionName = activeSession.name;
            console.log(`   ✅ Using Active Session: ${sessionName}`);
        } else {
            console.warn('   ⚠️ No WORKING session found. Using default "Davi".');
        }
    });
    sessionOk ? passed++ : failed++;

    // --- 2. Presence (Typing) ---
    console.log('\n[2/10] Testing Presence (Typing)...');
    const presenceOk = await runStep('Presence', async () => {
        await axios.post(`${baseUrl}/chatting/startTyping`, { session: sessionName, chatId: targetNumber });
        console.log('   -> Started typing...');
        await delay(2000);
        await axios.post(`${baseUrl}/chatting/stopTyping`, { session: sessionName, chatId: targetNumber });
        console.log('   ✅ Stopped typing.');
    });
    presenceOk ? passed++ : failed++;

    // --- 3. Text Message (with Human Latency) ---
    console.log('\n[3/10] Testing Text Message (with Human Latency)...');
    const textOk = await runStep('Text Message', async () => {
        const testText = '🤖 Teste Automático: Início da Bateria de Testes WAHA Backend! 🚀';
        await humanLatency(testText, targetNumber, baseUrl, sessionName);

        const textRes = await axios.post(`${baseUrl}/chatting/sendText`, {
            session: sessionName,
            chatId: targetNumber,
            text: testText
        });

        msgId = textRes.data.id || textRes.data.key?.id || textRes.data.messageId;
        console.log(`   ✅ Text Sent! ID: ${msgId}`);
    });
    textOk ? passed++ : failed++;

    // --- 4. Reaction & Star ---
    console.log('\n[4/10] Testing Reaction & Star...');
    if (msgId) {
        console.log('   -> ⏳ Waiting 5s for message indexing...');
        await delay(5000);

        const reactionOk = await runStep('Reaction', async () => {
            await axios.put(`${baseUrl}/chatting/reaction`, {
                session: sessionName,
                chatId: targetNumber,
                messageId: msgId,
                reaction: '🧪'
            });
            console.log('   ✅ Reacted with 🧪');
        });
        reactionOk ? passed++ : failed++;

        const starOk = await runStep('Star', async () => {
            await axios.put(`${baseUrl}/chatting/star`, {
                session: sessionName,
                chatId: targetNumber,
                messageId: msgId,
                star: true
            });
            console.log('   ✅ Starred message');
        });
        starOk ? passed++ : failed++;
    } else {
        console.warn('   ⚠️ No message ID, skipping Reaction & Star.');
        failed += 2;
    }

    // --- 5. Link Preview ---
    console.log('\n[5/10] Testing Link Preview...');
    const linkOk = await runStep('Link Preview', async () => {
        await axios.post(`${baseUrl}/chatting/send/link-custom-preview`, {
            session: sessionName,
            chatId: targetNumber,
            url: 'https://google.com',
            title: 'Google Search Test'
        });
        console.log('   ✅ Link Preview Sent');
    });
    linkOk ? passed++ : failed++;

    // --- 6. Poll ---
    console.log('\n[6/10] Testing Poll...');
    const pollOk = await runStep('Poll', async () => {
        await axios.post(`${baseUrl}/chatting/sendPoll`, {
            session: sessionName,
            chatId: targetNumber,
            poll: {
                name: 'O Backend está funcionando?',
                options: ['Sim 🚀', 'Com certeza 🔥', 'Talvez 🤔'],
                multipleAnswers: false
            }
        });
        console.log('   ✅ Poll Sent');
    });
    pollOk ? passed++ : failed++;

    // --- 7. Location ---
    console.log('\n[7/10] Testing Location...');
    const locationOk = await runStep('Location', async () => {
        await axios.post(`${baseUrl}/chatting/sendLocation`, {
            session: sessionName,
            chatId: targetNumber,
            latitude: -23.550520,
            longitude: -46.633308,
            title: 'São Paulo - Teste Location'
        });
        console.log('   ✅ Location Sent');
    });
    locationOk ? passed++ : failed++;

    // --- 8. Contact VCard ---
    console.log('\n[8/10] Testing VCard...');
    const vcardOk = await runStep('VCard', async () => {
        await axios.post(`${baseUrl}/chatting/sendContactVcard`, {
            session: sessionName,
            chatId: targetNumber,
            contacts: [{ fullName: 'Suporte Teste', organization: 'Ferrer Studio', phoneNumber: '5511999999999' }]
        });
        console.log('   ✅ VCard Sent');
    });
    vcardOk ? passed++ : failed++;

    // --- 9. Buttons ---
    console.log('\n[9/10] Testing Buttons...');
    const buttonsOk = await runStep('Buttons', async () => {
        await axios.post(`${baseUrl}/chatting/sendButtons`, {
            session: sessionName,
            chatId: targetNumber,
            title: 'Teste de Botões',
            footer: 'Selecione uma opção',
            buttons: [{ id: 'btn_1', text: 'Opção 1' }, { id: 'btn_2', text: 'Opção 2' }]
        });
        console.log('   ✅ Buttons Sent');
    });
    buttonsOk ? passed++ : failed++;

    // --- 10. Mark Seen ---
    console.log('\n[10/10] Testing Mark Seen...');
    const seenOk = await runStep('Mark Seen', async () => {
        await axios.post(`${baseUrl}/chatting/sendSeen`, {
            session: sessionName,
            chatId: targetNumber
        });
        console.log('   ✅ Marked as Seen');
    });
    seenOk ? passed++ : failed++;

    // --- Summary ---
    console.log('\n' + '='.repeat(50));
    console.log(`📊 TEST SUMMARY: ${passed} passed, ${failed} failed`);
    if (failed === 0) {
        console.log('🎉 ALL TESTS PASSED!');
    } else {
        console.log('⚠️ Some tests failed. Review output above.');
    }
}

runTests();
