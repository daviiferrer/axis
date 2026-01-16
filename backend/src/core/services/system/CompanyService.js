const logger = require('../../../shared/Logger').createModuleLogger('company-service');

class CompanyService {
    constructor(supabase) {
        this.supabase = supabase;
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

        // 2. Update User Profile with Company ID and Role
        const { error: profileError } = await this.supabase
            .from('profiles')
            .update({
                company_id: company.id,
                role: 'owner'
            })
            .eq('id', userId);

        if (profileError) {
            // Rollback company creation? For now, just log and throw. 
            // Ideally should be a transaction, but Supabase JS client doesn't support transactions easily without RPC.
            logger.error({ error: profileError, companyId: company.id }, 'Failed to link profile to company');
            // We might want to delete the company here to clean up, but keeping it simple for now.
            throw new Error(`Failed to link profile: ${profileError.message}`);
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
