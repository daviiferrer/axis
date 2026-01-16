const logger = require('../../../shared/Logger').createModuleLogger('company-controller');

class CompanyController {
    constructor(companyService) {
        this.companyService = companyService;
    }

    async create(req, res) {
        try {
            const userId = req.user?.id;
            const { name } = req.body;

            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            if (!name) {
                return res.status(400).json({ error: 'Company name is required' });
            }

            const company = await this.companyService.createCompany(userId, name);
            res.status(201).json(company);

        } catch (error) {
            logger.error({ error: error.message }, 'Create Company Error');
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = CompanyController;
