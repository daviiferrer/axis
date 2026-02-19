/**
 * SocketService - Handles real-time communication with clients.
 * Multi-Tenant: Routes events to specific user rooms instead of broadcasting globally.
 */
const logger = require('./Logger').createModuleLogger('socket');

class SocketService {
    constructor() {
        this.io = null;
        // Cache: sessionName -> userId (avoids repeated DB lookups)
        this._sessionUserCache = new Map();
        this._supabase = null;
    }

    initialize(ioInstance, supabase) {
        this.io = ioInstance;
        this._supabase = supabase;
        logger.info('Real-time updates initialized (multi-tenant)');

        this.io.on('connection', (socket) => {
            // Multi-tenant: Client joins their user-specific room
            socket.on('join:user', (userId) => {
                if (!userId) return;
                socket.join(`user:${userId}`);
                logger.debug({ socketId: socket.id, userId }, 'Socket joined user room');
            });
        });
    }

    /**
     * Resolves the user_id for a given sessionName.
     * Uses cache first, then falls back to DB lookup via chats table.
     */
    async resolveUserIdFromSession(sessionName) {
        if (!sessionName) return null;

        // Check cache
        if (this._sessionUserCache.has(sessionName)) {
            return this._sessionUserCache.get(sessionName);
        }

        // DB lookup: try sessions table first (more reliable for new sessions), then chats
        if (this._supabase) {
            try {
                // 1. Sessions table (always has user_id from creation)
                const { data: sessionData } = await this._supabase
                    .from('sessions')
                    .select('user_id')
                    .eq('session_name', sessionName)
                    .not('user_id', 'is', null)
                    .limit(1)
                    .single();

                if (sessionData?.user_id) {
                    this._sessionUserCache.set(sessionName, sessionData.user_id);
                    return sessionData.user_id;
                }
            } catch (err) {
                logger.debug({ sessionName, error: err.message }, 'Could not resolve userId from sessions table');
            }

            try {
                // 2. Fallback: chats table
                const { data } = await this._supabase
                    .from('chats')
                    .select('user_id')
                    .eq('session_name', sessionName)
                    .not('user_id', 'is', null)
                    .limit(1)
                    .single();

                if (data?.user_id) {
                    this._sessionUserCache.set(sessionName, data.user_id);
                    return data.user_id;
                }
            } catch (err) {
                logger.debug({ sessionName, error: err.message }, 'Could not resolve userId from chats table');
            }
        }

        return null;
    }

    /**
     * Emits to a specific user's room. Falls back to broadcast if userId is null.
     */
    emitToUser(userId, event, data) {
        if (!this.io) return;
        if (userId) {
            this.io.to(`user:${userId}`).emit(event, data);
        } else {
            // Fallback: broadcast (for backward compat during transition)
            this.io.emit(event, data);
        }
    }

    /**
     * Smart emit: resolves userId from sessionName, then emits to user room.
     */
    async emitToSession(sessionName, event, data) {
        const userId = await this.resolveUserIdFromSession(sessionName);
        this.emitToUser(userId, event, data);
    }

    /**
     * Global broadcast (use sparingly — only for non-tenant-specific events).
     */
    emit(event, data) {
        if (!this.io) return;
        this.io.emit(event, data);
    }

    /**
     * Emit AI thinking status to a specific user.
     */
    emitThinking(userId, chatId, data) {
        if (!this.io) return;
        this.emitToUser(userId, 'ai.thinking', {
            chatId,
            timestamp: new Date().toISOString(),
            ...data
        });
    }

    emitCampaignUpdate(campaignId, type, data = {}) {
        if (!this.io) return;
        // Campaign events can be broadcast (they'll be replaced with user-scoped later)
        this.io.emit('campaign.event', {
            campaignId,
            type,
            timestamp: new Date().toISOString(),
            ...data
        });
    }

    /**
     * Scoped campaign event — emits only to the user who owns the campaign.
     * Preferred over emitCampaignUpdate for multi-tenant isolation.
     */
    emitCampaignEventToUser(userId, campaignId, type, data = {}) {
        if (!this.io) return;
        this.emitToUser(userId, 'campaign.event', {
            campaignId,
            type,
            timestamp: new Date().toISOString(),
            ...data
        });
    }

    emitLog(campaignId, type, message) {
        if (!this.io) return;
        this.io.emit('campaign.log', {
            campaignId,
            type,
            message,
            timestamp: new Date().toISOString()
        });
    }

    emitLeadUpdate(leadId, data, campaignId) {
        if (!this.io) return;
        this.io.emit('lead.update', {
            leadId,
            campaignId,
            timestamp: new Date().toISOString(),
            ...data
        });
    }

    /**
     * Clears session cache (useful when sessions change ownership).
     */
    clearSessionCache(sessionName) {
        if (sessionName) {
            this._sessionUserCache.delete(sessionName);
        } else {
            this._sessionUserCache.clear();
        }
    }
}

module.exports = new SocketService(); // Singleton
