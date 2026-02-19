const logger = require('../../shared/Logger').createModuleLogger('scrape-worker');

module.exports = (scraperOrchestrator) => async (job) => {
    const { url, leadId, campaignId, userId } = job.data;

    logger.info({ jobId: job.id, url }, 'Worker started processing scrape job');

    try {
        // Notify start
        if (userId) {
            socketService.emitToUser(userId, 'scrape:log', { // Need to implement emitToUser in SocketService or use room
                jobId: job.id,
                timestamp: Date.now(),
                level: 'info',
                step: 'STARTING',
                message: `Starting scrape for ${url}`
            });
        }

        // Execute Scrape
        const result = await scraperOrchestrator.scrape(url, {
            // Pass job-specific options if needed
        });

        // Notify success
        if (userId) {
            socketService.emitToUser(userId, 'scrape:log', {
                jobId: job.id,
                timestamp: Date.now(),
                level: 'success',
                step: 'COMPLETED',
                message: `Successfully scraped ${result.pages.length} pages`,
                metadata: result.metadata
            });
        }

        return result;

    } catch (error) {
        logger.error({ jobId: job.id, error: error.message }, 'Worker failed processing scrape job');

        // Notify failure
        if (userId) {
            socketService.emitToUser(userId, 'scrape:log', {
                jobId: job.id,
                timestamp: Date.now(),
                level: 'error',
                step: 'FAILED',
                message: `Scraping failed: ${error.message}`
            });
        }

        throw error; // Rethrow to mark job as failed in BullMQ
    }
};
