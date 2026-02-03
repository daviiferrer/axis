const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

// Hardcoded for testing (from user screenshot / context)
const SUPABASE_URL = process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL'; // I need to find these envs... 
// Actually I'll use the ones from the project structure if I can find .env, but I can't read .env easily if it's not in the file list.
// I'll try to read the .env file first? Or just guess localhost?

// The backend is running on localhost:8000 based on waha.ts
const API_URL = 'http://localhost:8000/api/v1/waha';

async function test() {
    try {
        console.log('Testing Sentiment API...');

        // 1. I don't have direct DB access here without credentials. 
        // But I can try to hit the API with a guessed session?
        // User screenshot shows the chat is open.
        // I'll try to list chats first to get a valid chatId.

        // Assuming 'Teste_2' or similar session from context? 
        // In ChatsPage.tsx: const [currentSession, setCurrentSession] = useState ... stored in localStorage.

        // I'll try to fetch sessions first
        console.log('Fetching sessions...');
        const sessionsRes = await axios.get(`${API_URL}/sessions`);
        console.log('Sessions:', sessionsRes.data);

        if (!sessionsRes.data || sessionsRes.data.length === 0) {
            console.error('No sessions found.');
            return;
        }

        const session = sessionsRes.data[0].name;
        console.log(`Using session: ${session}`);

        // 2. Fetch chats for this session
        console.log(`Fetching chats for session ${session}...`);
        const chatsRes = await axios.get(`${API_URL}/chatting/chats?session=${session}`);
        const chats = chatsRes.data;
        console.log(`Found ${chats.length} chats.`);

        if (chats.length === 0) {
            console.error('No chats found.');
            return;
        }

        // 3. Pick the first chat and check sentiment
        const chat = chats[0];
        console.log(`Testing chat: ${chat.id} (${chat.name})`);

        const sentimentUrl = `${API_URL}/chatting/chats/${session}/${chat.id}/sentiment`;
        console.log(`Hitting: ${sentimentUrl}`);

        const sentimentRes = await axios.get(sentimentUrl);
        console.log('Sentiment Response:', sentimentRes.data);

    } catch (error) {
        console.error('Test Failed:', error.message);
        if (error.response) {
            console.error('Data:', error.response.data);
            console.error('Status:', error.response.status);
        }
    }
}

test();
