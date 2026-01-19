/**
 * SIMULADOR DE FLUXO REAL - ÁXIS CRM
 * Este script simula a chegada de uma nova mensagem e o disparo do fluxo de IA.
 * Utiliza o modelo Gemini-3-Flash configurado no DB.
 */

const axios = require('axios');

// === CONFIGURAÇÃO DO TESTE ===
const TARGET_PHONE = '+55 67 9689-4353'; // Mude aqui o número
const FIRST_MESSAGE = 'Olá, gostaria de saber mais sobre automação com IA.';
const BACKEND_URL = 'http://localhost:8000/api/v1'; // Ajuste se necessário

async function simulate() {
    console.log('🚀 Iniciando Simulação de Fluxo Real...');
    console.log(`📱 Destino: ${TARGET_PHONE}`);
    console.log(`💬 Mensagem: "${FIRST_MESSAGE}"`);

    const cleanPhone = TARGET_PHONE.replace(/\D/g, '');
    const chatId = `${cleanPhone}@s.whatsapp.net`;

    try {
        // Envia para o endpoint de simulação do desenvolvedor
        // Esse endpoint faz a persistência no DB e dispara o WorkflowEngine automaticamente
        const response = await axios.post(`${BACKEND_URL}/dev/simulate`, {
            action: 'message',
            chatId: chatId,
            payload: {
                text: FIRST_MESSAGE,
                session: 'PRINCIPAL' // Nome da sessão WAHA
            }
        });

        console.log('✅ Comando enviado com sucesso!');
        console.log('📦 Resposta do Servidor:', response.data);
        console.log('\n🔍 Verifique os logs do backend para acompanhar o raciocínio do Gemini 3.');

    } catch (error) {
        console.error('❌ Falha na simulação:');
        if (error.response) {
            console.error(`Status: ${error.response.status}`);
            console.error('Data:', error.response.data);
        } else {
            console.error('Erro:', error.message);
        }
    }
}

simulate();
