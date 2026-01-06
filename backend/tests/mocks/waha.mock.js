class WahaClientMock {
    constructor(url) {
        this.url = url;
    }

    async getSessions() {
        return [{ name: 'default', status: 'CONNECTED' }];
    }

    async sendText(session, chatId, text) {
        return { id: 'msg_123', status: 'SENT' };
    }

    async setPresence(session, chatId, status) {
        return { success: true };
    }
}

module.exports = WahaClientMock;
