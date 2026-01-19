const axios = require('axios');
const url = 'http://localhost:3000/api/sessions/asds/start';
console.log('Testing START session at:', url);

async function test() {
    try {
        const response = await axios.post(url, {}, { timeout: 10000 });
        console.log('Success!', response.data);
    } catch (error) {
        console.error('Failed.');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        } else {
            console.error('Error:', error.message);
        }
    }
}

test();
