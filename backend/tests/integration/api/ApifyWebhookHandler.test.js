const ApifyWebhookHandler = require('../../../src/api/controllers/apify/ApifyWebhookHandler');

describe('ApifyWebhookHandler Integration', () => {
    let handler;
    let mockSupabase;
    let mockTriggerService;
    let mockApifyClient;

    beforeEach(() => {
        mockSupabase = {
            from: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockReturnThis(),
            insert: jest.fn().mockResolvedValue({ error: null }),
            update: jest.fn().mockReturnThis(),
            not: jest.fn().mockReturnThis()
        };

        mockTriggerService = {
            onNewLeadsImported: jest.fn().mockResolvedValue(true)
        };

        mockApifyClient = {
            dataset: jest.fn().mockReturnThis(),
            listItems: jest.fn().mockResolvedValue({ items: [{ name: 'John Doe', fullName: 'John Doe', phone: '11999991234' }] }),
            run: jest.fn().mockReturnThis(),
            get: jest.fn().mockResolvedValue({ id: 'run-id', status: 'SUCCEEDED' })
        };

        handler = new ApifyWebhookHandler(mockSupabase, mockTriggerService);
        handler.client = mockApifyClient;
    });

    describe('handleWebhook', () => {
        it('should acknowledge webhook immediately', async () => {
            const req = { body: { eventType: 'ACTOR.RUN.SUCCEEDED', eventData: { actorRunId: 'run-id' } } };
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

            // We need to prevent the async processing from crashing if we don't mock everything
            handler.handleRunSuccess = jest.fn().mockResolvedValue();

            await handler.handleWebhook(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ received: true });
        });

        it('should download dataset and save leads on SUCCESS', async () => {
            // Mock database response for run metadata
            mockSupabase.single.mockResolvedValueOnce({
                data: { campaign_id: 'camp-id', actor_key: 'linkedin.harvest' },
                error: null
            });

            // Mock existing phones for dedup
            mockSupabase.not.mockResolvedValueOnce({
                data: [],
                error: null
            });

            await handler.handleRunSuccess({
                actorRunId: 'run-id',
                defaultDatasetId: 'dataset-id'
            });

            expect(mockApifyClient.dataset).toHaveBeenCalledWith('dataset-id');
            expect(mockApifyClient.listItems).toHaveBeenCalled();
            expect(mockSupabase.insert).toHaveBeenCalled();

            // Verify that TriggerService was called with campaignId and leads
            expect(mockTriggerService.onNewLeadsImported).toHaveBeenCalledWith(
                'camp-id',
                expect.any(Array)
            );
        });

        it('should handle duplicates correctly', async () => {
            // Mock database response for run metadata
            mockSupabase.single.mockResolvedValueOnce({
                data: { campaign_id: 'camp-id', actor_key: 'linkedin.harvest' },
                error: null
            });

            // Mock existing phones for dedup - simulate John Doe already exists
            mockSupabase.not.mockResolvedValueOnce({
                data: [{ phone: '+5511999991234' }],
                error: null
            });

            await handler.handleRunSuccess({
                actorRunId: 'run-id',
                defaultDatasetId: 'dataset-id'
            });

            // unique.length should be 0, so insert shouldn't be called
            expect(mockSupabase.insert).not.toHaveBeenCalled();
            expect(mockTriggerService.onNewLeadsImported).not.toHaveBeenCalled();
        });

        it('should update run status to failed on ACTOR.RUN.FAILED', async () => {
            mockApifyClient.get.mockResolvedValueOnce({
                id: 'run-id',
                status: 'FAILED',
                exitCode: 1
            });

            await handler.handleRunFailed({ actorRunId: 'run-id' });

            expect(mockSupabase.update).toHaveBeenCalledWith(expect.objectContaining({
                status: 'failed',
                error_message: 1
            }));
        });
    });
});
