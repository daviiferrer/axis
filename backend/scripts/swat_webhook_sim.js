/**
 * SWAT: Simulated Webhook Analysis Tool
 * ---------------------------------------
 * Use this script to simulate incoming WhatsApp messages (including Ad Clicks)
 * locally without needing real ads or WAHA instance.
 * 
 * Usage: node swat_webhook_sim.js [type] [phone]
 * Types:
 *  - text: Standard text message
 *  - ad:   Click-to-WhatsApp Ad (with Referral)
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:8000/api/v1/webhook/waha'; // Port 8000 + v1 + waha suffix
const SESSION = 'default';

async function sendWebhook(payload) {
    try {
        console.log('📡 Sending Webhook...');
        console.log(JSON.stringify(payload, null, 2));

        const response = await axios.post(BASE_URL, payload);
        console.log(`✅ Status: ${response.status} ${response.statusText}`);
        console.log('Response:', response.data);
    } catch (error) {
        console.error('❌ Error sending webhook:', error.message);
        if (error.response) {
            console.error('Server Response:', error.response.data);
        }
    }
}

const type = process.argv[2] || 'text';
const phone = process.argv[3] || '5511999998888';

const basePayload = {
    event: 'message',
    session: SESSION,
    payload: {
        id: 'false_' + phone + '@c.us_3EB0' + Date.now(),
        timestamp: Math.floor(Date.now() / 1000),
        from: phone + '@c.us',
        to: '5511999990000@c.us',
        fromMe: false,
        _data: {
            notifyName: "Test User"
        }
    }
};

if (type === 'text') {
    basePayload.payload.body = "Olá, gostaria de saber mais.";
}
else if (type === 'ad') {
    basePayload.payload.body = "Vi isso no Facebook";
    // WAHA/Meta Referral Object Structure
    basePayload.payload._data.referral = {
        source_url: "https://fb.me/123456",
        source_id: "123456789 (Ad ID)",
        source_type: "ad",
        headline: "Promoção Black Friday",
        body: "Clique aqui para ganhar 50% de desconto"
    };
    // Include in top level if WAHA flattens it (defensive)
    basePayload.payload.referral = basePayload.payload._data.referral;
}

sendWebhook(basePayload);
