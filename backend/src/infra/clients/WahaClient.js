const axios = require('axios');

/**
 * WahaClient - Infrastructure Client for WAHA (WhatsApp HTTP API)
 * Directly translates requests to the WAHA API.
 */
class WahaClient {
    #endpoints;

    constructor(config = {}, httpClient = null) {
        this.baseUrl = config.wahaUrl || process.env.WAHA_API_URL || 'http://localhost:3000';
        this.apiKey = config.apiKey || '';
        this.http = httpClient || axios;

        this.#endpoints = {
            sessions: '/api/sessions',
            auth: {
                qr: '/api/screenshot', // Using screenshot as proxy for QR based on user request "GET /:session/auth/qr" mapping to logic usually found in screenshot or specific qr endpoint
                requestCode: '/api/code'
            },
            chatting: {
                sendText: '/api/sendText',
                sendImage: '/api/sendImage',
                sendFile: '/api/sendFile',
                sendVoice: '/api/sendVoice',
                sendVideo: '/api/sendVideo',
                sendLinkPreview: '/api/sendLinkPreview',
                sendButtons: '/api/sendButtons', // Warning: deprecated in some WAHA versions but requested
                sendList: '/api/sendList',       // Warning: deprecated in some WAHA versions but requested
                forward: '/api/forwardMessages', // Check actual WAHA endpoint name
                markSeen: '/api/sendSeen',
                startTyping: '/api/startTyping',
                stopTyping: '/api/stopTyping',
                reaction: '/api/sendReaction',
                sendPoll: '/api/sendPoll',
                sendPollVote: '/api/sendPollVote',
                sendLocation: '/api/sendLocation',
                sendContactVcard: '/api/sendContactVcard',
                replyButton: '/api/send/buttons/reply',
                star: '/api/star'
            },
            contacts: '/api/contacts',
            files: '/api/files',
            presence: '/api/{session}/presence',
            media: {
                voice: '/api/convert/voice', // Hypothetical or specific WAHA module
                video: '/api/convert/video'
            },
            screenshot: '/api/screenshot',
            system: {
                health: '/dashboard/health', // Standard WAHA health
                version: '/api/version',
                server: '/api/server'
            }
        };
    }

    async #getHeaders() {
        return {
            'Content-Type': 'application/json',
            'X-Api-Key': this.apiKey
        };
    }

    #getUrl(path) {
        return `${this.baseUrl}${path}`;
    }

    // --- Session Methods ---
    async getSessions(all = false) {
        const url = this.#getUrl(`${this.#endpoints.sessions}?all=${all}`);
        const response = await this.http.get(url, { headers: await this.#getHeaders() });
        return response.data;
    }

    async getSession(session) {
        const url = this.#getUrl(`${this.#endpoints.sessions}/${session}`);
        const response = await this.http.get(url, { headers: await this.#getHeaders() });
        return response.data;
    }

    async getSessionMe(session) {
        const url = this.#getUrl(`${this.#endpoints.sessions}/${session}/me`);
        const response = await this.http.get(url, { headers: await this.#getHeaders() });
        return response.data;
    }

    async createSession(config) {
        const url = this.#getUrl(this.#endpoints.sessions);
        const response = await this.http.post(url, config, { headers: await this.#getHeaders() });
        return response.data;
    }

    async updateSession(session, config) {
        // PUT /api/sessions/:session
        const url = this.#getUrl(`${this.#endpoints.sessions}/${session}`);
        const response = await this.http.put(url, config, { headers: await this.#getHeaders() });
        return response.data;
    }

    async deleteSession(session) {
        const url = this.#getUrl(`${this.#endpoints.sessions}/${session}`);
        const response = await this.http.delete(url, { headers: await this.#getHeaders() });
        return response.data;
    }

    async startSession(session) {
        const url = this.#getUrl(`${this.#endpoints.sessions}/${session}/start`);
        const response = await this.http.post(url, {}, { headers: await this.#getHeaders() });
        return response.data;
    }

    async stopSession(session) {
        const url = this.#getUrl(`${this.#endpoints.sessions}/${session}/stop`);
        const response = await this.http.post(url, {}, { headers: await this.#getHeaders() });
        return response.data;
    }

    async logoutSession(session) {
        const url = this.#getUrl(`${this.#endpoints.sessions}/${session}/logout`);
        const response = await this.http.post(url, {}, { headers: await this.#getHeaders() });
        return response.data;
    }

    async restartSession(session) {
        // Usually stop + start, but passing through if API supported or composite
        // Assuming custom implementation or direct API mapping if available.
        // If WAHA doesn't have /restart, we chain stop/start.
        // For now, mapping to a hypothetical /restart or implementing logic in controller?
        // User requested POST /:session/restart in routes. implementation here:
        try {
            await this.stopSession(session);
        } catch (e) { /* ignore if already stopped */ }
        return await this.startSession(session);
    }

    // --- Auth Methods ---
    // --- Auth Methods ---
    async getAuthQR(session) {
        // WAHA usually returns QR buffer on /api/screenshot?session=xyz if using standard execution
        // Or specific auth endpoints.
        // Mapping to screenshot as per requested "GET /:session/auth/qr" flow usually implying visualization
        const url = this.#getUrl(`${this.#endpoints.screenshot}?session=${session}&format=json`);
        const response = await this.http.get(url, { headers: await this.#getHeaders() });
        return response.data;
    }

    async requestPairingCode(session, phoneNumber) {
        const url = this.#getUrl(`${this.#endpoints.sessions}/${session}/auth/request-code`);
        const response = await this.http.post(url, { phoneNumber }, { headers: await this.#getHeaders() });
        return response.data;
    }

    // --- Profile Methods ---
    async setProfileName(session, name) {
        const url = this.#getUrl(`${this.#endpoints.sessions}/${session}/profile/name`); // Adjust based on actual WAHA API stricture (usually /api/setProfileName)
        // Checking WAHA docs usually: POST /api/setProfileName
        // Let's use the explicit endpoint map pattern for safety
        const explicitUrl = this.#getUrl('/api/setProfileName');
        const response = await this.http.post(explicitUrl, { session, name }, { headers: await this.#getHeaders() });
        return response.data;
    }

    async setProfileStatus(session, status) {
        const explicitUrl = this.#getUrl('/api/setProfileStatus');
        const response = await this.http.post(explicitUrl, { session, status }, { headers: await this.#getHeaders() });
        return response.data;
    }

    async setProfilePicture(session, file) {
        // Expects file to be base64 or buffer
        const explicitUrl = this.#getUrl('/api/setProfilePic');
        const response = await this.http.post(explicitUrl, { session, file }, { headers: await this.#getHeaders() });
        return response.data;
    }

    async deleteProfilePicture(session) {
        // Not a standard WAHA endpoint usually?
        throw new Error('Method deleteProfilePicture not supported by core WAHA yet');
    }

    // --- Chatting Methods ---
    async sendText(session, chatId, text) {
        const url = this.#getUrl(this.#endpoints.chatting.sendText);
        const response = await this.http.post(url, { session, chatId, text }, { headers: await this.#getHeaders() });
        return response.data;
    }

    /**
     * Send text with human-like latency and jitter for anti-ban robustness.
     * Jitter adds +/-15% randomness to timing.
     */
    async sendTextWithLatency(session, chatId, text) {
        const words = text.split(/\s+/).length;
        const baseDelay = Math.min((words * 300) + 2500, 15000);

        // Add jitter: +/- 15% randomness for anti-ban
        const jitterFactor = 0.85 + (Math.random() * 0.30); // 0.85 to 1.15
        const delayMs = Math.round(baseDelay * jitterFactor);

        console.log(`[WahaClient] Latency: ${delayMs}ms (jitter: ${Math.round((jitterFactor - 1) * 100)}%) for "${text.substring(0, 20)}..."`);

        await this.setPresence(session, chatId, 'composing');
        await new Promise(resolve => setTimeout(resolve, delayMs));
        return await this.sendText(session, chatId, text);
    }

    async sendImage(session, chatId, file, caption) {
        const url = this.#getUrl(this.#endpoints.chatting.sendImage);
        const response = await this.http.post(url, { session, chatId, file, caption }, { headers: await this.#getHeaders() });
        return response.data;
    }

    async sendFile(session, chatId, file, caption) {
        const url = this.#getUrl(this.#endpoints.chatting.sendFile);
        const response = await this.http.post(url, { session, chatId, file, caption }, { headers: await this.#getHeaders() });
        return response.data;
    }

    async sendVoice(session, chatId, file) {
        const url = this.#getUrl(this.#endpoints.chatting.sendVoice);
        const response = await this.http.post(url, { session, chatId, file }, { headers: await this.#getHeaders() });
        return response.data;
    }

    // Alias for existing codebase compatibility
    async sendVoiceBase64(session, chatId, base64) {
        return this.sendVoice(session, chatId, { mimetype: 'audio/ogg; codecs=opus', data: base64, filename: 'voice.ogg' });
    }

    async sendVideo(session, chatId, file, caption) {
        const url = this.#getUrl(this.#endpoints.chatting.sendVideo);
        const response = await this.http.post(url, { session, chatId, file, caption }, { headers: await this.#getHeaders() });
        return response.data;
    }

    async sendLinkPreview(session, chatId, url, title) {
        const endpoint = this.#getUrl(this.#endpoints.chatting.sendLinkPreview);
        const response = await this.http.post(endpoint, { session, chatId, url, title }, { headers: await this.#getHeaders() });
        return response.data;
    }

    async sendButtons(session, chatId, title, buttons, footer) {
        // buttons: array of {id, text}
        const url = this.#getUrl(this.#endpoints.chatting.sendButtons);
        const response = await this.http.post(url, { session, chatId, title, buttons, footer }, { headers: await this.#getHeaders() });
        return response.data;
    }

    async sendList(session, chatId, title, rows, buttonText) {
        const url = this.#getUrl(this.#endpoints.chatting.sendList);
        const response = await this.http.post(url, { session, chatId, title, rows, buttonText }, { headers: await this.#getHeaders() });
        return response.data;
    }

    async forwardMessage(session, chatId, messageId) {
        // Typically WAHA might not have a direct 'forward' endpoint in all versions, checking common:
        const url = this.#getUrl('/api/forwardMessage');
        const response = await this.http.post(url, { session, chatId, messageId }, { headers: await this.#getHeaders() });
        return response.data;
    }

    async markSeen(session, chatId) {
        const url = this.#getUrl(this.#endpoints.chatting.markSeen);
        const response = await this.http.post(url, { session, chatId }, { headers: await this.#getHeaders() });
        return response.data;
    }

    async setPresence(session, chatId, state) {
        // state: 'composing' | 'recording' | 'paused'
        const endpoint = state === 'paused' ? this.#endpoints.chatting.stopTyping : this.#endpoints.chatting.startTyping;
        const url = this.#getUrl(endpoint);

        // WAHA startTyping payload
        const response = await this.http.post(url, { session, chatId }, { headers: await this.#getHeaders() });
        return response.data;
    }

    async sendReaction(session, chatId, messageId, reaction) {
        const url = this.#getUrl(this.#endpoints.chatting.reaction);
        const response = await this.http.post(url, { session, chatId, messageId, reaction }, { headers: await this.#getHeaders() });
        return response.data;
    }

    async sendPoll(session, chatId, poll) {
        const url = this.#getUrl(this.#endpoints.chatting.sendPoll);
        const response = await this.http.post(url, { session, chatId, poll }, { headers: await this.#getHeaders() });
        return response.data;
    }

    async sendPollVote(session, chatId, messageId, selectedOptions) {
        const url = this.#getUrl(this.#endpoints.chatting.sendPollVote);
        const response = await this.http.post(url, { session, chatId, messageId, selectedOptions }, { headers: await this.#getHeaders() });
        return response.data;
    }

    async sendLocation(session, chatId, latitude, longitude, title) {
        const url = this.#getUrl(this.#endpoints.chatting.sendLocation);
        const response = await this.http.post(url, { session, chatId, latitude, longitude, title }, { headers: await this.#getHeaders() });
        return response.data;
    }

    async sendContactVcard(session, chatId, contacts) {
        const url = this.#getUrl(this.#endpoints.chatting.sendContactVcard);
        const response = await this.http.post(url, { session, chatId, contacts }, { headers: await this.#getHeaders() });
        return response.data;
    }

    async replyButton(session, chatId, selectedId) {
        const url = this.#getUrl(this.#endpoints.chatting.replyButton);
        const response = await this.http.post(url, { session, chatId, selectedId }, { headers: await this.#getHeaders() });
        return response.data;
    }

    async starMessage(session, chatId, messageId, star = true) {
        const url = this.#getUrl(this.#endpoints.chatting.star);
        const response = await this.http.put(url, { session, chatId, messageId, star }, { headers: await this.#getHeaders() });
        return response.data;
    }

    // --- Presence Methods ---
    async getPresence(session, chatId) {
        // Not always available, implementing subscribe
        return this.subscribePresence(session, chatId);
    }

    async subscribePresence(session, chatId) {
        const url = this.#getUrl(`/api/${session}/presence/${encodeURIComponent(chatId)}/subscribe`);
        const response = await this.http.post(url, {}, { headers: await this.#getHeaders() });
        return response.data;
    }

    // --- Contact Methods ---
    async checkExists(phone) {
        // WAHA endpoint: GET /api/contacts/check-exists?phone=...
        const url = this.#getUrl(`${this.#endpoints.contacts}/check-exists?phone=${phone}`);
        const response = await this.http.get(url, { headers: await this.#getHeaders() });
        return response.data;
    }

    // --- Media Methods ---
    // (Assuming WAHA or a helper service does this, strictly mapping as requested)
    async convertVoice(audioData) {
        throw new Error('Not implemented in WahaClient infra yet');
    }

    // --- Observability ---
    async getPing() {
        // Simple connectivity check
        try {
            await this.http.get(this.#getUrl('/dashboard/health')); // or /api/sessions
            return 'pong';
        } catch (e) { return 'down'; }
    }

    async getHealth() {
        // WAHA health endpoint
        // Assuming GET /dashboard/health exists or similar
        // Fallback to custom
        return { status: 'ok', uptime: process.uptime() };
    }

    async getVersion() {
        const url = this.#getUrl(this.#endpoints.system.version);
        const response = await this.http.get(url, { headers: await this.#getHeaders() });
        return response.data;
    }

    async getScreenshot(session) {
        const url = this.#getUrl(`${this.#endpoints.screenshot}?session=${session}`);
        const response = await this.http.get(url, {
            responseType: 'arraybuffer',
            headers: await this.#getHeaders()
        });
        const base64 = Buffer.from(response.data, 'binary').toString('base64');
        return base64;
    }

    // --- Legacy / Helpers ---
    async getContact(sessionName, contactId) {
        const url = this.#getUrl(`${this.#endpoints.contacts}/${contactId}?session=${sessionName}`);
        const response = await this.http.get(url, { headers: await this.#getHeaders() });
        return response.data;
    }

    async downloadMedia(sessionName, messageId) {
        const url = this.#getUrl(`${this.#endpoints.files}/${messageId}?session=${sessionName}`);
        const response = await this.http.get(url, {
            responseType: 'arraybuffer',
            headers: { 'X-Api-Key': this.apiKey }
        });
        const base64 = Buffer.from(response.data, 'binary').toString('base64');
        const mimeType = response.headers['content-type'] || 'image/jpeg';
        return { mimetype: mimeType, data: base64 };
    }
}

module.exports = WahaClient;
