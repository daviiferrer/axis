const axios = require('axios');

async function testSystemPing() {
    const url = 'http://localhost:8000/api/v1/waha/observability/ping';
    console.log(`Testing System Ping at: ${url}`);

    try {
        const response = await axios.get(url);
        console.log('✅ System Ping Success!');
        console.log('Status:', response.status);
        console.log('Data:', response.data);
    } catch (error) {
        console.error('❌ System Ping Failed!');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        } else {
            console.error('Error:', error.message);
        }
        process.exit(1);
    }
}

testSystemPing();
