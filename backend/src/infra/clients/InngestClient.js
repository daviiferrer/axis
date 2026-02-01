/**
 * InngestClient - Durable Execution & Event-Driven Workflows
 * 
 * Implements:
 * - Event-driven workflow execution (replaces polling)
 * - waitForEvent pattern for human-in-the-loop
 * - "Lost Customer" pattern for abandoned leads
 * - Automatic retry with exponential backoff
 * 
 * @see https://www.inngest.com/docs
 */
const { Inngest } = require('inngest');
const logger = require('../../shared/Logger').createModuleLogger('inngest');

// Initialize Inngest client
const inngest = new Inngest({
    id: 'axis-workflow',
    eventKey: process.env.INNGEST_EVENT_KEY || 'axis-dev-key'
});

/**
 * Lead Message Received - Main workflow handler.
 * Replaces the polling-based WorkflowEngine for new messages.
 */
const handleLeadMessage = inngest.createFunction(
    {
        id: 'lead-message-handler',
        name: 'Handle Lead Message',
        retries: 3,
        concurrency: {
            limit: 10, // Max concurrent executions per lead
            key: 'event.data.leadId'
        }
    },
    { event: 'axis/lead.message.received' },
    async ({ event, step }) => {
        const { leadId, campaignId, chatId, messageId, content } = event.data;

        logger.info({ leadId, campaignId, messageId }, '📨 Processing lead message via Inngest');

        // Step 1: Process the message through workflow engine
        const result = await step.run('process-message', async () => {
            // This will be injected via dependency injection
            // For now, we return the event data for the WorkflowEngine to pick up
            return {
                leadId,
                campaignId,
                chatId,
                messageId,
                content,
                processedAt: new Date().toISOString()
            };
        });

        // Step 2: Wait for next message OR timeout (Lost Customer Pattern)
        const nextMessage = await step.waitForEvent('wait-for-reply', {
            event: 'axis/lead.message.received',
            timeout: '24h',
            match: 'data.chatId'
        });

        if (!nextMessage) {
            // Timeout - trigger follow-up workflow
            logger.info({ leadId, chatId }, '⏰ Lead went cold - triggering follow-up');

            await step.run('trigger-followup', async () => {
                return {
                    action: 'send_followup',
                    leadId,
                    campaignId,
                    reason: 'no_response_24h',
                    triggeredAt: new Date().toISOString()
                };
            });
        }

        return { status: 'completed', leadId, nextMessage: !!nextMessage };
    }
);

/**
 * Delayed Action Handler - Replaces setTimeout/setInterval.
 * Guaranteed to execute even if server restarts.
 */
const handleDelayedAction = inngest.createFunction(
    {
        id: 'delayed-action-handler',
        name: 'Handle Delayed Action',
        retries: 2
    },
    { event: 'axis/delayed.action.scheduled' },
    async ({ event, step }) => {
        const { actionType, leadId, campaignId, delayMs, payload } = event.data;

        // Sleep for the specified duration
        await step.sleep('wait-delay', delayMs);

        logger.info({ actionType, leadId, delayMs }, '⏰ Delayed action executing');

        // Execute the delayed action
        const result = await step.run('execute-action', async () => {
            return {
                actionType,
                leadId,
                campaignId,
                payload,
                executedAt: new Date().toISOString()
            };
        });

        return result;
    }
);

/**
 * Campaign Batch Processor - For bulk lead processing.
 */
const processCampaignBatch = inngest.createFunction(
    {
        id: 'campaign-batch-processor',
        name: 'Process Campaign Batch',
        retries: 1,
        batchEvents: {
            maxSize: 100,
            timeout: '5s'
        }
    },
    { event: 'axis/campaign.lead.batch' },
    async ({ events, step }) => {
        const leads = events.map(e => e.data);

        logger.info({ count: leads.length }, '📦 Processing batch of leads');

        // Process each lead with fan-out
        const results = await step.run('process-batch', async () => {
            // This would trigger individual lead processing
            return leads.map(lead => ({
                leadId: lead.leadId,
                status: 'queued'
            }));
        });

        return { processed: results.length };
    }
);

/**
 * Scheduled Follow-up Handler.
 * Runs daily to check for cold leads.
 */
const scheduledFollowup = inngest.createFunction(
    {
        id: 'scheduled-followup',
        name: 'Scheduled Follow-up Check'
    },
    { cron: '0 9 * * *' }, // Every day at 9 AM
    async ({ step }) => {
        logger.info('🕐 Running scheduled follow-up check');

        const result = await step.run('check-cold-leads', async () => {
            // This will be implemented to query cold leads
            return {
                checkedAt: new Date().toISOString(),
                action: 'check_cold_leads'
            };
        });

        return result;
    }
);

/**
 * Helper: Send an event to Inngest.
 * Use this instead of direct workflow engine calls.
 */
async function sendEvent(eventName, data) {
    try {
        await inngest.send({
            name: eventName,
            data
        });
        logger.debug({ eventName, data }, 'Event sent to Inngest');
        return true;
    } catch (error) {
        logger.error({ eventName, error: error.message }, 'Failed to send Inngest event');
        return false;
    }
}

/**
 * Helper: Send lead message event.
 */
async function sendLeadMessageEvent(leadId, campaignId, chatId, messageId, content) {
    return sendEvent('axis/lead.message.received', {
        leadId,
        campaignId,
        chatId,
        messageId,
        content,
        timestamp: new Date().toISOString()
    });
}

/**
 * Helper: Schedule a delayed action.
 */
async function scheduleDelayedAction(actionType, leadId, campaignId, delayMs, payload = {}) {
    return sendEvent('axis/delayed.action.scheduled', {
        actionType,
        leadId,
        campaignId,
        delayMs,
        payload,
        scheduledAt: new Date().toISOString()
    });
}

// Export Inngest client and functions for registration
module.exports = {
    inngest,
    functions: [
        handleLeadMessage,
        handleDelayedAction,
        processCampaignBatch,
        scheduledFollowup
    ],
    // Helper functions
    sendEvent,
    sendLeadMessageEvent,
    scheduleDelayedAction
};
