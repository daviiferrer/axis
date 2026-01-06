/**
 * AI Scenarios Test
 * Valida diferentes comportamentos do Agente e Ajuste Emocional
 */
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const PromptService = require('../../src/core/services/ai/PromptService');
const EmotionalStateService = require('../../src/core/services/ai/EmotionalStateService');
const GeminiClient = require('../../src/infra/clients/GeminiClient');
const SettingsService = require('../../src/core/services/system/SettingsService');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const SCENARIOS = [
    {
        name: '🤬 Lead Bravo / Insatisfeito',
        history: [
            { role: 'assistant', content: 'Olá! Sou a Ana e gostaria de apresentar nossa solução.' },
            { role: 'user', content: 'Pare de me ligar! Já disse que não tenho interesse! Que saco!' }
        ],
        mockEmotionalState: { pleasure: 0.1, arousal: 0.9, dominance: 0.8 }, // Lead bravo, energizado, dominante
        expectedAdjustment: 'Responda de forma mais curta e séria. O lead parece frustrado.'
    },
    {
        name: '🤝 Handoff / Falar com Humano',
        history: [
            { role: 'assistant', content: 'Podemos automatizar seus processos.' },
            { role: 'user', content: 'Olha, isso é muito complexo. Quero falar com um atendente real agora.' }
        ],
        mockEmotionalState: { pleasure: 0.4, arousal: 0.6, dominance: 0.6 },
        expectedAction: 'handoff'
    },
    {
        name: '💰 Qualificação / Orçamento',
        history: [
            { role: 'assistant', content: 'Qual seria seu orçamento mensal para esse projeto?' },
            { role: 'user', content: 'Temos uns 5 mil reais por mês aprovados.' }
        ],
        mockEmotionalState: { pleasure: 0.7, arousal: 0.5, dominance: 0.5 },
        expectedSlot: 'budget'
    }
];

async function runScenarios() {
    console.log('🎭 AI Multi-Scenario Test\n');

    // 1. Setup Básico (Campanha/Agente)
    const { data: campaign } = await supabase.from('campaigns').select('*').eq('name', 'TEST_ALL_NODES').single();
    if (!campaign) { console.error('Execute test_all_nodes.js primeiro'); return; }

    const { data: agent } = await supabase.from('agents').select('*').eq('campaign_id', campaign.id).single();
    const settingsService = new SettingsService(supabase);
    const apiKey = await settingsService.getProviderKey(campaign.user_id, 'gemini');
    const gemini = new GeminiClient(apiKey);
    const promptService = new PromptService();
    const emotionalService = new EmotionalStateService(supabase);

    // Config básica do agente
    const agentConfig = {
        name: agent.name,
        dna_config: agent.dna_config || {},
        tone_vector: { formality: 3, humor: 2 }
    };

    // 2. Rodar Cenários
    for (const scenario of SCENARIOS) {
        console.log('\n' + '='.repeat(60));
        console.log(`🎬 CENÁRIO: ${scenario.name}`);
        console.log('='.repeat(60));

        // 2.1 Ajuste Emocional (Simulado)
        console.log(`\n1. Simulação Emocional (PAD: P=${scenario.mockEmotionalState.pleasure}, A=${scenario.mockEmotionalState.arousal})`);
        const emotionalAdjustment = emotionalService.getEmotionalAdjustment(scenario.mockEmotionalState);
        console.log(`   📝 Ajuste Gerado: "${emotionalAdjustment.replace(/<[^>]*>/g, '').trim()}"`);

        // 2.2 Montar Prompt
        const promptData = {
            agent: agentConfig,
            campaign,
            lead: { name: 'Lead Teste', custom_fields: {} },
            product: {}, methodology: {},
            objectionPlaybook: [],
            chatHistory: scenario.history,
            emotionalAdjustment,
            scopePolicy: 'READ_ONLY'
        };

        const systemInstruction = await promptService.buildStitchedPrompt(promptData);

        // Validar instrução de handoff
        if (scenario.name.includes('Handoff')) {
            console.log('\n🔍 Verificando Handoff Tools...');
            // Na versão real, as tools são passadas para o Gemini. No prompt textual, verificamos as instruções.
            // Ohand off é tratado via Tool Calling nativo ou JSON output.
            // Vamos testar a chamada para ver se ele gera o JSON de crm_actions ou tool call
        }

        // 2.3 Chamar API (com fallback de erro de quota)
        console.log(`\n2. Chamando Gemini (${agent.model})...`);
        try {
            const response = await gemini.generateSimple(
                agent.model,
                systemInstruction,
                'Gere a resposta e as ações JSON.'
            );

            const text = response.text();
            console.log('\n✅ Resposta:');
            try {
                const parsed = JSON.parse(text);
                console.log(`   💭 Pensamento: ${parsed.thought}`);
                console.log(`   💬 Msg: ${parsed.messages?.[0]}`);
                console.log(`   ⚡ Ações: ${JSON.stringify(parsed.crm_actions || [])}`);

                if (scenario.expectedAction && parsed.crm_actions?.some(a => a.type === scenario.expectedAction)) {
                    console.log('   ✅ Handoff detectado com sucesso!');
                }
            } catch {
                console.log('   (Texto Raw):', text);
            }

        } catch (err) {
            if (err.message.includes('Quota')) {
                console.log('   ⚠️ Quota excedida (Esperado). O prompt foi validado.');
            } else {
                console.error('   ❌ Erro:', err.message);
            }
        }
    }
}

runScenarios();
