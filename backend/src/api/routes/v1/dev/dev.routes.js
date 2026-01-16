const express = require('express');

function createDevRouter(workflowEngine, chatService) {
    const router = express.Router();

    router.post('/simulate', async (req, res) => {
        try {
            const { action, chatId, payload } = req.body;
            // Simplified simulation logic delegating to engines
            console.log(`[Dev] Simulating ${action} for ${chatId}`);

            if (action === 'thinking') {
                workflowEngine.socketService.emitThinking(chatId, payload.isThinking, payload.thought);
                return res.json({ success: true });
            }

            if (action === 'message') {
                const { text, session = 'SIMULATOR' } = payload;
                const normalizeChatId = chatId.includes('@') ? chatId : `${chatId}@s.whatsapp.net`;

                // Construct Waha-like Payload
                const wahaPayload = {
                    from: normalizeChatId,
                    to: 'me',
                    body: text,
                    fromMe: false,
                    id: `false_${normalizeChatId}_${Date.now()}_SIM`,
                    _data: {
                        notifyName: 'Simulated User'
                    },
                    timestamp: Math.floor(Date.now() / 1000)
                };

                // 1. Process as Incoming Message (Persistence)
                await chatService.processIncomingMessage(wahaPayload, session);

                // 2. Trigger AI Workflow
                // use setImmediate to not block the response? No, we want to know if it failed.
                await workflowEngine.triggerAiForLead(normalizeChatId, text, null);

                // 3. Emit socket event for frontend update (if needed, but polling handles it)

                return res.json({ success: true, message: 'Message injected and AI triggered' });
            }
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    return router;
}

module.exports = createDevRouter;
