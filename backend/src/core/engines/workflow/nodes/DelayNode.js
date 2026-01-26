/**
 * DelayNode - Pauses execution for a specified duration.
 * 
 * DURABLE EXECUTION: Returns checkpoint data for persistence.
 * The timer recovery loop will resume execution when wait_until expires.
 */
const logger = require('../../../../shared/Logger').createModuleLogger('delay-node');
const { NodeExecutionStateEnum } = require('../../../types/CampaignEnums');

class DelayNode {
    async execute(lead, campaign, nodeConfig, graph) {
        const state = lead.node_state || {};

        // 1. Check for Interruptions (User Reply during wait)
        // If last_message_at is newer than when we entered this delay node, 
        // it means the user responded during the wait.
        const enteredAt = new Date(state.entered_at || 0);
        const lastMessageAt = new Date(lead.last_message_at || 0);

        if (lastMessageAt > new Date(enteredAt.getTime() + 1000)) {
            logger.info({ leadId: lead.id, node: nodeConfig.id }, '💬 User replied during delay, interrupting wait → proceeding');
            return {
                status: NodeExecutionStateEnum.EXITED,
                edge: 'default',
                markExecuted: true
            };
        }

        // 2. Check if already scheduled (resuming from checkpoint)
        if (state.scheduled_at) {
            const scheduledAt = new Date(state.scheduled_at);
            const now = new Date();

            if (now >= scheduledAt) {
                logger.info({ leadId: lead.id, node: nodeConfig.id }, '⏰ Delay expired → proceeding');
                return {
                    status: NodeExecutionStateEnum.EXITED,
                    edge: 'default',
                    markExecuted: true
                };
            }

            // Still waiting - return same checkpoint
            logger.debug({
                leadId: lead.id,
                remaining: Math.round((scheduledAt - now) / 1000) + 's'
            }, '⏳ Still waiting');

            return {
                status: NodeExecutionStateEnum.AWAITING_ASYNC,
                checkpoint: {
                    waitingFor: 'TIMER',
                    waitUntil: scheduledAt.toISOString()
                },
                nodeState: {
                    scheduled_at: scheduledAt.toISOString(),
                    entered_at: state.entered_at || new Date().toISOString()
                }
            };
        }

        // 3. Parse duration and schedule wait_until
        // Support both "duration"/"unit" and "delayValue"/"delayUnit" (frontend format)
        let amount = parseInt(nodeConfig.data?.delayValue || nodeConfig.data?.duration || "0");
        let timeUnit = nodeConfig.data?.delayUnit || nodeConfig.data?.unit || "m";

        if (isNaN(amount)) amount = 0;

        const waitUntil = new Date();
        const unitLower = timeUnit.toLowerCase();

        if (unitLower.startsWith('h')) {
            waitUntil.setHours(waitUntil.getHours() + amount);
        } else if (unitLower.startsWith('m')) {
            waitUntil.setMinutes(waitUntil.getMinutes() + amount);
        } else if (unitLower.startsWith('s')) {
            waitUntil.setSeconds(waitUntil.getSeconds() + amount);
        } else if (unitLower.startsWith('d')) {
            waitUntil.setDate(waitUntil.getDate() + amount);
        }

        logger.info({
            leadId: lead.id,
            node: nodeConfig.id,
            amount,
            timeUnit,
            waitUntil: waitUntil.toISOString()
        }, '⏱️ Scheduling delay (checkpoint-based)');

        return {
            status: NodeExecutionStateEnum.AWAITING_ASYNC,

            // Checkpoint data for StateCheckpointService
            checkpoint: {
                waitingFor: 'TIMER',
                waitUntil: waitUntil.toISOString()
            },

            // Node state for lead.node_state (backward compat)
            nodeState: {
                scheduled_at: waitUntil.toISOString(),
                entered_at: new Date().toISOString()
            }
        };
    }
}

module.exports = DelayNode;

