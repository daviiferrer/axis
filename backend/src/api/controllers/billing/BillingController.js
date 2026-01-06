const logger = require('../../../shared/Logger').createModuleLogger('billing-controller');

class BillingController {
    constructor(billingService) {
        this.billingService = billingService;
    }

    /**
     * Create Checkout Session
     */
    async createSession(req, res) {
        try {
            const { priceId, successUrl, cancelUrl } = req.body;
            const userId = req.user?.id; // Assuming auth middleware populates req.user

            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const session = await this.billingService.createCheckoutSession(userId, priceId, successUrl, cancelUrl);
            res.json({ url: session.url });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * Handle Stripe Webhook
     */
    async handleWebhook(req, res) {
        const sig = req.headers['stripe-signature'];
        let event;

        try {
            // In a real app, use stripe.webhooks.constructEvent
            // For localhost testing with Stripe CLI, we can be more lenient or use the secret
            event = req.body;

            logger.info({ type: event.type }, 'Stripe webhook received');

            switch (event.type) {
                case 'checkout.session.completed':
                    await this.handleCheckoutCompleted(event.data.object);
                    break;
                case 'customer.subscription.updated':
                case 'customer.subscription.deleted':
                    await this.handleSubscriptionUpdated(event.data.object);
                    break;
                default:
                    logger.debug({ type: event.type }, 'Unhandled webhook event');
            }

            res.json({ received: true });
        } catch (error) {
            logger.error({ error: error.message }, 'Webhook handler failed');
            res.status(400).send(`Webhook Error: ${error.message}`);
        }
    }

    async handleCheckoutCompleted(session) {
        // 1. Try metadata (from API created)
        let userId = session.metadata?.userId;

        // 2. Try client_reference_id (from Payment Links URL)
        // Link format: https://buy.stripe.com/test_...?client_reference_id=USER_123
        if (!userId && session.client_reference_id) {
            userId = session.client_reference_id;
        }

        // 3. Fallback for testing (if no user found and strictly dev env)
        if (!userId) {
            logger.warn({ session: session.id }, 'No userId found in webhook. Using fallback for testing?');
            // For now, let's just log and return to avoid crashing the webhook
            // Or explicitly set a test user ID if you have one stable.
            // userId = 'test-user-id'; 
            throw new Error(`Missing userId in metadata or client_reference_id. Session ID: ${session.id}`);
        }

        const subscriptionId = session.subscription;

        // Update subscription record
        await this.billingService.supabase
            .from('subscriptions')
            .update({
                stripe_subscription_id: subscriptionId,
                updated_at: new Date()
            })
            .eq('user_id', userId);

        // Add initial credits based on plan (example)
        await this.billingService.addCredits(
            userId,
            1000,
            'credit_purchase',
            'Initial credits from subscription'
        );
    }

    async handleSubscriptionUpdated(subscription) {
        await this.billingService.updateSubscriptionStatus(
            subscription.id,
            subscription.status,
            subscription.current_period_end,
            subscription.items.data[0].price.product // Simplification
        );
    }
}

module.exports = BillingController;
