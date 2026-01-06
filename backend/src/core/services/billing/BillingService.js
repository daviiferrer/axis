const logger = require('../../../shared/Logger').createModuleLogger('billing-service');

class BillingService {
    constructor(supabase) {
        this.supabase = supabase;
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
    async addCredits() { logger.warn('Billing simplified: Credits not implemented'); }
    async deductCredits() { logger.warn('Billing simplified: Credits not implemented'); }
    async getBalance() { return 999999; } // Infinite credits for simplified mode
}

module.exports = BillingService;
