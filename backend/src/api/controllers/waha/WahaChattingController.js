class WahaChattingController {
    constructor(wahaClient) {
        this.waha = wahaClient;
    }

    // Main entry point for text messages - uses human latency
    async sendText(req, res) {
        try {
            const { session, chatId, text } = req.body;
            // Enforce human latency for natural behavior as requested
            const result = await this.waha.sendTextWithLatency(session, chatId, text);
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async sendImage(req, res) {
        try {
            const { session, chatId, file, caption } = req.body;
            const result = await this.waha.sendImage(session, chatId, file, caption);
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async sendFile(req, res) {
        try {
            const { session, chatId, file, caption } = req.body;
            const result = await this.waha.sendFile(session, chatId, file, caption);
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async sendVoice(req, res) {
        try {
            const { session, chatId, file } = req.body;
            const result = await this.waha.sendVoice(session, chatId, file);
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async sendVideo(req, res) {
        try {
            const { session, chatId, file, caption } = req.body;
            const result = await this.waha.sendVideo(session, chatId, file, caption);
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async sendLinkPreview(req, res) {
        try {
            const { session, chatId, url, title } = req.body;
            const result = await this.waha.sendLinkPreview(session, chatId, url, title);
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async sendButtons(req, res) {
        try {
            const { session, chatId, title, buttons, footer } = req.body;
            const result = await this.waha.sendButtons(session, chatId, title, buttons, footer);
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async sendList(req, res) {
        try {
            const { session, chatId, title, rows, buttonText } = req.body;
            const result = await this.waha.sendList(session, chatId, title, rows, buttonText);
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async forwardMessage(req, res) {
        try {
            const { session, chatId, messageId } = req.body;
            const result = await this.waha.forwardMessage(session, chatId, messageId);
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async markSeen(req, res) {
        try {
            const { session, chatId } = req.body;
            const result = await this.waha.markSeen(session, chatId);
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async startTyping(req, res) {
        try {
            const { session, chatId } = req.body;
            const result = await this.waha.setPresence(session, chatId, 'composing');
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async stopTyping(req, res) {
        try {
            const { session, chatId } = req.body;
            const result = await this.waha.setPresence(session, chatId, 'paused');
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async sendReaction(req, res) {
        try {
            const { session, chatId, messageId, reaction } = req.body;
            const result = await this.waha.sendReaction(session, chatId, messageId, reaction);
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async sendPoll(req, res) {
        try {
            const { session, chatId, poll } = req.body;
            const result = await this.waha.sendPoll(session, chatId, poll);
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async sendPollVote(req, res) {
        try {
            const { session, chatId, messageId, selectedOptions } = req.body;
            const result = await this.waha.sendPollVote(session, chatId, messageId, selectedOptions);
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async sendLocation(req, res) {
        try {
            const { session, chatId, latitude, longitude, title } = req.body;
            const result = await this.waha.sendLocation(session, chatId, latitude, longitude, title);
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async sendContactVcard(req, res) {
        try {
            const { session, chatId, contacts } = req.body;
            const result = await this.waha.sendContactVcard(session, chatId, contacts);
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async replyButton(req, res) {
        try {
            const { session, chatId, selectedId } = req.body;
            const result = await this.waha.replyButton(session, chatId, selectedId);
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async starMessage(req, res) {
        try {
            const { session, chatId, messageId, star } = req.body;
            const result = await this.waha.starMessage(session, chatId, messageId, star);
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = WahaChattingController;
