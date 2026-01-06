/**
 * SocketService - Handles real-time communication with clients.
 */
class SocketService {
    constructor() {
        this.io = null;
    }

    initialize(ioInstance) {
        this.io = ioInstance;
        console.log('[SocketService] Real-time updates initialized.');

        this.io.on('connection', (socket) => {
            // Simple room join logic for user (assuming client sends userId on join or auth middleware handles it)
            // For now, trusting client to join room 'user:ID'
            socket.on('join:user', (userId) => {
                socket.join(`user:${userId}`);
                console.log(`Socket ${socket.id} joined user:${userId}`);
            });
        });
    }

    emitToUser(userId, event, data) {
        if (!this.io) return;
        this.io.to(`user:${userId}`).emit(event, data);
    }

    emitCampaignUpdate(campaignId, type, data = {}) {
        if (!this.io) return;
        this.io.emit('campaign.event', {
            campaignId,
            type,
            timestamp: new Date().toISOString(),
            ...data
        });
    }

    emit(event, data) {
        if (!this.io) return;
        this.io.emit(event, data);
    }

    emitThinking(chatId, data) {
        if (!this.io) return;
        this.io.emit('ai.thinking', {
            chatId,
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
}

module.exports = new SocketService(); // Singleton
