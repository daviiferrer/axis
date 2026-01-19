/**
 * PresenceService - Core Service for Presence Monitoring
 */
class PresenceService {
    constructor(supabaseClient, wahaClient) {
        this.supabase = supabaseClient;
        this.wahaClient = wahaClient;
        this.syncIntervalId = null;
        this.BATCH_SIZE = 10;
        this.DELAY_MS = 200;
        this.SYNC_INTERVAL_MS = 30 * 1000;
    }

    #sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Normalizes phone to JID.
     */
    toJid(phone) {
        if (!phone) return null;
        const clean = phone.replace(/\D/g, '');
        return clean ? `${clean}@s.whatsapp.net` : null;
    }

    /**
     * Subscribes to all leads' presence updates.
     */
    async syncAllLeadsPresence() {
        // console.log('[PresenceService] 🔄 Starting bulk presence subscription...');


        try {
            const { data: leads, error } = await this.supabase
                .from('leads')
                .select(`
                    phone,
                    campaign_id,
                    campaigns!inner(session_id)
                `)
                .not('phone', 'is', null);

            if (error) {
                console.error('[PresenceService] DB Error:', error.message);
                return;
            }

            if (!leads || leads.length === 0) return;

            const leadsWithSession = leads
                .map(l => ({
                    jid: this.toJid(l.phone),
                    session: l.campaigns?.session_id
                }))
                .filter(l => l.jid && l.session);

            const uniqueEntries = [...new Map(
                leadsWithSession.map(l => [`${l.session}:${l.jid}`, l])
            ).values()];

            let successCount = 0;
            let failCount = 0;

            for (let i = 0; i < uniqueEntries.length; i += this.BATCH_SIZE) {
                const batch = uniqueEntries.slice(i, i + this.BATCH_SIZE);

                const promises = batch.map(async ({ jid, session }) => {
                    try {
                        await this.wahaClient.subscribePresence(session, jid);
                        return true;
                    } catch (e) {
                        return false;
                    }
                });

                const results = await Promise.all(promises);
                successCount += results.filter(Boolean).length;
                failCount += results.filter(r => !r).length;

                await this.#sleep(this.DELAY_MS);
            }

            if (failCount > 0) {
                console.log(`[PresenceService] ⚠️ Bulk subscription completed. Success: ${successCount}, Failed: ${failCount}`);
            }

        } catch (error) {
            console.error('[PresenceService] Error in bulk subscription:', error.message);
        }
    }

    /**
     * Starts periodic synchronization.
     */
    startPeriodicSync() {
        if (this.syncIntervalId) clearInterval(this.syncIntervalId);

        // Initial sync
        this.syncAllLeadsPresence();

        // Periodic sync (every 5 minutes to reduce noise)
        this.syncIntervalId = setInterval(() => {
            this.syncAllLeadsPresence();
        }, this.SYNC_INTERVAL_MS * 10); // 30s * 10 = 5 min

        console.log(`[PresenceService] ⏰ Periodic sync started (every 5m)`);
    }

    /**
     * Stops periodic synchronization.
     */
    stopPeriodicSync() {
        if (this.syncIntervalId) {
            clearInterval(this.syncIntervalId);
            this.syncIntervalId = null;
            console.log('[PresenceService] Periodic sync stopped.');
        }
    }
}

module.exports = PresenceService;
