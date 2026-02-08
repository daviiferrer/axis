const GeminiClient = require('../src/infra/clients/GeminiClient');

// MOCK DEPENDENCIES to isolate the test
const mockSupabase = {
    from: (table) => ({
        insert: async (data) => {
            console.log(`\n📦 [DATABASE MOCK] Inserting into table '${table}':`);
            console.log(JSON.stringify(data, null, 2));

            if (data.session_id === 'SESSION_TESTE_LOCAL') {
                console.log('\n✅ TEST PASS: session_id was correctly received and prepared for saving.');
            } else {
                console.error('\n❌ TEST FAIL: session_id is NULL or incorrect.');
                process.exit(1);
            }
            return { error: null };
        }
    })
};

const mockSettingsService = {
    supabase: mockSupabase,
    getProviderKey: async () => 'mock-key'
};

const mockBilling = {
    deductCredits: async () => true
};

// Instantiate Client
const client = new GeminiClient({
    billingService: mockBilling,
    settingsService: mockSettingsService
});

// TEST CASE
console.log('🚀 Running Local Verification: GeminiClient Session Logging');
console.log('---------------------------------------------------------');

const mockMetrics = {
    model: 'gemini-2.5-flash-test',
    prompt_tokens: 50,
    completion_tokens: 20
};

const mockContext = {
    userId: 'user_123',
    companyId: 'comp_abc',
    chatId: '5511999999999@s.whatsapp.net',
    sessionId: 'SESSION_TESTE_LOCAL' // <--- This is what we are testing
};

// Execute Log Usage
client._logUsage(mockMetrics, mockContext)
    .then(() => console.log('\n---------------------------------------------------------'))
    .catch(err => console.error('Error running test:', err));
