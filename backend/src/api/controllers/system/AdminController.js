/**
 * AdminController - Handles administrative operations.
 */
class AdminController {
    constructor(supabaseClient, wahaClient) {
        this.supabase = supabaseClient;
        this.wahaClient = wahaClient;
    }

    async getStats(req, res) {
        try {
            const { count: userCount } = await this.supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true });

            const { count: sessionCount } = await this.supabase
                .from('user_sessions')
                .select('*', { count: 'exact', head: true });

            const startOfDay = new Date();
            startOfDay.setHours(0, 0, 0, 0);
            const { count: msgCount } = await this.supabase
                .from('messages')
                .select('*', { count: 'exact', head: true })
                .gte('timestamp', startOfDay.toISOString());

            res.json({
                users: userCount || 0,
                sessions: sessionCount || 0,
                messagesToday: msgCount || 0
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async listUsers(req, res) {
        try {
            const { data: { users }, error } = await this.supabase.auth.admin.listUsers();
            if (error) throw error;

            const { data: profiles } = await this.supabase.from('profiles').select('id, role, is_super_admin');
            const profileMap = new Map(profiles?.map(p => [p.id, p]));

            const userList = users.map(u => {
                const profile = profileMap.get(u.id);
                return {
                    id: u.id,
                    email: u.email,
                    created_at: u.created_at,
                    last_sign_in_at: u.last_sign_in_at,
                    banned: !!u.banned_until,
                    role: profile?.role || 'user',
                    is_super_admin: profile?.is_super_admin || false
                };
            });

            res.json(userList);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async stopAllSessions(req, res) {
        try {
            const { data: sessions } = await this.supabase.from('user_sessions').select('session_name');
            if (!sessions || sessions.length === 0) {
                return res.json({ message: 'No active sessions to stop' });
            }

            const results = [];
            for (const s of sessions) {
                try {
                    await this.wahaClient.stopSession(s.session_name);
                    results.push({ name: s.session_name, status: 'stopped' });
                } catch (e) {
                    results.push({ name: s.session_name, status: 'failed', error: e.message });
                }
            }

            res.json({ results });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = AdminController;
