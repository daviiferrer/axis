const express = require('express');

module.exports = (chattingController) => {
    const router = express.Router();

    // Text
    router.get('/chats', (req, res) => chattingController.getChats(req, res));
    router.delete('/chats/:session/:chatId', (req, res) => chattingController.deleteChat(req, res)); // Added Delete Route
    router.post('/chats/:session/:chatId/read', (req, res) => chattingController.markAsRead(req, res)); // Mark as Read
    router.get('/messages', (req, res) => chattingController.getMessages(req, res));
    router.get('/chats/:session/:chatId/sentiment', (req, res) => chattingController.getLeadSentiment(req, res));

    // Profile Picture (Proxied)
    router.get('/:session/chats/:chatId/picture', (req, res) => chattingController.getProfilePicture(req, res));

    router.post('/sendText', (req, res) => chattingController.sendText(req, res));
    router.get('/sendText', (req, res) => chattingController.sendText(req, res)); // Requested GET support

    // Rich Media
    router.post('/sendImage', (req, res) => chattingController.sendImage(req, res));
    router.post('/sendFile', (req, res) => chattingController.sendFile(req, res));
    router.post('/sendVoice', (req, res) => chattingController.sendVoice(req, res));
    router.post('/sendVideo', (req, res) => chattingController.sendVideo(req, res));
    router.post('/send/link-custom-preview', (req, res) => chattingController.sendLinkPreview(req, res));

    // Interactive
    router.post('/sendButtons', (req, res) => chattingController.sendButtons(req, res));
    router.post('/sendList', (req, res) => chattingController.sendList(req, res));
    router.post('/sendPoll', (req, res) => chattingController.sendPoll(req, res));
    router.post('/sendPollVote', (req, res) => chattingController.sendPollVote(req, res));
    router.post('/sendLocation', (req, res) => chattingController.sendLocation(req, res));
    router.post('/sendContactVcard', (req, res) => chattingController.sendContactVcard(req, res));
    router.post('/send/buttons/reply', (req, res) => chattingController.replyButton(req, res));

    // Message Actions
    router.post('/forwardMessage', (req, res) => chattingController.forwardMessage(req, res));
    router.post('/sendSeen', (req, res) => chattingController.markSeen(req, res));
    router.put('/reaction', (req, res) => chattingController.sendReaction(req, res));
    router.put('/star', (req, res) => chattingController.starMessage(req, res));

    // Presence
    router.post('/startTyping', (req, res) => chattingController.startTyping(req, res));
    router.post('/stopTyping', (req, res) => chattingController.stopTyping(req, res));
    router.post('/subscribePresence', (req, res) => chattingController.subscribePresence(req, res));

    return router;
};
