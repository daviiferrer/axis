/**
 * SIMULADOR DE FLUXO REAL - ÁXIS CRM
 * Este script simula a chegada de uma nova mensagem e o disparo do fluxo de IA.
 * Utiliza o modelo Gemini-3-Flash configurado no DB.
 */

const axios = require('axios');

// === CONFIGURAÇÃO DO TESTE ===
// Mude o número abaixo para testar novos leads
const TARGET_PHONE = '+55 67 9689-4353';
const FIRST_MESSAGE = 'Olá, vi seu anúncio no Instagram e gostaria de saber como a IA pode ajudar minha empresa.';
const BACKEND_URL = 'http://localhost:8000/api/v1';

async function simulate() {
    console.log('--- [AXIS REAL FLOW SIMULATOR] ---');
    console.log(`🚀 Iniciando Simulação para: ${TARGET_PHONE}`);
    console.log(`🤖 Usando Agente: Gemini 3.0 SDR (Cold Prospection)`);

    const cleanPhone = TARGET_PHONE.replace(/\D/g, '');
    const chatId = `${cleanPhone}@s.whatsapp.net`;

    try {
        console.log('📡 Injetando mensagem na Rota de Webhook (Waha)...');

        const response = await axios.post(`${BACKEND_URL}/webhook/waha`, {
            event: 'message',
            session: 'PRINCIPAL',
            payload: {
                from: chatId,
                body: FIRST_MESSAGE,
                fromMe: false,
                timestamp: Math.floor(Date.now() / 1000),
                _data: {
                    notifyName: 'Simulated User'
                }
            }
        });

        console.log('✅ SUCESSO: Mensagem injetada com sucesso.');
        console.log('📦 Status do Servidor:', response.data.message);
        console.log('\n--- PRÓXIMOS PASSOS ---');
        console.log('1. Verifique os logs do Cloud/Terminal do Backend.');
        console.log('2. Você verá o Gemini 3.0 "Thinking" e gerando a resposta.');
        console.log('3. A resposta será enviada via WAHA se a sessão estiver ONLINE.');

    } catch (error) {
        console.error('❌ ERRO NA SIMULAÇÃO:');
        if (error.response) {
            console.error(`Status: ${error.response.status}`);
            console.error('Mensagem:', error.response.data.error || error.response.data);
        } else {
            console.error('Conexão:', error.message);
            console.error('DICA: Certifique-se de que o backend está rodando em http://localhost:8000');
        }
    }
}

simulate();
