const BroadcastNode = require('./nodes/BroadcastNode');
const LogicNode = require('./nodes/LogicNode');
const AgenticNode = require('./nodes/AgenticNode');
const HandoffNode = require('./nodes/HandoffNode');
const ClosingNode = require('./nodes/ClosingNode');
const DelayNode = require('./nodes/DelayNode');
const ActionNode = require('./nodes/ActionNode');
const QualificationNode = require('./nodes/sdr/QualificationNode');
const ObjectionNode = require('./nodes/sdr/ObjectionNode');
const SplitNode = require('./nodes/SplitNode');
const GotoNode = require('./nodes/GotoNode');
const StartNode = require('./nodes/StartNode');
const GotoCampaignNode = require('./nodes/GotoCampaignNode');
const FollowUpNode = require('./nodes/FollowUpNode');

/**
 * NodeFactory - Creates node executors based on type.
 * FSM Architecture: All nodes return NodeExecutionStateEnum
 */
class NodeFactory {
    constructor(dependencies) {
        this.dependencies = dependencies;
        const startExecutor = new StartNode(dependencies);

        this.executors = {
            'broadcast': new BroadcastNode(dependencies),
            'logic': new LogicNode(dependencies),
            'agentic': new AgenticNode(dependencies),
            'handoff': new HandoffNode(dependencies),
            'closing': new ClosingNode(dependencies),
            'delay': new DelayNode(),
            'action': new ActionNode(dependencies),
            'qualification': new QualificationNode(dependencies),
            'objection': new ObjectionNode(dependencies),
            'split': new SplitNode(dependencies),
            'goto': new GotoNode(dependencies),
            'goto_campaign': new GotoCampaignNode(dependencies),
            'followup': new FollowUpNode(dependencies),
            'agent': new AgenticNode(dependencies),
            'start': startExecutor,
            'trigger': startExecutor,
            'leadEntry': startExecutor
        };
    }

    getExecutor(type) {
        return this.executors[type] || null;
    }
}

module.exports = NodeFactory;
