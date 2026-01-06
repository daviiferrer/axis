/**
 * Real AI Test - MODELO VEM DA TABELA AGENTS!
 */
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

const PromptService = require('../../src/core/services/ai/PromptService');
const GeminiClient = require('../../src/infra/clients/GeminiClient');
const SettingsService = require('../../src/core/services/system/SettingsService');

async function testRealAI() {
    console.log('🤖 Real AI Test - Modelo da Tabela AGENTS\n');
    console.log('='.repeat(60));

    try {
        // 1. Buscar campanha
        const { data: campaign, error } = await supabase
            .from('campaigns')
            .select('*')
            .eq('name', 'TEST_ALL_NODES')
            .single();

        if (error || !campaign) {
            console.error('❌ Campanha TEST_ALL_NODES não encontrada. Execute test_all_nodes.js primeiro.');
            return;
        }
        console.log(`✅ Campanha: ${campaign.name} (${campaign.id})`);

        // 2. Buscar AGENTE da tabela agents (MODELO VEM DAQUI!)
        const { data: agent, error: agentError } = await supabase
            .from('agents')
            .select('*')
            .eq('campaign_id', campaign.id)
            .single();

        if (!agent) {
            console.error('❌ Nenhum agente na tabela agents para esta campanha.');
            console.error('   Execute test_all_nodes.js primeiro.');
            return;
        }

        // MODELO VEM DA TABELA AGENTS - SEM FALLBACK!
        if (!agent.model) {
            console.error('❌ ERRO: Agente não tem modelo configurado!');
            console.error('   Configure agents.model na tabela agents.');
            return;
        }

        console.log(`\n📊 Agente da tabela 'agents':`);
        console.log(`   ID: ${agent.id}`);
        console.log(`   Nome: ${agent.name}`);
        console.log(`   Modelo: ${agent.model} ← DA TABELA AGENTS`);

        // 3. Buscar lead
        const { data: lead } = await supabase
            .from('campaign_leads')
            .select('*')
            .eq('campaign_id', campaign.id)
            .single();

        if (!lead) {
            console.error('❌ Lead não encontrado.');
            return;
        }
        console.log(`✅ Lead: ${lead.name} (${lead.phone})`);

        // 4. Extrair contexto do strategy_graph
        const graph = campaign.strategy_graph;
        const productNode = graph.nodes?.find(n => n.type === 'product');
        const methodologyNode = graph.nodes?.find(n => n.type === 'methodology');
        const objectionNodes = graph.nodes?.filter(n => n.type === 'objection') || [];

        console.log('\n📦 Contexto do Graph:');
        console.log(`   Produto: ${productNode?.data?.name} - ${productNode?.data?.mainBenefit}`);
        console.log(`   Metodologia: ${methodologyNode?.data?.framework}`);

        // 5. Buscar API Key
        const settingsService = new SettingsService(supabase);
        const apiKey = await settingsService.getProviderKey(campaign.user_id, 'gemini');

        if (!apiKey) {
            console.error('❌ API Key do Gemini não configurada em system_settings.');
            return;
        }
        console.log('✅ API Key encontrada');

        // 6. Montar config do agente da tabela agents
        const agentConfig = {
            name: agent.name,
            dna_config: {
                identity: { role: 'SDR', company: 'ProspectAI' }, // Name removed (use root)
                brand_voice: { tone: [agent.tone || 'profissional'], emojis_allowed: true },
                compliance: { legal_rules: ['Respeite LGPD'] }
            },
            tone_vector: { formality: 3, humor: 2, enthusiasm: 3 }
        };

        // 7. Simular histórico
        const chatHistory = [
            { role: 'assistant', content: 'Olá! Sou a Ana da ProspectAI. Vi que você trabalha com vendas e gostaria de mostrar como podemos triplicar suas conversões. Posso te contar mais?' },
            { role: 'user', content: 'Oi Ana! Interessante... mas quanto custa? Minha empresa é pequena.' }
        ];

        console.log('\n💬 Histórico:');
        chatHistory.forEach(m => console.log(`   [${m.role === 'assistant' ? '🤖' : '👤'}]: ${m.content}`));

        // 7.1 Obter Estado Emocional (PAD)
        const EmotionalStateService = require('../../src/core/services/ai/EmotionalStateService');
        const emotionalService = new EmotionalStateService(supabase);

        // Simular um estado anterior (ex: um pouco frustrado/ansioso) para ver o ajuste
        // Na prática viria do DB (getPadVector)
        const mockPad = { pleasure: 0.2, arousal: 0.8, dominance: 0.4 };
        console.log(`\n🎭 Estado Emocional Simulado (PAD): P=${mockPad.pleasure}, A=${mockPad.arousal}, D=${mockPad.dominance}`);

        const emotionalAdjustment = emotionalService.getEmotionalAdjustment(mockPad);
        console.log(`   Ajuste gerado: "${emotionalAdjustment.replace(/<[^>]*>/g, '').trim()}"`);

        // 8. Montar prompt
        const promptService = new PromptService();
        const promptData = {
            agent: agentConfig,
            campaign,
            lead: { ...lead, custom_fields: { company: 'TechStartup', role: 'Founder' } },
            product: productNode?.data || {},
            methodology: methodologyNode?.data || {},
            objectionPlaybook: objectionNodes.map(n => ({
                label: n.data?.label,
                objectionType: n.data?.objectionType,
                responses: n.data?.responses || []
            })),
            chatHistory,
            emotionalAdjustment, // <--- Injetando ajuste emocional
            nodeDirective: agent.personality || 'Continue a conversa.',
            scopePolicy: 'READ_ONLY'
        };

        console.log('\n📝 Montando Sandwich Prompt...');
        const systemInstruction = await promptService.buildStitchedPrompt(promptData);
        console.log(`   Total: ${systemInstruction.length} chars`);

        // VERIFICAÇÃO DE CONTROLE EMOCIONAL
        if (promptData.emotionalAdjustment) {
            console.log('\n🎭 Ajuste Emocional Gerado (PAD Logic):');
            console.log(promptData.emotionalAdjustment);
        } else {
            console.log('\n🎭 Nenhum ajuste emocional necessário (Estado Neutro/Inicial).');
        }

        // 9. CHAMAR GEMINI - MODELO DA TABELA AGENTS!
        console.log(`\n🧠 Chamando Gemini com modelo: ${agent.model} ← DA TABELA AGENTS`);

        const gemini = new GeminiClient(apiKey);

        const response = await gemini.generateSimple(
            agent.model, // ← MODELO DA TABELA AGENTS (SEM FALLBACK!)
            systemInstruction,
            'Gere a próxima resposta.'
        );

        const responseText = response.text();
        console.log('\n✅ Gemini respondeu!');

        console.log('\n' + '='.repeat(60));
        console.log('📨 RESPOSTA DA IA:');
        console.log('='.repeat(60));

        try {
            const parsed = JSON.parse(responseText);
            console.log(`\n💭 Pensamento: ${parsed.thought}`);
            console.log(`\n💬 Mensagem: ${parsed.messages?.[0] || parsed.response}`);
            console.log(`\n📊 Métricas:`);
            console.log(`   Sentiment: ${parsed.sentiment_score}`);
            console.log(`   Confidence: ${parsed.confidence_score}`);
        } catch (e) {
            console.log('\nRaw Response:');
            console.log(responseText);
        }

        console.log('\n🎉 Teste Completo!');

    } catch (err) {
        console.error('❌ Erro:', err.message);
        if (err.message.includes('Quota exceeded')) {
            console.error('\n⚠️  A quota gratuita do Gemini foi excedida.');
            console.error('   Aguarde ou configure uma API key com billing ativo.');
        }
    }
}

testRealAI();
