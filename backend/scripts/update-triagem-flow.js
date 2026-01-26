/**
 * Script to update Central de Triagem campaign with a proper flow template
 * Run with: node scripts/update-triagem-flow.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Valid Flow Template for Triagem Campaign
const TRIAGEM_FLOW_TEMPLATE = {
    nodes: [
        {
            id: "entry-1",
            type: "trigger",
            position: { x: 250, y: 50 },
            data: {
                label: "Entrada",
                isTriage: true,
                allowedSources: [] // Accept all sources
            }
        },
        {
            id: "agent-1",
            type: "agentic",
            position: { x: 250, y: 200 },
            data: {
                label: "Agente de Triagem",
                // agentId will be filled dynamically
            }
        },
        {
            id: "logic-1",
            type: "logic",
            position: { x: 250, y: 400 },
            data: {
                label: "Roteador de Intenção"
            }
        },
        {
            id: "closing-win",
            type: "closing",
            position: { x: 50, y: 600 },
            data: {
                label: "Lead Qualificado",
                finalStatus: "qualified"
            }
        },
        {
            id: "closing-lost",
            type: "closing",
            position: { x: 450, y: 600 },
            data: {
                label: "Não Interessado",
                finalStatus: "lost"
            }
        }
    ],
    edges: [
        {
            id: "e1",
            source: "entry-1",
            target: "agent-1",
            type: "animated"
        },
        {
            id: "e2",
            source: "agent-1",
            target: "logic-1",
            type: "animated"
        },
        {
            id: "e3",
            source: "logic-1",
            target: "closing-win",
            type: "animated",
            sourceHandle: "interested"
        },
        {
            id: "e4",
            source: "logic-1",
            target: "closing-lost",
            type: "animated",
            sourceHandle: "not_interested"
        }
    ],
    viewport: {
        x: 0,
        y: 0,
        zoom: 1
    }
};

async function main() {
    console.log('🔍 Finding "Central de Triagem" campaign...');

    // Find the campaign
    const { data: campaign, error: findError } = await supabase
        .from('campaigns')
        .select('id, name, agent_id')
        .ilike('name', '%Triagem%')
        .single();

    if (findError || !campaign) {
        console.error('❌ Campaign not found:', findError?.message);
        process.exit(1);
    }

    console.log(`✅ Found campaign: ${campaign.name} (ID: ${campaign.id})`);
    console.log(`   Agent ID: ${campaign.agent_id}`);

    // Update template with the actual agent_id
    const flowTemplate = { ...TRIAGEM_FLOW_TEMPLATE };
    flowTemplate.nodes[1].data.agentId = campaign.agent_id;

    // Update the campaign
    console.log('📝 Updating strategy_graph...');

    const { error: updateError } = await supabase
        .from('campaigns')
        .update({ strategy_graph: flowTemplate })
        .eq('id', campaign.id);

    if (updateError) {
        console.error('❌ Update failed:', updateError.message);
        process.exit(1);
    }

    console.log('✅ Flow template updated successfully!');
    console.log('\n📊 New Flow Structure:');
    console.log('   [Entrada] → [Agente Triagem] → [Roteador] → [Qualificado/Perdido]');
    console.log('\n🚀 The campaign is ready for testing!');
}

main().catch(console.error);
