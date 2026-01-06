/**
 * DelayNode - Pauses execution for a specified duration.
 * Not active in unit tests/synchronous execution usually, but required for factory.
 */
const logger = require('../../../../shared/Logger').createModuleLogger('delay-node');

class DelayNode {
    async execute(lead, campaign, nodeConfig) {
        const { duration = "0", unit = "m" } = nodeConfig.data || {};
        const state = lead.node_state || {};

        // 1. Check for Interruptions (User Reply)
        // If last_message_at is newer than when we entered this delay node, 
        // it means the user responded during the wait.
        const enteredAt = new Date(state.entered_at || 0);
        const lastMessageAt = new Date(lead.last_message_at || 0);

        if (lastMessageAt > new Date(enteredAt.getTime() + 1000)) {
            logger.info({ leadId: lead.id, node: nodeConfig.id }, 'User replied during delay, interrupting wait.');
            return { status: 'success', markExecuted: true };
        }

        // 2. Check if we already have a scheduled time
        if (state.scheduled_at) {
            const scheduledAt = new Date(state.scheduled_at);
            const now = new Date();

            if (now >= scheduledAt) {
                logger.info({ leadId: lead.id, node: nodeConfig.id }, 'Delay expired, proceeding');
                return { status: 'success', markExecuted: true };
            }

            logger.debug({ leadId: lead.id, node: nodeConfig.id, remaining: (scheduledAt - now) / 1000 + 's' }, 'Still waiting');
            return { status: 'waiting' };
        }

        // 3. Parse duration and set scheduled_at
        // Support both "duration"/"unit" and "delayValue"/"delayUnit" (frontend format)
        let amount = parseInt(nodeConfig.data?.delayValue || nodeConfig.data?.duration || "0");
        let timeUnit = nodeConfig.data?.delayUnit || nodeConfig.data?.unit || "m";

        if (isNaN(amount)) amount = 0;

        const scheduledAt = new Date();
        const unitLower = timeUnit.toLowerCase();

        if (unitLower.startsWith('h')) {
            scheduledAt.setHours(scheduledAt.getHours() + amount);
        } else if (unitLower.startsWith('m')) {
            scheduledAt.setMinutes(scheduledAt.getMinutes() + amount);
        } else if (unitLower.startsWith('s')) {
            scheduledAt.setSeconds(scheduledAt.getSeconds() + amount);
        } else if (unitLower.startsWith('d')) {
            scheduledAt.setDate(scheduledAt.getDate() + amount);
        }

        logger.info({ leadId: lead.id, node: nodeConfig.id, amount, timeUnit, scheduledAt }, 'Scheduling delay');

        return {
            status: 'waiting',
            nodeState: { scheduled_at: scheduledAt.toISOString() }
        };
    }
}

module.exports = DelayNode;
