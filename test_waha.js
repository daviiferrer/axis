const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '.env') });

const url = 'http://localhost:3000/api/sessions';
console.log('Testing WAHA connectivity at:', url);

async function test() {
    try {
        const response = await axios.get(url, { timeout: 5000 });
        console.log('Success! WAHA is reachable.');
        console.log('Status:', response.status);
        console.log('Sessions:', response.data);
    } catch (error) {
        console.error('Failed to reach WAHA.');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        } else {
            console.error('Error:', error.message);
        }
    }
}

test();
