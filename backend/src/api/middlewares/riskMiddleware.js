/**
 * Risk Middleware ("The Hardwall")
 * 
 * Blocks access to high-risk endpoints (e.g., mass campaign sending)
 * if the organization is not verified.
 * 
 * Assumes authMiddleware has already run.
 */
const logger = require('../../shared/Logger').createModuleLogger('risk-middleware');

const riskMiddleware = async (req, res, next) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ error: 'Unauthorized: Auth required for Risk Check' });
        }

        // 1. Identify Company
        // BYPASS: Risk Check disabled due to 'companies' table removal.
        logger.warn('Bypassing Risk Check (Global Override)');
        return next();

        /*
        // AuthMiddleware guarantees req.user.profile.company_id is populated if fallback needed,
        // or we use the explicit workspace context.
        const companyId = user.membership?.company_id || user.profile?.company_id;

        if (!companyId) {
            // If no company context, we can't assess risk.
            // For system admins, we might bypass?
            if (user.profile?.role === 'admin') return next();

            // return res.status(403).json({ error: 'Risk Check Failed: No Company Context' });
            logger.warn('Bypassing Risk Check (No Company ID)');
            return next();
        }
        */

        // 2. Fetch Risk Status
        // Use the scoped client from request
        const supabase = req.supabase;

        const { data: org, error } = await supabase
            .from('companies')
            .select('risk_status')
            .eq('id', companyId)
            .single();

        if (error || !org) {
            logger.warn({ companyId, err: error?.message }, 'Could not fetch company for risk check');
            // Fail safe: if we can't check, we block high-risk actions? 
            // Or pending verification.
            return res.status(403).json({ error: 'Risk Verification Unavailable' });
        }

        const riskStatus = org.risk_status || 'pending_verification';

        // 3. Hardwall Logic
        const ALLOWED_STATUSES = ['verified', 'trusted'];

        // DEV BYPASS
        if (process.env.NODE_ENV === 'development') {
            // console.log(`🔓 [Risk] DEV PASSTHROUGH (Status: ${riskStatus})`);
            return next();
        }

        if (!ALLOWED_STATUSES.includes(riskStatus)) {
            logger.warn({ companyId, riskStatus }, 'BLOCKED: Risk verification required');
            return res.status(403).json({
                error: 'Risk verification required.',
                code: 'RISK_VERIFICATION_REQUIRED',
                current_status: riskStatus,
                message: 'Please complete business verification.'
            });
        }

        next();

    } catch (err) {
        logger.error({ err }, 'System Error');
        res.status(500).json({ error: 'Internal Risk Error' });
    }
};

module.exports = riskMiddleware;
