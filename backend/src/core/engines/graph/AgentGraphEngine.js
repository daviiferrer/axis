const { StateGraph, END, START } = require("@langchain/langgraph");

/**
 * AgentGraphEngine - LangGraph-based reasoning.
 */
class AgentGraphEngine {
    constructor(geminiClient, promptService) {
        this.geminiClient = geminiClient;
        this.promptService = promptService;
        this.stateDefinition = {
            messages: {
                value: (x, y) => x.concat(y),
                default: () => []
            },
            contextData: {
                value: (x, y) => ({ ...x, ...y }),
                default: () => ({})
            },
            sentiment: {
                value: (x, y) => y,
                default: () => 0.5
            },
            nextAction: {
                value: (x, y) => y,
                default: () => "agent"
            }
        };
    }

    async agentNode(state) {
        // Logic for agent node...
        // Uses geminiClient and promptService
        return { nextAction: "supervisor" };
    }

    async supervisorNode(state) {
        // Guardrail logic...
        return { nextAction: END };
    }

    createGraph() {
        const workflow = new StateGraph({ channels: this.stateDefinition });
        workflow.addNode("agent", (state) => this.agentNode(state));
        workflow.addNode("supervisor", (state) => this.supervisorNode(state));
        workflow.addEdge(START, "agent");
        workflow.addEdge("agent", "supervisor");
        return workflow.compile();
    }

    async run(messages, contextData, model) {
        const graph = this.createGraph();
        return await graph.invoke({
            messages,
            contextData,
            sentiment: 0.5,
            nextAction: "agent"
        });
    }
}

module.exports = AgentGraphEngine;
