const BillingController = require('../../../../src/api/controllers/billing/BillingController');

// Mock dependencies
const mockBillingService = {
    createCheckoutSession: jest.fn(),
    supabase: {
        from: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis()
    },
    addCredits: jest.fn(),
    updateSubscriptionStatus: jest.fn()
};

const mockReq = {
    body: {},
    params: {},
    user: { id: 'user_123' },
    headers: { 'stripe-signature': 'sig_123' }
};

const mockRes = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
    send: jest.fn()
};

describe('BillingController', () => {
    let billingController;

    beforeEach(() => {
        jest.clearAllMocks();
        billingController = new BillingController(mockBillingService);
    });

    describe('createSession', () => {
        it('should create session and return URL', async () => {
            mockReq.body = { priceId: 'price_1', successUrl: 'http://ok', cancelUrl: 'http://fail' };
            mockBillingService.createCheckoutSession.mockResolvedValue({ url: 'http://stripe.url' });

            await billingController.createSession(mockReq, mockRes);

            expect(mockBillingService.createCheckoutSession).toHaveBeenCalledWith(
                'user_123', 'price_1', 'http://ok', 'http://fail'
            );
            expect(mockRes.json).toHaveBeenCalledWith({ url: 'http://stripe.url' });
        });

        it('should return 401 if no user attached to req', async () => {
            const noUserReq = { ...mockReq, user: undefined };
            await billingController.createSession(noUserReq, mockRes);
            expect(mockRes.status).toHaveBeenCalledWith(401);
        });

        it('should return 500 on service error', async () => {
            mockBillingService.createCheckoutSession.mockRejectedValue(new Error('Stripe error'));
            await billingController.createSession(mockReq, mockRes);
            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Stripe error' });
        });
    });

    describe('handleWebhook', () => {
        it('should handle checkout.session.completed', async () => {
            const eventData = {
                type: 'checkout.session.completed',
                data: { object: { id: 'sess_123', metadata: { userId: 'user_999' }, subscription: 'sub_123' } }
            };
            mockReq.body = eventData;

            // Mock supabase call inside handleCheckoutCompleted
            mockBillingService.supabase.eq.mockResolvedValue({ error: null });

            await billingController.handleWebhook(mockReq, mockRes);

            expect(mockBillingService.supabase.from).toHaveBeenCalledWith('subscriptions');
            expect(mockBillingService.supabase.update).toHaveBeenCalledWith(expect.objectContaining({
                stripe_subscription_id: 'sub_123'
            }));
            expect(mockBillingService.addCredits).toHaveBeenCalledWith(
                'user_999', 1000, 'credit_purchase', expect.any(String)
            );
            expect(mockRes.json).toHaveBeenCalledWith({ received: true });
        });

        it('should handle subscription.updated', async () => {
            const eventData = {
                type: 'customer.subscription.updated',
                data: {
                    object: {
                        id: 'sub_123',
                        status: 'active',
                        current_period_end: 1234567890,
                        items: { data: [{ price: { product: 'prod_123' } }] }
                    }
                }
            };
            mockReq.body = eventData;

            await billingController.handleWebhook(mockReq, mockRes);

            expect(mockBillingService.updateSubscriptionStatus).toHaveBeenCalledWith(
                'sub_123', 'active', 1234567890, 'prod_123'
            );
            expect(mockRes.json).toHaveBeenCalledWith({ received: true });
        });

        it('should return 400 on error', async () => {
            mockReq.body = { type: 'unknown_event' };
            // Simulate error by throwing inside switch (or just force catch block)
            // But here we want to test loop. Let's make createSession throw to reuse logic?
            // Actually, handleWebhook catches errors. Let's mock logger to fail? No.
            // Let's invoke a handler that throws.

            // To test catch block:
            const eventData = { type: 'checkout.session.completed', data: { object: {} } }; // Missing metadata triggers error in controller logic
            mockReq.body = eventData;

            await billingController.handleWebhook(mockReq, mockRes);

            // It should log error and send 400
            expect(mockRes.status).toHaveBeenCalledWith(400);
        });
    });
});
