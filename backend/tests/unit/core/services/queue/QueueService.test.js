const QueueService = require('../../../../../src/core/services/queue/QueueService');

// Mock BullMQ
jest.mock('bullmq', () => {
    return {
        Queue: jest.fn().mockImplementation(() => ({
            add: jest.fn().mockResolvedValue({ id: 'job-123' }),
            close: jest.fn(),
            getJobCounts: jest.fn().mockResolvedValue({ active: 1 })
        })),
        Worker: jest.fn().mockImplementation(() => ({
            on: jest.fn(),
            close: jest.fn(),
        })),
        FlowProducer: jest.fn().mockImplementation(() => ({
            add: jest.fn().mockResolvedValue({ job: { id: 'flow-123' } }),
            close: jest.fn()
        })),
        QueueEvents: jest.fn()
    };
});

// Mock IORedis
jest.mock('ioredis', () => {
    return jest.fn().mockImplementation(() => ({
        on: jest.fn((event, cb) => {
            if (event === 'connect') cb();
        }),
        quit: jest.fn()
    }));
});

describe('QueueService', () => {
    let service;

    beforeEach(async () => {
        jest.clearAllMocks();
        service = new QueueService('redis://localhost:6379');
        await service.initialize();
    });

    afterEach(async () => {
        await service.shutdown();
    });

    describe('addJob', () => {
        it('should add a job to the queue', async () => {
            const data = { leadId: '123', content: 'test' };
            // Mock queues object since initialize is mocked or we need to ensure it populates
            // But initialize() logic relies on mocked Queue constructor which returns the object

            await service.addJob('whatsappSend', 'send-msg', data);

            expect(service.queues.whatsappSend.add).toHaveBeenCalledWith(
                'send-msg',
                data,
                expect.objectContaining({ attempts: 3 })
            );
        });
    });

    describe('addLeadJob', () => {
        it('should add a flow job', async () => {
            const lead = { id: '1', phone: '123' };
            const campaign = { id: 'c1', session_name: 's1', agent_id: 'a1' };

            await service.addLeadJob(lead, campaign);

            expect(service.flowProducer.add).toHaveBeenCalled();
            const callArgs = service.flowProducer.add.mock.calls[0][0];
            expect(callArgs.queueName).toBe('whatsapp-send');
            expect(callArgs.children[0].queueName).toBe('ai-generation');
        });
    });
});
