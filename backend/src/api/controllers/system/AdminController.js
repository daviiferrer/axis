/**
 * AdminController - Handles administrative operations.
 */
class AdminController {
    constructor(supabaseAdmin, wahaClient) {
        this.supabase = supabaseAdmin;
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

            const { data: profiles } = await this.supabase.from('profiles').select('id, role');
            const profileMap = new Map(profiles?.map(p => [p.id, p]));

            const userList = users.map(u => {
                const profile = profileMap.get(u.id);
                return {
                    id: u.id,
                    email: u.email,
                    created_at: u.created_at,
                    last_sign_in_at: u.last_sign_in_at,
                    banned: !!u.banned_until,
                    role: profile?.role || 'owner' // Default to owner/customer if missing profile
                };
            });

            res.json(userList);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async updateUserRole(req, res) {
        try {
            const { id } = req.params;
            const { role } = req.body;

            if (!['admin', 'owner', 'member'].includes(role)) {
                return res.status(400).json({ error: 'Invalid role. Must be admin, owner, or member.' });
            }

            const { data, error } = await this.supabase
                .from('profiles')
                .update({ role })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            res.json(data);
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
