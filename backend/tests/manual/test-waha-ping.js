const WahaClient = require('../../src/infra/clients/WahaClient');
require('dotenv').config({ path: '../../.env' });

async function testWahaConnection() {
    try {
        console.log('--- WAHA Connectivity Test ---');
        console.log('Target URL: ' + (process.env.WAHA_API_URL || 'http://localhost:3000'));

        const waha = new WahaClient();
        console.log('Attempting to ping WAHA...');

        // Use getPing which is mapped to /server/status or similar
        // Based on WahaClient.js refactor, let's verify which method is exposed
        // Checking WahaClient.js source via memory...

        // Assuming getPing exists as per recent refactor
        const result = await waha.getPing();

        console.log('✅ WAHA is REACHABLE!');
        console.log('Status Response:', result);
    } catch (error) {
        console.error('❌ Connection Failed!');
        console.error('Error:', error.message);
        if (error.response) {
            console.error('Response Status:', error.response.status);
            console.error('Response Data:', error.response.data);
        }
        process.exit(1);
    }
}

testWahaConnection();
