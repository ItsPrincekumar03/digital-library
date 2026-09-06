const express = require('express');
const router = express.Router();

const profileController = require('../controllers/profile.controller');
const requireAuth = require('../middleware/auth.middleware');
const {
    updateProfileRules,
    changePasswordRules,
    handleValidation,
} = require('../validators/profile.validator');

// Every route here requires the user to be logged in.
// There's no :userId param anywhere — everything acts on req.user.user_id,
// so it's impossible to target another user's account through this router.
router.get('/profile', requireAuth, profileController.getProfile);
router.put('/profile', requireAuth, updateProfileRules, handleValidation, profileController.updateProfile);
router.put('/change-password', requireAuth, changePasswordRules, handleValidation, profileController.changePassword);

module.exports = router;