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
            const companyId = req.user.profile?.company_id;

            // Fetch the organization risk profile
            const { data: org, error } = await supabase
                .from('companies')
                .select('risk_status')
                .eq('id', companyId || '') // Use companyId if available
                .single();

            if (org) {
                riskStatus = org.risk_status || 'pending_verification';
            } else if (userId) {
                // Fallback: try by owner_id if companyId not in profile
                const { data: ownedOrg } = await supabase
                    .from('companies')
                    .select('risk_status')
                    .eq('owner_id', userId)
                    .single();
                if (ownedOrg) riskStatus = ownedOrg.risk_status || 'pending_verification';
            }

            // Hardwall Logic
            const ALLOWED_STATUSES = ['verified', 'trusted'];

            console.log(`🛡️ [Risk] Checking risk status: ${riskStatus}`);

            if (process.env.NODE_ENV === 'development') {
                console.log(`🔓 [Risk] DEVELOPMENT BYPASS ACTIVE (Status: ${riskStatus})`);
                return next();
            }

            if (!ALLOWED_STATUSES.includes(riskStatus)) {
                console.log(`🚫 [Risk] BLOCKED: Status is ${riskStatus}`);
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
