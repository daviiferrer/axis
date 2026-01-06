
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config({ path: '.env' });

async function listModels() {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    console.log('Fetching available models...');
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Dummy init to get client? No, need model manager.
        // The SDK might not expose listModels easily on the instance?
        // Actually typically it's specific methods.
        // Let's try to just run a simple generate with the requested model and see the exact error or success.

        const requested = "gemini-3-flash-preview";
        console.log(`Testing model: ${requested}`);
        const model3 = genAI.getGenerativeModel({ model: requested });
        const result = await model3.generateContent("Hello");
        console.log(`✅ Success! Model ${requested} is available.`);
        console.log(result.response.text());
    } catch (error) {
        console.error(`❌ Error with model:`, error.message);
        console.error('Full details:', error);
    }
}

listModels();
