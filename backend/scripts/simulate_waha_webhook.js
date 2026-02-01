const axios = require('axios');

const BACKEND_URL = 'http://localhost:8000/api/v1/webhook/waha';
const SESSION_NAME = 'testee'; // Nome da sessão que o user mencionou

const samplePayload = {
    event: "message",
    session: SESSION_NAME,
    payload: {
        id: "false_1234567890@c.us_3EB0...",
        timestamp: Math.floor(Date.now() / 1000),
        from: "5511999999999@c.us",
        to: "5511888888888@c.us",
        body: "Teste de Debugging via Script",
        hasMedia: false,
        ack: 1,
        _data: {
            notifyName: "Tester"
        }
    }
};

async function simulateWebhook() {
    console.log(`🚀 Simulating WAHA Webhook to: ${BACKEND_URL}`);
    console.log(`📦 Session: ${SESSION_NAME}`);

    try {
        const response = await axios.post(BACKEND_URL, samplePayload);
        console.log(`✅ Success! Status: ${response.status}`);
        console.log('Response:', response.data);
    } catch (error) {
        console.error('❌ Error sending webhook:');
        console.error(`Message: ${error.message}`);
        console.error(`Code: ${error.code}`); // ECONNREFUSED?
        if (error.response) {
            console.error(`Status: ${error.response.status}`);
            console.error('Data:', error.response.data);
        }
    }
}

simulateWebhook();
