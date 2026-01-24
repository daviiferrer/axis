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

        // Decrement using RPC or direct update? 
        // Direct update is prone to race conditions, but fine for MVP.
        // Ideally: rpc('deduct_credits', { amt: amount, row_id: companyId })
        try {
            const { data: company } = await this.supabase
                .from('companies')
                .select('credits')
                .eq('id', companyId)
                .single();

            if (!company) return;

            const newBalance = Math.max(0, (company.credits || 0) - amount);

            await this.supabase
                .from('companies')
                .update({ credits: newBalance })
                .eq('id', companyId);

            // Log usage (optional, could be in a separate table 'usage_logs')
            // logger.info({ companyId, deduction: amount, purpose: details.purpose }, 'Credits Deducted');
        } catch (e) {
            logger.error({ error: e.message, companyId }, 'Failed to deduct credits');
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
