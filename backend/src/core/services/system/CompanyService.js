const logger = require('../../../shared/Logger').createModuleLogger('company-service');

class CompanyService {
    constructor({ supabaseClient }) {
        this.supabase = supabaseClient;
    }

    /**
     * Create a new company and associate it with the user.
     * @param {string} userId - The ID of the user creating the company.
     * @param {string} name - The name of the company.
     */
    async createCompany(userId, name) {
        // 1. Generate Slug
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

        // 2. Create Company
        const { data: company, error: companyError } = await this.supabase
            .from('companies')
            .insert({
                name,
                slug,
                owner_id: userId,
                subscription_plan: 'free', // Default plan
                settings: {}
            })
            .select()
            .single();

        if (companyError) {
            logger.error({ error: companyError }, 'Failed to create company');
            throw new Error(`Failed to create company: ${companyError.message}`);
        }

        // 3. Create Membership (Owner)
        // This enables Many-to-Many: User can have multiple companies via memberships
        const { error: memberError } = await this.supabase
            .from('memberships')
            .insert({
                user_id: userId,
                company_id: company.id,
                role: 'owner',
                status: 'active'
            });

        if (memberError) {
            logger.error({ error: memberError, companyId: company.id }, 'Failed to create membership');
            throw new Error(`Failed to create membership: ${memberError.message}`);
        }

        // 4. Update Profile Default Company (if not set)
        // We do this to ensure they have a context for legacy logic, but we don't overwrite if they already have one.
        // Actually, for a clean switch, we might want to switch them to the new company immediately?
        // Let's just ensure they have *some* company_id set.
        const { data: currentProfile } = await this.supabase
            .from('profiles')
            .select('company_id')
            .eq('id', userId)
            .single();

        if (!currentProfile?.company_id) {
            await this.supabase
                .from('profiles')
                .update({ company_id: company.id, role: 'owner' })
                .eq('id', userId);
        }

        logger.info({ userId, companyId: company.id }, 'Company created successfully');
        return company;
    }

    async getCompany(companyId) {
        const { data, error } = await this.supabase
            .from('companies')
            .select('*')
            .eq('id', companyId)
            .single();

        if (error) throw error;
        return data;
    }
}

module.exports = CompanyService;
