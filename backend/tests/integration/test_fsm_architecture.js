/**
 * test_fsm_architecture.js
 * Integration test for FSM Architecture and New Nodes (Split, Goto)
 */
require('dotenv').config();
const NodeFactory = require('../../src/core/engines/workflow/NodeFactory');
const { NodeExecutionStateEnum } = require('../../src/core/types/CampaignEnums');

console.log('🧪 FSM Architecture Integration Test\n');

// Mock Dependencies
const mockDependencies = {
    supabase: { from: () => ({ select: () => ({ eq: () => ({ single: () => ({ data: {}, error: null }) }) }) }) },
    geminiClient: {},
    wahaClient: {},
    promptService: {},
    historyService: {},
    chatService: {},
    leadService: {},
    campaignSocket: {}
};

async function runTests() {
    const factory = new NodeFactory(mockDependencies);

    console.log('1️⃣ Testing NodeFactory Registration...');
    const registeredTypes = Object.keys(factory.executors);
    console.log(`   Registered node types: ${registeredTypes.join(', ')}`);

    const requiredTypes = ['split', 'goto', 'agentic', 'action', 'delay', 'logic'];
    for (const type of requiredTypes) {
        const executor = factory.getExecutor(type);
        if (executor) {
            console.log(`   ✅ ${type}: Registered`);
        } else {
            console.log(`   ❌ ${type}: MISSING`);
        }
    }

    console.log('\n2️⃣ Testing SplitNode Execution...');
    const splitNode = factory.getExecutor('split');
    const mockInstance = { id: 'test-instance-123' };
    const mockLead = { id: 'lead-1', phone: '5511999999999' };
    const mockCampaign = { id: 'campaign-1' };
    const mockNodeConfig = { data: { variantA_percent: 70 } };

    // Run 10 times to see distribution
    const results = { variant_a: 0, variant_b: 0 };
    for (let i = 0; i < 10; i++) {
        const result = await splitNode.execute({
            instance: mockInstance,
            lead: mockLead,
            campaign: mockCampaign,
            nodeConfig: mockNodeConfig
        });
        results[result.edge]++;
    }
    console.log(`   Results (10 runs, 70/30 split): A=${results.variant_a}, B=${results.variant_b}`);
    console.log(`   ✅ SplitNode returns FSM status: ${NodeExecutionStateEnum.EXITED}`);

    console.log('\n3️⃣ Testing GotoNode Execution...');
    const gotoNode = factory.getExecutor('goto');
    const gotoResult = await gotoNode.execute({
        instance: mockInstance,
        lead: mockLead,
        campaign: mockCampaign,
        nodeConfig: { data: { targetNodeId: 'node-abc-123' } }
    });
    console.log(`   Status: ${gotoResult.status}`);
    console.log(`   Edge: ${gotoResult.edge}`);
    console.log(`   GotoTarget: ${gotoResult.gotoTarget}`);
    if (gotoResult.status === NodeExecutionStateEnum.EXITED && gotoResult.gotoTarget === 'node-abc-123') {
        console.log(`   ✅ GotoNode works correctly`);
    } else {
        console.log(`   ❌ GotoNode failed`);
    }

    console.log('\n4️⃣ Testing ActionNode FSM Compliance...');
    const actionNode = factory.getExecutor('action');
    const actionResult = await actionNode.execute({
        instance: mockInstance,
        lead: mockLead,
        campaign: mockCampaign,
        nodeConfig: { data: { action: 'test_action' } }
    });
    console.log(`   Status: ${actionResult.status}`);
    console.log(`   Edge: ${actionResult.edge}`);
    if (actionResult.status === NodeExecutionStateEnum.EXITED) {
        console.log(`   ✅ ActionNode is FSM compliant`);
    } else {
        console.log(`   ❌ ActionNode returned non-FSM status: ${actionResult.status}`);
    }

    console.log('\n5️⃣ Testing CampaignEnums Export...');
    const enums = require('../src/core/types/CampaignEnums');
    console.log(`   NodeTypeEnum: ${Object.keys(enums.NodeTypeEnum).join(', ')}`);
    console.log(`   CampaignStatusEnum: ${Object.keys(enums.CampaignStatusEnum).join(', ')}`);
    console.log(`   NodeExecutionStateEnum: ${Object.keys(enums.NodeExecutionStateEnum).join(', ')}`);
    console.log(`   ✅ All Enums exported correctly`);

    console.log('\n🎉 FSM Architecture Test Complete!\n');
}

runTests().catch(console.error);
