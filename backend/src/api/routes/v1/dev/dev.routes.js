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
                // Logic to inject fake message
                res.json({ success: true, message: 'Message injected' });
            }
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    return router;
}

module.exports = createDevRouter;
