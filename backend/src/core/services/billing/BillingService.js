const logger = require('../../../shared/Logger').createModuleLogger('billing-service');

class BillingService {
    constructor({ supabaseClient }) {
        this.supabase = supabaseClient;
    }

    /**
     * Get user's current plan and trial status
     */
    async getPlanStatus(userId) {
        // Now getting plan from profiles -> companies
        const { data: profile } = await this.supabase
            .from('profiles')
            .select('company_id')
            .eq('id', userId)
            .single();

        if (!profile?.company_id) return null;

        const { data: company } = await this.supabase
            .from('companies')
            .select('subscription_plan, trial_ends_at')
            .eq('id', profile.company_id)
            .single();

        return company;
    }

    /**
     * Upgrade or Change Plan (Simplified)
     * In a real internal tool, this might just update the DB directly.
     * For now, we mock the upgrade to 'premium'.
     */
    async upgradeToPremium(userId) {
        const { data: profile } = await this.supabase
            .from('profiles')
            .select('company_id')
            .eq('id', userId)
            .single();

        if (!profile?.company_id) throw new Error('User has no company');

        const { data, error } = await this.supabase
            .from('companies')
            .update({
                subscription_plan: 'premium',
                // Extend trial or set to infinite? Let's just set plan.
            })
            .eq('id', profile.company_id)
            .select()
            .single();

        if (error) throw error;
        logger.info({ userId, companyId: profile.company_id }, 'Upgraded to premium');
        return data;
    }

    // Deprecated methods stubs to prevent crashes if called
    async createCheckoutSession() { throw new Error('Billing simplified: Checkout not implemented'); }
    async getOrCreateCustomer() { return 'simplified-customer'; }
    async hasSufficientCredits(companyId, amount = 1) {
        // 1. Get Company Credits
        const { data: company } = await this.supabase
            .from('companies')
            .select('credits, subscription_plan')
            .eq('id', companyId)
            .single();

        if (!company) return false;

        // Enterprise/Unlimited check?
        if (company.subscription_plan === 'enterprise') return true;

        return (company.credits || 0) >= amount;
    }

    async deductCredits(companyId, amount, details = {}) {
        if (!companyId) return;

        try {
            const { data: company, error: fetchError } = await this.supabase
                .from('companies')
                .select('credits, subscription_plan')
                .eq('id', companyId)
                .single();

            if (fetchError || !company) throw new Error('Company not found');

            // 1. Check if Enterprise (Unlimited)
            if (company.subscription_plan === 'enterprise') {
                return; // No deduction needed
            }

            // 2. Strict Balance Check
            if ((company.credits || 0) < amount) {
                logger.warn({ companyId, credits: company.credits, required: amount }, '⛔ Insufficient Credits - Execution Blocked');
                throw new Error('INSUFFICIENT_CREDITS');
            }

            // 3. Deduct
            const newBalance = Math.max(0, (company.credits || 0) - amount);

            const { error: updateError } = await this.supabase
                .from('companies')
                .update({ credits: newBalance })
                .eq('id', companyId);

            if (updateError) throw updateError;

            // Log usage (optional, could be in a separate table 'usage_logs')
            // logger.info({ companyId, deduction: amount, purpose: details.purpose, remaining: newBalance }, 'Credits Deducted');
        } catch (e) {
            // Propagate 'INSUFFICIENT_CREDITS' to stop execution flow
            if (e.message === 'INSUFFICIENT_CREDITS') throw e;

            logger.error({ error: e.message, companyId }, 'Failed to deduct credits');
            // If it's a DB error, we might want to throw too, or allow graceful failure?
            // For SaaS safety, better to fail closed (block) on error than fail open (free usage).
            throw new Error('BILLING_SYSTEM_ERROR');
        }
    }

    getPlanConfig(planName) {
        const PLANS = {
            'starter': {
                max_waha_instances: 1,
                features: {
                    graph_engine: false,
                    meta_capi: false,
                    fine_tuning: false
                },
                queue_priority: 'normal'
            },
            'business': {
                max_waha_instances: 3,
                features: {
                    graph_engine: true,
                    meta_capi: true,
                    fine_tuning: false
                },
                queue_priority: 'high'
            },
            'enterprise': {
                max_waha_instances: 999,
                features: {
                    graph_engine: true,
                    meta_capi: true,
                    fine_tuning: true
                },
                queue_priority: 'critical'
            }
        };

        const normalized = (planName || 'starter').toLowerCase();
        return PLANS[normalized] || PLANS['starter'];
    }
}

module.exports = BillingService;
