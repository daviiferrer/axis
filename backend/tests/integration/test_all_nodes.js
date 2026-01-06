/**
 * Test Script: Validate All Workflow Nodes
 * MODELO VEM DA TABELA AGENTS - não hardcoded!
 */
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

// Workflow com TODOS os nodes - sem modelo hardcoded no agentic (vem da tabela agents)
const testStrategyGraph = {
    nodes: [
        { id: 'n1', type: 'leadEntry', position: { x: 50, y: 200 }, data: { label: 'Entrada de Lead' } },
        {
            id: 'n2', type: 'product', position: { x: 50, y: 50 },
            data: {
                label: 'ÁXIS', name: 'ÁXIS',
                mainBenefit: 'Automatize sua prospecção com IA e aumente conversões em 3x',
                price: 'R$ 297/mês',
                differentials: ['Suporte 24/7', 'Setup em 5 minutos', 'ROI em 7 dias'],
                allow_discounts: false
            }
        },
        {
            id: 'n3', type: 'methodology', position: { x: 200, y: 50 },
            data: { label: 'SPIN Selling', framework: 'SPIN', steps: [{ name: 'Situação' }, { name: 'Problema' }, { name: 'Implicação' }, { name: 'Necessidade' }] }
        },
        { id: 'n4', type: 'broadcast', position: { x: 300, y: 200 }, data: { label: 'Outreach Inicial', messageTemplate: 'Olá {{name}}, tudo bem?', spintaxEnabled: true } },
        { id: 'n5', type: 'delay', position: { x: 550, y: 200 }, data: { label: 'Aguardar 24h', delayValue: 24, delayUnit: 'hours' } },
        { id: 'n6', type: 'logic', position: { x: 800, y: 200 }, data: { label: 'Respondeu?', condition: 'has_replied' } },
        // AGENTIC - SEM MODELO HARDCODED! O modelo vem da tabela agents
        {
            id: 'n7', type: 'agentic', position: { x: 1100, y: 100 },
            data: {
                label: 'Ana SDR',
                agentName: 'Ana',
                // NÃO TEM model AQUI - VEM DA TABELA AGENTS
                scope_policy: 'READ_ONLY',
                instruction_override: 'Você é Ana, SDR consultiva. Use SPIN Selling.',
                dna_config: {
                    identity: { name: 'Ana', role: 'SDR', company: 'ÁXIS' },
                    brand_voice: { tone: ['profissional', 'consultivo'], emojis_allowed: true },
                    compliance: { legal_rules: ['Respeite LGPD'] }
                }
            }
        },
        { id: 'n8', type: 'qualification', position: { x: 1400, y: 100 }, data: { label: 'Qualificação BANT', criticalSlots: ['need', 'authority'] } },
        { id: 'n9', type: 'objection', position: { x: 1400, y: 250 }, data: { label: 'Objeções', objectionType: 'price', responses: [{ trigger: 'caro', response: 'Entendo...' }] } },
        { id: 'n10', type: 'broadcast', position: { x: 1100, y: 350 }, data: { label: 'Follow-up', messageTemplate: 'Oi {{name}}, conseguiu ver?' } },
        { id: 'n11', type: 'action', position: { x: 1700, y: 100 }, data: { label: 'Webhook CRM', action: 'webhook', webhookUrl: 'https://hooks.example.com/lead' } },
        { id: 'n12', type: 'handoff', position: { x: 1950, y: 100 }, data: { label: 'Transferir Closer', target: 'human', reason: 'Lead qualificado' } },
        { id: 'n13', type: 'closing', position: { x: 1950, y: 250 }, data: { label: 'Encerrar', finalStatus: 'lost', clearVariables: true } }
    ],
    edges: [
        { id: 'e1-4', source: 'n1', target: 'n4' },
        { id: 'e2-7', source: 'n2', target: 'n7', label: 'product' },
        { id: 'e3-7', source: 'n3', target: 'n7', label: 'methodology' },
        { id: 'e4-5', source: 'n4', target: 'n5' },
        { id: 'e5-6', source: 'n5', target: 'n6' },
        { id: 'e6-7', source: 'n6', sourceHandle: 'true', target: 'n7', label: 'true' },
        { id: 'e6-10', source: 'n6', sourceHandle: 'false', target: 'n10', label: 'false' },
        { id: 'e7-8', source: 'n7', target: 'n8' },
        { id: 'e7-9', source: 'n7', target: 'n9', label: 'objection' },
        { id: 'e9-7', source: 'n9', target: 'n7' },
        { id: 'e8-11', source: 'n8', target: 'n11' },
        { id: 'e11-12', source: 'n11', target: 'n12' },
        { id: 'e10-13', source: 'n10', target: 'n13' }
    ]
};

async function runTest() {
    console.log('🧪 Workflow Nodes Integration Test\n');
    console.log('='.repeat(50));

    try {
        // Cleanup existing
        const { data: existing } = await supabase.from('campaigns').select('id').eq('name', 'TEST_ALL_NODES').maybeSingle();
        if (existing) {
            console.log('🗑️  Limpando teste anterior...');
            await supabase.from('agents').delete().eq('campaign_id', existing.id);
            await supabase.from('campaign_leads').delete().eq('campaign_id', existing.id);
            await supabase.from('campaigns').delete().eq('id', existing.id);
        }

        // Get user_id
        const { data: existingCampaigns } = await supabase.from('campaigns').select('user_id').not('user_id', 'is', null).limit(1);
        const userId = existingCampaigns?.[0]?.user_id || null;
        console.log(`User ID: ${userId || 'null'}`);

        // BUSCAR MODELO DO SYSTEM_SETTINGS
        const { data: settings } = await supabase.from('system_settings').select('default_gemini_model').eq('user_id', userId).maybeSingle();
        const modelFromSettings = settings?.default_gemini_model || 'gemini-2.0-flash';
        console.log(`Modelo do system_settings: ${modelFromSettings}`);

        // Create campaign
        console.log('\n📊 Criando campanha...');
        const { data: campaign, error } = await supabase
            .from('campaigns')
            .insert({ name: 'TEST_ALL_NODES', status: 'active', user_id: userId, session_name: 'test_session', type: 'outreach', strategy_graph: testStrategyGraph })
            .select().single();

        if (error) { console.error('❌ Erro:', error.message); return; }
        console.log(`✅ Campanha: ${campaign.id}`);

        // CRIAR AGENTE NA TABELA AGENTS - MODELO VEM DAQUI!
        console.log('\n🤖 Criando agente na tabela agents (modelo aqui!)...');
        const { data: agent, error: agentError } = await supabase
            .from('agents')
            .insert({
                campaign_id: campaign.id,
                name: 'Ana SDR',
                model: modelFromSettings, // ← MODELO VEM DO SYSTEM_SETTINGS
                tone: 'profissional e consultivo',
                personality: 'Você é uma SDR experiente que usa SPIN Selling.',
                product_context: 'ÁXIS - Plataforma de automação de prospecção com IA',
                goals: 'Qualificar leads e agendar reuniões',
                language: 'pt-BR'
            })
            .select().single();

        if (agentError) { console.error('❌ Erro ao criar agente:', agentError.message); return; }
        console.log(`✅ Agente: ${agent.name} | Modelo: ${agent.model} ← DA TABELA AGENTS`);

        // Validate graph
        const { data: stored } = await supabase.from('campaigns').select('strategy_graph').eq('id', campaign.id).single();
        const graph = stored?.strategy_graph;

        console.log('\n📦 Nodes salvos:');
        const expectedTypes = ['leadEntry', 'product', 'methodology', 'broadcast', 'delay', 'logic', 'agentic', 'qualification', 'objection', 'action', 'handoff', 'closing'];
        const foundTypes = new Set(graph?.nodes?.map(n => n.type) || []);
        for (const type of expectedTypes) {
            const found = foundTypes.has(type);
            const node = graph?.nodes?.find(n => n.type === type);
            console.log(`   ${found ? '✅' : '❌'} ${type.padEnd(15)} ${node?.data?.label || ''}`);
        }

        // Create lead
        const { data: lead } = await supabase.from('campaign_leads').insert({
            name: 'Lead Teste', phone: '5511999990001', status: 'new',
            campaign_id: campaign.id, current_node_id: 'n1'
        }).select().single();

        console.log(`\n👤 Lead: ${lead?.id}`);

        // Summary
        console.log('\n' + '='.repeat(50));
        console.log('✅ TESTE COMPLETO');
        console.log('='.repeat(50));
        console.log(`Campanha: ${campaign.id}`);
        console.log(`Agente: ${agent.id} | Modelo: ${agent.model}`);
        console.log(`Nodes: ${graph?.nodes?.length} | Edges: ${graph?.edges?.length}`);

    } catch (err) {
        console.error('❌ Erro:', err.message);
    }
}

runTest();
