
require('dotenv').config({ path: '../.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const TRIAGEM_ID = 'e2108dfc-ba62-4c52-946e-90f696e4094c';
const TECH_ID = 'b5dfdf4b-ff20-4f4e-bd84-6a4cecd0d381';
const SAUDE_ID = 'd6cfd6ed-314b-488b-8256-6a03df0fe4b9';

const graph = {
    nodes: [
        {
            id: '1',
            type: 'leadEntry',
            position: { x: 50, y: 300 },
            data: { label: 'Entrada de Lead' }
        },
        {
            id: '2',
            type: 'broadcast',
            position: { x: 300, y: 300 },
            data: {
                label: 'Msg Boas Vindas',
                messageTemplate: 'Olá {{name}}! Bem-vindo. Você busca soluções de Tecnologia ou Saúde?',
                spintaxEnabled: false
            }
        },
        {
            id: '3',
            type: 'agentic',
            position: { x: 550, y: 300 },
            data: {
                label: 'Classificar Interesse',
                model: 'gemini-3.0-flash-preview',
                systemPrompt: "Analise a resposta do usuário. Se ele mencionar 'tecnologia', 'tech', 'software', retorne APENAS a palavra 'TECH'. Se ele mencionar 'saúde', 'médico', 'hospital', retorne APENAS a palavra 'SAUDE'. Se não ficar claro, retorne 'UNKNOWN'.",
                variableName: 'intent' // Agent output variable
            }
        },
        {
            id: '4',
            type: 'logic',
            position: { x: 850, y: 150 },
            data: {
                label: 'É Tech?',
                condition: 'variable_matches',
                variable: 'intent',
                value: 'TECH'
            }
        },
        {
            id: '5',
            type: 'logic',
            position: { x: 850, y: 450 },
            data: {
                label: 'É Saúde?',
                condition: 'variable_matches',
                variable: 'intent',
                value: 'SAUDE'
            }
        },
        {
            id: '6',
            type: 'handoff',
            position: { x: 1100, y: 150 },
            data: {
                label: 'Ir p/ Campanha TECH',
                target: 'campaign',
                targetCampaignId: TECH_ID,
                reason: 'Interesse Tech'
            }
        },
        {
            id: '7',
            type: 'handoff',
            position: { x: 1100, y: 450 },
            data: {
                label: 'Ir p/ Campanha SAÚDE',
                target: 'campaign',
                targetCampaignId: SAUDE_ID,
                reason: 'Interesse Saúde'
            }
        }
    ],
    edges: [
        { id: 'e1-2', source: '1', target: '2', type: 'smoothstep', animated: true },
        { id: 'e2-3', source: '2', target: '3', type: 'smoothstep', animated: true },
        // Agent to Logic nodes
        { id: 'e3-4', source: '3', target: '4', type: 'smoothstep', label: 'Verificar Tech' },
        { id: 'e3-5', source: '3', target: '5', type: 'smoothstep', label: 'Verificar Saúde' },
        // Logic matches to Handoffs
        { id: 'e4-6', source: '4', sourceHandle: 'true', target: '6', type: 'smoothstep', animated: true, label: 'Sim' },
        { id: 'e5-7', source: '5', sourceHandle: 'true', target: '7', type: 'smoothstep', animated: true, label: 'Sim' }
    ]
};

async function run() {
    console.log('Updating Triagem Campaign Graph...');

    const { error } = await supabase
        .from('campaigns')
        .update({ strategy_graph: graph })
        .eq('id', TRIAGEM_ID);

    if (error) {
        console.error('Error updating campaign:', error);
    } else {
        console.log('Success! Graph updated for campaign:', TRIAGEM_ID);
    }
}

run();
