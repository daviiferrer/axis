const express = require('express');

module.exports = (profileController) => {
    const router = express.Router();

    // GET /:session (Profile Info)
    router.get('/:session', (req, res) => profileController.getProfile(req, res));

    // PUT /:session/name
    router.put('/:session/name', (req, res) => profileController.setProfileName(req, res));

    // PUT /:session/status
    router.put('/:session/status', (req, res) => profileController.setProfileStatus(req, res));

    // PUT /:session/picture
    router.put('/:session/picture', (req, res) => profileController.setProfilePicture(req, res));

    // DELETE /:session/picture
    router.delete('/:session/picture', (req, res) => profileController.deleteProfilePicture(req, res));

    return router;
};
