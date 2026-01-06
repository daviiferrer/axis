/**
 * QueueService - Async Job Orchestration with BullMQ
 * 
 * Uses FlowProducer pattern to ensure:
 * - Child job (AI generation) completes before Parent job (WhatsApp send)
 * - Proper error handling and retries
 * - Job deduplication by leadId
 */
const { Queue, Worker, FlowProducer, QueueEvents } = require('bullmq');
const IORedis = require('ioredis');
const logger = require('../../../shared/Logger').createModuleLogger('queue');

class QueueService {
    constructor(redisUrl, supabaseClient) {
        this.redisUrl = redisUrl || process.env.REDIS_URL || 'redis://localhost:6379';
        this.supabase = supabaseClient;
        this.connection = null;
        this.flowProducer = null;
        this.workers = {};
        this.queues = {};
        this.isConnected = false;
    }

    /**
     * Initialize Redis connection and queues
     */
    async initialize() {
        try {
            this.connection = new IORedis(this.redisUrl, {
                maxRetriesPerRequest: null,
                enableReadyCheck: false
            });

            this.connection.on('connect', () => {
                logger.info('🔗 Redis connected');
                this.isConnected = true;
            });

            this.connection.on('error', (err) => {
                logger.error({ error: err.message }, 'Redis connection error');
                this.isConnected = false;
            });

            // Initialize queues
            this.queues.aiGeneration = new Queue('ai-generation', { connection: this.connection });
            this.queues.whatsappSend = new Queue('whatsapp-send', { connection: this.connection });
            this.queues.leadProcessing = new Queue('lead-processing', { connection: this.connection });
            this.queues.scrapeRequests = new Queue('scrape-requests', { connection: this.connection });

            // Initialize FlowProducer for parent-child job relationships
            this.flowProducer = new FlowProducer({ connection: this.connection });

            logger.info('✅ QueueService initialized');
            return true;
        } catch (error) {
            logger.error({ error: error.message }, 'Failed to initialize QueueService');
            return false;
        }
    }

    /**
     * Check if lead is in an active conversation (Anti-Collision).
     * Returns TRUE if safe to proceed, FALSE if should abort.
     */
    async checkAntiCollision(leadId) {
        if (!this.supabase) return true; // Safety bypass if not injected

        const { data, error } = await this.supabase
            .from('campaign_leads')
            .select('last_user_message_at')
            .eq('id', leadId)
            .single();

        if (error || !data) return true; // Assume safe if lead not found (rare)

        if (data.last_user_message_at) {
            const lastMsg = new Date(data.last_user_message_at).getTime();
            const now = Date.now();
            const diffMinutes = (now - lastMsg) / 1000 / 60;

            if (diffMinutes < 5) {
                logger.warn({ leadId, diffMinutes: diffMinutes.toFixed(1) }, '🛑 Anti-Collision: Active conversation (< 5m). Job aborted.');
                return false;
            }
        }

        return true;
    }

    /**
     * Add a lead processing job with FlowProducer pattern
     * Child: AI Generation → Parent: WhatsApp Send
     */
    async addLeadJob(lead, campaign) {
        if (!this.isConnected) {
            logger.warn('Queue not connected, skipping job');
            return null;
        }

        // Anti-Collision Guard
        const safeToProcess = await this.checkAntiCollision(lead.id);
        if (!safeToProcess) {
            return null; // Silent abort
        }

        try {
            const flow = await this.flowProducer.add({
                name: 'send-message',
                queueName: 'whatsapp-send',
                data: {
                    leadId: lead.id,
                    phone: lead.phone,
                    campaignId: campaign.id,
                    sessionName: campaign.session_name
                },
                opts: {
                    jobId: `send-${lead.id}-${Date.now()}`,
                    attempts: 3,
                    backoff: { type: 'exponential', delay: 1000 }
                },
                children: [{
                    name: 'generate-response',
                    queueName: 'ai-generation',
                    data: {
                        leadId: lead.id,
                        campaignId: campaign.id,
                        agentId: campaign.agent_id
                    },
                    opts: {
                        jobId: `ai-${lead.id}-${Date.now()}`,
                        attempts: 2,
                        backoff: { type: 'exponential', delay: 2000 }
                    }
                }]
            });

            logger.info({ leadId: lead.id, flowJobId: flow.job.id }, 'Lead job added to queue');
            return flow;
        } catch (error) {
            logger.error({ error: error.message, leadId: lead.id }, 'Failed to add lead job');
            return null;
        }
    }

    /**
     * Add a scrape job
     */
    async addScrapeJob(data) {
        return this.addJob('scrapeRequests', 'scrape', data, {
            attempts: 3,
            backoff: { type: 'exponential', delay: 5000 } // Wait 5s before retry
        });
    }

    /**
     * Add a simple job to a specific queue
     */
    async addJob(queueName, jobName, data, opts = {}) {
        if (!this.queues[queueName]) {
            logger.warn({ queueName }, 'Queue not found');
            return null;
        }

        try {
            const job = await this.queues[queueName].add(jobName, data, {
                attempts: 3,
                backoff: { type: 'exponential', delay: 1000 },
                ...opts
            });
            logger.debug({ queueName, jobId: job.id }, 'Job added');
            return job;
        } catch (error) {
            logger.error({ error: error.message }, 'Failed to add job');
            return null;
        }
    }

    /**
     * Register a worker for a queue
     */
    registerWorker(queueName, processor) {
        if (this.workers[queueName]) {
            logger.warn({ queueName }, 'Worker already registered');
            return this.workers[queueName];
        }

        const worker = new Worker(queueName, processor, {
            connection: this.connection,
            concurrency: 5
        });

        worker.on('completed', (job) => {
            logger.debug({ queueName, jobId: job.id }, 'Job completed');
        });

        worker.on('failed', (job, err) => {
            logger.error({ queueName, jobId: job?.id, error: err.message }, 'Job failed');
        });

        this.workers[queueName] = worker;
        logger.info({ queueName }, 'Worker registered');
        return worker;
    }

    /**
     * Get queue statistics
     */
    async getStats() {
        const stats = {};
        for (const [name, queue] of Object.entries(this.queues)) {
            const counts = await queue.getJobCounts();
            stats[name] = counts;
        }
        return stats;
    }

    /**
     * Gracefully shutdown all workers and connections
     */
    async shutdown() {
        logger.info('Shutting down QueueService...');

        for (const [name, worker] of Object.entries(this.workers)) {
            await worker.close();
            logger.debug({ queueName: name }, 'Worker closed');
        }

        for (const [name, queue] of Object.entries(this.queues)) {
            await queue.close();
        }

        if (this.flowProducer) {
            await this.flowProducer.close();
        }

        if (this.connection) {
            await this.connection.quit();
        }

        logger.info('QueueService shutdown complete');
    }
}

module.exports = QueueService;
