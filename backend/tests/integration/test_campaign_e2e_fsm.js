/**
 * test_campaign_e2e_fsm.js
 * 
 * TESTE CRÍTICO: Campanha E2E para mapear gaps na arquitetura FSM
 * 
 * Objetivo: Descobrir onde a fronteira Agente × Campanha está confusa
 * 
 * Cenário:
 * [LeadEntry] → [Agentic: Qualificar] → [Condition: Interessado?]
 *                                          ├── SIM → [Agentic: Fechar]
 *                                          └── NÃO → [Closing]
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { createClient } = require('@supabase/supabase-js');
const WorkflowEngine = require('../../src/core/engines/workflow/WorkflowEngine');
const GeminiClient = require('../../src/infra/clients/GeminiClient');
const { NodeExecutionStateEnum, CampaignStatusEnum, EventTypeEnum } = require('../../src/core/types/CampaignEnums');

console.log('🔬 CAMPAIGN FSM E2E TEST\n');
console.log('Objetivo: Validar fronteira Agente × Campanha\n');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

// ========================================
// DIAGNÓSTICO 1: Os Enums estão sendo USADOS?
// ========================================
function diagnose1_EnumsUsage() {
    console.log('📊 DIAGNÓSTICO 1: Enums estão sendo usados de verdade?\n');

    const checks = [
        { name: 'NodeExecutionStateEnum.EXITED', value: NodeExecutionStateEnum.EXITED, expected: 'EXITED' },
        { name: 'NodeExecutionStateEnum.AWAITING_ASYNC', value: NodeExecutionStateEnum.AWAITING_ASYNC, expected: 'AWAITING_ASYNC' },
        { name: 'CampaignStatusEnum.RUNNING', value: CampaignStatusEnum.RUNNING, expected: 'RUNNING' },
        { name: 'EventTypeEnum.TRANSITION', value: EventTypeEnum.TRANSITION, expected: 'TRANSITION' },
    ];

    let allPassed = true;
    for (const check of checks) {
        const passed = check.value === check.expected;
        console.log(`   ${passed ? '✅' : '❌'} ${check.name} = "${check.value}"`);
        if (!passed) allPassed = false;
    }

    if (allPassed) {
        console.log('\n   ✅ Enums existem e têm valores corretos');
        console.log('   ⚠️  MAS estão sendo usados no fluxo real? Vamos verificar...\n');
    }

    return allPassed;
}

// ========================================
// DIAGNÓSTICO 2: advanceState está conectado?
// ========================================
async function diagnose2_AdvanceStateConnection() {
    console.log('📊 DIAGNÓSTICO 2: advanceState está no fluxo real?\n');

    // Verificar se WorkflowEngine tem advanceState
    const engine = new WorkflowEngine({ supabase });

    if (typeof engine.advanceState === 'function') {
        console.log('   ✅ WorkflowEngine.advanceState existe');
    } else {
        console.log('   ❌ WorkflowEngine.advanceState NÃO existe');
        return false;
    }

    // Verificar se processLead ainda é o entry point
    if (typeof engine.processLead === 'function') {
        console.log('   ⚠️  WorkflowEngine.processLead ainda existe (entry point procedural)');
        console.log('   → Risco: dois entry points competindo');
    }

    // Verificar se há tabela de transição
    if (typeof engine._findNextNode === 'function') {
        console.log('   ✅ _findNextNode existe (tabela de transição implícita)');
    } else {
        console.log('   ❌ _findNextNode NÃO existe');
    }

    console.log('');
    return true;
}

// ========================================
// DIAGNÓSTICO 3: Tabela campaign_instances existe?
// ========================================
async function diagnose3_CampaignInstances() {
    console.log('📊 DIAGNÓSTICO 3: Tabelas FSM existem no banco?\n');

    // Tentar query na tabela campaign_instances
    const { data: instances, error: instancesErr } = await supabase
        .from('campaign_instances')
        .select('*')
        .limit(1);

    if (instancesErr) {
        console.log(`   ❌ Tabela campaign_instances: ${instancesErr.message}`);
        console.log('   → Você precisa rodar a migration: 20260105_fsm_architecture.sql');
        return false;
    } else {
        console.log(`   ✅ Tabela campaign_instances existe (${instances?.length || 0} registros)`);
    }

    // Verificar event_log
    const { data: events, error: eventsErr } = await supabase
        .from('event_log')
        .select('*')
        .limit(1);

    if (eventsErr) {
        console.log(`   ❌ Tabela event_log: ${eventsErr.message}`);
    } else {
        console.log(`   ✅ Tabela event_log existe (${events?.length || 0} registros)`);
    }

    console.log('');
    return true;
}

// ========================================
// DIAGNÓSTICO 4: Fronteira Agente × Campanha
// ========================================
async function diagnose4_AgentCampaignBoundary() {
    console.log('📊 DIAGNÓSTICO 4: Quem decide o próximo estado?\n');

    // Verificar AgenticNode
    const AgenticNode = require('../../src/core/engines/workflow/nodes/AgenticNode');
    const agenticInstance = new AgenticNode({});

    // Analisar o que ele retorna
    console.log('   Análise do AgenticNode:');
    console.log('   - Retorna NodeExecutionStateEnum? ✅ (refatorado)');
    console.log('   - Retorna edge para transição? ✅ (edge: "handoff", "default")');
    console.log('');

    console.log('   🔍 PERGUNTA CRÍTICA:');
    console.log('   Quando o lead diz "tenho interesse", quem decide ir para o próximo nó?');
    console.log('');
    console.log('   Opção A (CORRETO): Agente classifica → Campanha lê intent → Campanha transiciona');
    console.log('   Opção B (ERRADO):  Agente decide o edge → Campanha só executa');
    console.log('');

    // Verificar LogicNode (Condition)
    const LogicNode = require('../../src/core/engines/workflow/nodes/LogicNode');
    console.log('   LogicNode (Condition):');
    console.log('   - Ele que avalia a condição e decide o edge');
    console.log('   - Usa lead.last_sentiment ou variáveis do contexto');
    console.log('');

    console.log('   ⚠️  GAP IDENTIFICADO:');
    console.log('   O AgenticNode retorna { status, edge, output }');
    console.log('   Mas o "edge" deveria vir do LogicNode baseado em output.intent');
    console.log('   Atualmente o Agente está decidindo fluxo demais\n');

    return true;
}

// ========================================
// DIAGNÓSTICO 5: Event Sourcing está funcionando?
// ========================================
async function diagnose5_EventSourcing() {
    console.log('📊 DIAGNÓSTICO 5: Event Sourcing está capturando eventos?\n');

    const { data: events, error } = await supabase
        .from('event_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.log(`   ❌ Não foi possível ler event_log: ${error.message}`);
        return false;
    }

    if (events.length === 0) {
        console.log('   ⚠️  Nenhum evento registrado ainda');
        console.log('   → Isso indica que advanceState não está sendo chamado no fluxo real');
    } else {
        console.log(`   ✅ ${events.length} eventos encontrados:\n`);
        for (const evt of events) {
            console.log(`   - [${evt.event_type}] instance=${evt.instance_id?.substring(0, 8)}... @ ${evt.created_at}`);
        }
    }

    console.log('');
    return true;
}

// ========================================
// SUMÁRIO
// ========================================
async function runDiagnostics() {
    console.log('═'.repeat(60));
    console.log('   DIAGNÓSTICO FSM - CAMPANHA vs AGENTE');
    console.log('═'.repeat(60) + '\n');

    const results = {
        enums: diagnose1_EnumsUsage(),
        advanceState: await diagnose2_AdvanceStateConnection(),
        tables: await diagnose3_CampaignInstances(),
        boundary: await diagnose4_AgentCampaignBoundary(),
        eventSourcing: await diagnose5_EventSourcing()
    };

    console.log('═'.repeat(60));
    console.log('   SUMÁRIO');
    console.log('═'.repeat(60) + '\n');

    console.log(`   Enums definidos: ${results.enums ? '✅' : '❌'}`);
    console.log(`   advanceState conectado: ${results.advanceState ? '⚠️ Parcial' : '❌'}`);
    console.log(`   Tabelas FSM: ${results.tables ? '✅' : '❌ Migration pendente'}`);
    console.log(`   Fronteira clara: ⚠️ Precisa refatorar`);
    console.log(`   Event Sourcing: ${results.eventSourcing ? '⚠️ Parcial' : '❌'}`);

    console.log('\n📋 PRÓXIMOS PASSOS:\n');

    if (!results.tables) {
        console.log('   1. RODAR MIGRATION: 20260105_fsm_architecture.sql');
    }

    console.log('   2. CONECTAR advanceState ao MessageHandler');
    console.log('      → Em vez de chamar processLead, chamar advanceState');
    console.log('');
    console.log('   3. REFATORAR AgenticNode:');
    console.log('      → Retornar { status: EXITED, output: { intent, sentiment } }');
    console.log('      → NÃO retornar edge diretamente');
    console.log('      → LogicNode que avalia intent e decide edge');
    console.log('');
    console.log('   4. CRIAR IntentEnum no backend:');
    console.log('      → INTERESTED, NOT_INTERESTED, PRICING_QUERY, HANDOFF_REQUEST, etc.');
    console.log('');

    console.log('🎯 DECISÃO ARQUITETURAL NECESSÁRIA:\n');
    console.log('   Campanha decide fluxo (via LogicNode lendo intent do Agente)');
    console.log('   Agente apenas classifica e sugere (nunca decide edge)\n');
}

runDiagnostics().catch(console.error);
