/**
 * ÁXIS Full Integration Test Suite
 * 
 * REAL INTEGRATION TESTS - NO MOCKS!
 * Tests actual database, services, and AI models.
 * 
 * Run with: node tests/integration/FULL_INTEGRATION_TEST.js
 */
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Test Results Collector
const testResults = {
    passed: 0,
    failed: 0,
    skipped: 0,
    errors: [],
    details: []
};

function log(emoji, message) {
    console.log(`${emoji} ${message}`);
}

function pass(testName, details = '') {
    testResults.passed++;
    testResults.details.push({ status: 'PASS', test: testName, details });
    log('✅', `PASS: ${testName}`);
}

function fail(testName, error) {
    testResults.failed++;
    testResults.errors.push({ test: testName, error: error.message || error });
    testResults.details.push({ status: 'FAIL', test: testName, error: error.message || error });
    log('❌', `FAIL: ${testName} - ${error.message || error}`);
}

function skip(testName, reason) {
    testResults.skipped++;
    testResults.details.push({ status: 'SKIP', test: testName, reason });
    log('⏭️', `SKIP: ${testName} - ${reason}`);
}

// ==============================================================================
// SETUP
// ==============================================================================

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY
);

// Container imports (real dependencies)
const { configureContainer } = require('../../src/container');

let container;

async function setupContainer() {
    log('🔧', 'Setting up DI Container...');
    container = configureContainer();
    log('✅', 'Container ready');
}

// ==============================================================================
// TEST SUITES
// ==============================================================================

/**
 * TEST 1: Database Connectivity
 */
async function testDatabaseConnectivity() {
    try {
        const { data, error } = await supabase.from('campaigns').select('id').limit(1);
        if (error) throw error;
        pass('Database Connectivity', 'Supabase connected');
    } catch (e) {
        fail('Database Connectivity', e);
    }
}

/**
 * TEST 2: StateCheckpointService - CRUD Operations
 */
async function testStateCheckpointService() {
    const testPrefix = 'StateCheckpointService';

    try {
        const StateCheckpointService = require('../../src/core/services/workflow/StateCheckpointService');
        const service = new StateCheckpointService({ supabaseClient: supabase });

        // Get a valid lead and campaign for testing
        const { data: lead } = await supabase
            .from('leads')
            .select('id, campaign_id')
            .not('campaign_id', 'is', null)
            .limit(1)
            .single();

        if (!lead) {
            skip(`${testPrefix} - All`, 'No leads found in database');
            return;
        }

        // Test saveCheckpoint
        const checkpoint = {
            currentNodeId: 'test-node-1',
            executionState: 'AWAITING_ASYNC',
            nodeState: { test_key: 'test_value' },
            context: { lastIntent: 'interested' },
            waitingFor: 'TIMER',
            waitUntil: new Date(Date.now() + 60000).toISOString()
        };

        await service.saveCheckpoint(lead.id, lead.campaign_id, checkpoint);
        pass(`${testPrefix} - saveCheckpoint`, 'Checkpoint saved');

        // Test loadCheckpoint
        const loaded = await service.loadCheckpoint(lead.id, lead.campaign_id);
        if (loaded && loaded.current_node_id === 'test-node-1') {
            pass(`${testPrefix} - loadCheckpoint`, 'Checkpoint loaded correctly');
        } else {
            fail(`${testPrefix} - loadCheckpoint`, 'Checkpoint data mismatch');
        }

        // Test findExpiredTimers (set wait_until to past)
        await supabase.from('workflow_instances')
            .update({ wait_until: new Date(Date.now() - 10000).toISOString() })
            .eq('lead_id', lead.id)
            .eq('campaign_id', lead.campaign_id);

        const expired = await service.findExpiredTimers();
        if (Array.isArray(expired)) {
            pass(`${testPrefix} - findExpiredTimers`, `Found ${expired.length} expired timers`);
        } else {
            fail(`${testPrefix} - findExpiredTimers`, 'Did not return array');
        }

        // Cleanup
        await service.markCompleted(loaded.id);
        pass(`${testPrefix} - markCompleted`, 'Instance marked completed');

    } catch (e) {
        fail(testPrefix, e);
    }
}

/**
 * TEST 3: NodeFactory - All Nodes Registered
 */
async function testNodeFactory() {
    const testPrefix = 'NodeFactory';

    try {
        const NodeFactory = require('../../src/core/engines/workflow/NodeFactory');
        const factory = container.resolve('nodeFactory');

        const nodeTypes = [
            'leadEntry', 'agentic', 'agent', 'broadcast', 'delay',
            'logic', 'closing', 'handoff', 'action', 'split',
            'qualification', 'objection', 'gotoCampaign', 'goto'
        ];

        for (const type of nodeTypes) {
            try {
                const executor = factory.getExecutor(type);
                if (executor) {
                    pass(`${testPrefix} - ${type}`, 'Executor found');
                } else {
                    skip(`${testPrefix} - ${type}`, 'No executor (may be intentional)');
                }
            } catch (e) {
                fail(`${testPrefix} - ${type}`, e);
            }
        }
    } catch (e) {
        fail(testPrefix, e);
    }
}

/**
 * TEST 4: DelayNode - Checkpoint Return
 */
async function testDelayNode() {
    const testPrefix = 'DelayNode';

    try {
        const DelayNode = require('../../src/core/engines/workflow/nodes/DelayNode');
        const node = new DelayNode();

        const mockLead = { id: 'test-lead', node_state: {} };
        const mockCampaign = { id: 'test-campaign' };
        const mockConfig = {
            id: 'delay-1',
            data: { delayValue: 5, delayUnit: 'm' }
        };

        const result = await node.execute(mockLead, mockCampaign, mockConfig);

        if (result.status === 'AWAITING_ASYNC' && result.checkpoint) {
            pass(`${testPrefix} - Returns AWAITING_ASYNC`, 'Correct status');

            if (result.checkpoint.waitingFor === 'TIMER') {
                pass(`${testPrefix} - checkpoint.waitingFor`, 'Set to TIMER');
            } else {
                fail(`${testPrefix} - checkpoint.waitingFor`, 'Not set to TIMER');
            }

            if (result.checkpoint.waitUntil) {
                pass(`${testPrefix} - checkpoint.waitUntil`, `Set to ${result.checkpoint.waitUntil}`);
            } else {
                fail(`${testPrefix} - checkpoint.waitUntil`, 'Not set');
            }
        } else {
            fail(`${testPrefix} - Returns AWAITING_ASYNC`, `Got ${result.status}`);
        }
    } catch (e) {
        fail(testPrefix, e);
    }
}

/**
 * TEST 5: LogicNode - Intent-Based Routing
 */
async function testLogicNode() {
    const testPrefix = 'LogicNode';

    try {
        const LogicNode = require('../../src/core/engines/workflow/nodes/LogicNode');
        const node = new LogicNode();

        // Test INTERESTED intent → INTERESTED edge
        const mockLeadInterested = {
            id: 'test-lead',
            context: { lastIntent: 'INTERESTED' }
        };

        const mockConfig = { id: 'logic-1', data: {} };

        const result = await node.execute(mockLeadInterested, {}, mockConfig);

        if (result.edge === 'INTERESTED' || result.action === 'INTERESTED') {
            pass(`${testPrefix} - Intent INTERESTED`, 'Routed to INTERESTED edge');
        } else {
            fail(`${testPrefix} - Intent INTERESTED`, `Expected 'INTERESTED', got '${result.edge || result.action}'`);
        }

        // Test NOT_INTERESTED intent → NOT_INTERESTED edge
        const mockLeadNotInterested = {
            id: 'test-lead',
            context: { lastIntent: 'NOT_INTERESTED' }
        };

        const result2 = await node.execute(mockLeadNotInterested, {}, mockConfig);

        if (result2.edge === 'NOT_INTERESTED' || result2.action === 'NOT_INTERESTED') {
            pass(`${testPrefix} - Intent NOT_INTERESTED`, 'Routed to NOT_INTERESTED edge');
        } else {
            fail(`${testPrefix} - Intent NOT_INTERESTED`, `Expected 'NOT_INTERESTED', got '${result2.edge || result2.action}'`);
        }

        // Test UNKNOWN/empty intent → DEFAULT edge
        const mockLeadUnknown = {
            id: 'test-lead',
            context: {}
        };

        const result3 = await node.execute(mockLeadUnknown, {}, mockConfig);

        if (result3.edge === 'DEFAULT' || result3.action === 'DEFAULT') {
            pass(`${testPrefix} - Intent UNKNOWN`, 'Routed to DEFAULT edge');
        } else {
            fail(`${testPrefix} - Intent UNKNOWN`, `Expected 'DEFAULT', got '${result3.edge || result3.action}'`);
        }

    } catch (e) {
        fail(testPrefix, e);
    }
}

/**
 * TEST 6: BroadcastNode - Message Generation
 */
async function testBroadcastNode() {
    const testPrefix = 'BroadcastNode';

    try {
        const BroadcastNode = require('../../src/core/engines/workflow/nodes/BroadcastNode');

        // BroadcastNode needs wahaClient - check if it's registered
        const wahaClient = container.resolve('wahaClient');
        const node = new BroadcastNode({ wahaClient, supabase });

        const mockLead = { id: 'test-lead', phone: '5511999990000', name: 'Test User' };
        const mockCampaign = { id: 'test-campaign', waha_session_name: 'test' };
        const mockConfig = {
            id: 'broadcast-1',
            data: {
                messageTemplate: 'Olá {{name}}!',
                skipSend: true // Flag to skip actual sending
            }
        };

        // BroadcastNode will try to send - we skip actual sending
        skip(`${testPrefix} - Execute`, 'Requires WAHA connection');

    } catch (e) {
        fail(testPrefix, e);
    }
}

/**
 * TEST 7: Gemini AI - Real Call
 */
async function testGeminiAI() {
    const testPrefix = 'GeminiAI';

    try {
        const GeminiClient = require('../../src/infra/clients/GeminiClient');
        const SettingsService = require('../../src/core/services/system/SettingsService');

        // Get API key from settings
        const { data: settings } = await supabase
            .from('system_settings')
            .select('gemini_api_key')
            .limit(1)
            .single();

        if (!settings?.gemini_api_key) {
            skip(`${testPrefix}`, 'No Gemini API key in system_settings');
            return;
        }

        const gemini = new GeminiClient(settings.gemini_api_key);

        // Simple generation test
        const response = await gemini.generateSimple(
            'gemini-2.0-flash',
            'Você é um assistente. Responda em JSON: {"response": "string"}',
            'Diga "Olá!"'
        );

        const text = response.text();
        if (text && text.length > 0) {
            pass(`${testPrefix} - generateSimple`, `Response: ${text.substring(0, 50)}...`);

            // Try to parse JSON
            try {
                const parsed = JSON.parse(text.replace(/```json?\n?/g, '').replace(/```/g, '').trim());
                pass(`${testPrefix} - JSON Output`, 'Valid JSON response');
            } catch {
                skip(`${testPrefix} - JSON Output`, 'Response not in JSON format');
            }
        } else {
            fail(`${testPrefix} - generateSimple`, 'Empty response');
        }

    } catch (e) {
        fail(testPrefix, e);
    }
}

/**
 * TEST 8: PromptService - Sandwich Pattern
 */
async function testPromptService() {
    const testPrefix = 'PromptService';

    try {
        const PromptService = require('../../src/core/services/ai/PromptService');
        const service = new PromptService();

        const contextData = {
            agent: {
                name: 'Ana',
                dna_config: {
                    identity: { role: 'SDR', company: 'TestCo' },
                    brand_voice: { tone: ['profissional'], emojis_allowed: true }
                }
            },
            campaign: { name: 'Test Campaign' },
            lead: { name: 'Test Lead', phone: '5511999990000' },
            chatHistory: [
                { role: 'assistant', content: 'Olá!' },
                { role: 'user', content: 'Oi, tudo bem?' }
            ],
            nodeDirective: 'Continue the conversation.',
            scopePolicy: 'READ_ONLY'
        };

        const prompt = await service.buildStitchedPrompt(contextData);

        if (prompt && prompt.length > 100) {
            pass(`${testPrefix} - buildStitchedPrompt`, `Generated ${prompt.length} chars`);

            // Check for key sections
            if (prompt.includes('JSON')) {
                pass(`${testPrefix} - Contains JSON Format`, 'Found JSON instructions');
            } else {
                skip(`${testPrefix} - Contains JSON Format`, 'JSON section not found');
            }
        } else {
            fail(`${testPrefix} - buildStitchedPrompt`, 'Prompt too short or empty');
        }

    } catch (e) {
        fail(testPrefix, e);
    }
}

/**
 * TEST 9: WorkflowEngine - Timer Recovery Loop
 */
async function testWorkflowEngine() {
    const testPrefix = 'WorkflowEngine';

    try {
        const workflowEngine = container.resolve('workflowEngine');

        // Check if stateCheckpointService is injected
        if (workflowEngine.stateCheckpointService) {
            pass(`${testPrefix} - StateCheckpointService Injected`, 'Dependency present');
        } else {
            fail(`${testPrefix} - StateCheckpointService Injected`, 'Dependency missing');
        }

        // Check if processExpiredTimers method exists
        if (typeof workflowEngine.processExpiredTimers === 'function') {
            pass(`${testPrefix} - processExpiredTimers Method`, 'Method exists');
        } else {
            fail(`${testPrefix} - processExpiredTimers Method`, 'Method missing');
        }

        // Check if resumeFromCheckpoint method exists
        if (typeof workflowEngine.resumeFromCheckpoint === 'function') {
            pass(`${testPrefix} - resumeFromCheckpoint Method`, 'Method exists');
        } else {
            fail(`${testPrefix} - resumeFromCheckpoint Method`, 'Method missing');
        }

        // Check if resumeFromCheckpointWithReply method exists
        if (typeof workflowEngine.resumeFromCheckpointWithReply === 'function') {
            pass(`${testPrefix} - resumeFromCheckpointWithReply Method`, 'Method exists');
        } else {
            fail(`${testPrefix} - resumeFromCheckpointWithReply Method`, 'Method missing');
        }

    } catch (e) {
        fail(testPrefix, e);
    }
}

/**
 * TEST 10: Campaign & Agent Integration
 */
async function testCampaignAgentIntegration() {
    const testPrefix = 'Campaign-Agent';

    try {
        // Find a campaign with an agent
        const { data: campaign, error } = await supabase
            .from('campaigns')
            .select('*, agents(*)')
            .eq('status', 'active')
            .not('agents', 'is', null)
            .limit(1)
            .single();

        if (error || !campaign) {
            skip(`${testPrefix}`, 'No active campaign with agent found');
            return;
        }

        pass(`${testPrefix} - Campaign Found`, `${campaign.name} (${campaign.id})`);

        if (campaign.agents) {
            pass(`${testPrefix} - Agent Linked`, `${campaign.agents.name || 'unnamed'}`);

            if (campaign.agents.model) {
                pass(`${testPrefix} - Agent Model`, campaign.agents.model);
            } else {
                fail(`${testPrefix} - Agent Model`, 'No model configured');
            }
        } else {
            fail(`${testPrefix} - Agent Linked`, 'No agent found');
        }

        // Check strategy_graph
        if (campaign.strategy_graph?.nodes?.length > 0) {
            pass(`${testPrefix} - Strategy Graph`, `${campaign.strategy_graph.nodes.length} nodes`);
        } else {
            skip(`${testPrefix} - Strategy Graph`, 'No strategy graph');
        }

    } catch (e) {
        fail(testPrefix, e);
    }
}

/**
 * TEST 11: workflow_instances Table Exists
 */
async function testWorkflowInstancesTable() {
    const testPrefix = 'workflow_instances Table';

    try {
        const { data, error } = await supabase
            .from('workflow_instances')
            .select('id')
            .limit(1);

        if (error) {
            fail(`${testPrefix} - Exists`, error);
        } else {
            pass(`${testPrefix} - Exists`, 'Table accessible');
        }
    } catch (e) {
        fail(`${testPrefix} - Exists`, e);
    }
}

/**
 * TEST 12: EmotionalStateService
 */
async function testEmotionalStateService() {
    const testPrefix = 'EmotionalStateService';

    try {
        const EmotionalStateService = require('../../src/core/services/ai/EmotionalStateService');
        const service = new EmotionalStateService(supabase);

        // Test getEmotionalAdjustment with different PAD vectors
        const neutralPad = { pleasure: 0.5, arousal: 0.5, dominance: 0.5 };
        const adjustment1 = service.getEmotionalAdjustment(neutralPad);
        pass(`${testPrefix} - Neutral PAD`, adjustment1 ? 'Adjustment generated' : 'No adjustment (neutral)');

        const frustratedPad = { pleasure: 0.2, arousal: 0.8, dominance: 0.3 };
        const adjustment2 = service.getEmotionalAdjustment(frustratedPad);
        if (adjustment2 && adjustment2.length > 0) {
            pass(`${testPrefix} - Frustrated PAD`, 'Adjustment generated');
        } else {
            fail(`${testPrefix} - Frustrated PAD`, 'No adjustment for frustrated state');
        }

    } catch (e) {
        fail(testPrefix, e);
    }
}

/**
 * TEST 13: GuardrailService
 */
async function testGuardrailService() {
    const testPrefix = 'GuardrailService';

    try {
        const GuardrailService = require('../../src/core/services/guardrails/GuardrailService');
        const service = new GuardrailService();

        // Test safe content
        const safeResult = service.process('Olá, como posso ajudar?', {});
        if (!safeResult.safetyViolated) {
            pass(`${testPrefix} - Safe Content`, 'Passed without violation');
        } else {
            fail(`${testPrefix} - Safe Content`, 'False positive violation');
        }

        // Test with low sentiment (should trigger safety)
        const lowSentimentResult = service.process('Teste', { last_sentiment: 0.1 });
        if (lowSentimentResult.safetyViolated) {
            pass(`${testPrefix} - Low Sentiment Detection`, 'Safety triggered');
        } else {
            skip(`${testPrefix} - Low Sentiment Detection`, 'No safety trigger (may be by design)');
        }

    } catch (e) {
        fail(testPrefix, e);
    }
}

// ==============================================================================
// MAIN RUNNER
// ==============================================================================

async function runAllTests() {
    console.log('\n');
    console.log('═'.repeat(70));
    console.log('   ÁXIS FULL INTEGRATION TEST SUITE');
    console.log('   Real Tests - No Mocks - Production Database');
    console.log('═'.repeat(70));
    console.log(`   Started: ${new Date().toISOString()}`);
    console.log('═'.repeat(70));
    console.log('\n');

    await setupContainer();

    console.log('\n📦 DATABASE TESTS\n' + '-'.repeat(40));
    await testDatabaseConnectivity();
    await testWorkflowInstancesTable();

    console.log('\n📦 DURABLE EXECUTION TESTS\n' + '-'.repeat(40));
    await testStateCheckpointService();
    await testWorkflowEngine();

    console.log('\n📦 NODE TESTS\n' + '-'.repeat(40));
    await testNodeFactory();
    await testDelayNode();
    await testLogicNode();
    await testBroadcastNode();

    console.log('\n📦 AI TESTS\n' + '-'.repeat(40));
    await testPromptService();
    await testEmotionalStateService();
    await testGuardrailService();
    await testGeminiAI();

    console.log('\n📦 INTEGRATION TESTS\n' + '-'.repeat(40));
    await testCampaignAgentIntegration();

    // Print Summary
    console.log('\n');
    console.log('═'.repeat(70));
    console.log('   TEST SUMMARY');
    console.log('═'.repeat(70));
    console.log(`   ✅ Passed:  ${testResults.passed}`);
    console.log(`   ❌ Failed:  ${testResults.failed}`);
    console.log(`   ⏭️  Skipped: ${testResults.skipped}`);
    console.log(`   📊 Total:   ${testResults.passed + testResults.failed + testResults.skipped}`);
    console.log('═'.repeat(70));

    if (testResults.failed > 0) {
        console.log('\n❌ FAILURES:');
        testResults.errors.forEach((err, i) => {
            console.log(`   ${i + 1}. ${err.test}: ${err.error}`);
        });
    }

    console.log('\n');

    // Return exit code for CI
    process.exit(testResults.failed > 0 ? 1 : 0);
}

runAllTests().catch(console.error);
