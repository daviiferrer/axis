class WahaProfileController {
    constructor(wahaClient) {
        this.waha = wahaClient;
    }

    // GET /:session
    async getProfile(req, res) {
        try {
            // Mapping from session me? or contacts me?
            // Assuming getSessionMe is the best fit for "Profile Info"
            const result = await this.waha.getSessionMe(req.params.session);
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async setProfileName(req, res) {
        try {
            const result = await this.waha.setProfileName(req.params.session, req.body.name);
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async setProfileStatus(req, res) {
        try {
            const result = await this.waha.setProfileStatus(req.params.session, req.body.status);
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async setProfilePicture(req, res) {
        try {
            // Expecting file data
            const result = await this.waha.setProfilePicture(req.params.session, req.body.file);
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async deleteProfilePicture(req, res) {
        try {
            const result = await this.waha.deleteProfilePicture(req.params.session);
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = WahaProfileController;
