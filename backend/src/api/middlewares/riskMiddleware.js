/**
 * Risk Middleware ("The Hardwall")
 * 
 * Blocks access to high-risk endpoints (e.g., mass campaign sending)
 * if the organization is not verified.
 * 
 * Logic:
 * 1. Checks req.user.organization_id (assuming populated by authMiddleware)
 * 2. Queries Supabase for 'risk_status'
 * 3. If 'pending_verification' or 'blocked', returns 403.
 */
const createRiskMiddleware = (supabase) => {
    return async (req, res, next) => {
        try {
            const userId = req.user?.id;
            const organizationId = req.user?.organization_id; // Usually from JWT or looked up

            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            // If organization_id is not in request (e.g. not added by auth middleware yet), fetch it
            let riskStatus = 'pending_verification';

            // Assume we fetch the organization risk profile
            // In a real scenario, this might be cached in the JWT or Redis
            const { data: org, error } = await supabase
                .from('companies')  // Standardizing to 'companies' table
                .select('risk_status, id')
                .eq('owner_id', userId) // Simplified: assuming 1-1 for now or owner check
                .single();

            if (org) {
                riskStatus = org.risk_status || 'pending_verification';
            }

            // Hardwall Logic
            // Allow: 'verified', 'trusted'
            // Block: 'pending_verification', 'flagged', 'blocked'
            const ALLOWED_STATUSES = ['verified', 'trusted'];

            if (!ALLOWED_STATUSES.includes(riskStatus)) {
                // If in 'trial_premium' (Reverse Trial), we might allow small batches, 
                // but for HARDWALL strategy, we block mass sending.
                // We'll return a specific error code for the UI to show the Checklist.
                return res.status(403).json({
                    error: 'Risk verification required.',
                    code: 'RISK_VERIFICATION_REQUIRED',
                    current_status: riskStatus,
                    message: 'Please complete your business verification to unlock mass sending.'
                });
            }

            // All good
            next();

        } catch (err) {
            console.error('[RiskMiddleware] Error:', err);
            // Fail safe: Block if error
            return res.status(500).json({ error: 'Internal risk check failed.' });
        }
    };
};

module.exports = createRiskMiddleware;
