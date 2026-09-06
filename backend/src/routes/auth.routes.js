const express = require('express');
const router = express.Router();

const authController = require('../controllers/auth.controller');
const requireAuth = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const { authLimiter } = require('../middleware/rateLimiter');
const {
    registerRules,
    loginRules,
    handleValidation,
} = require('../validators/auth.validator');

router.post('/register', authLimiter, registerRules, handleValidation, authController.register);
router.post('/login', authLimiter, loginRules, handleValidation, authController.login);
router.post('/logout', requireAuth, authController.logout);

router.get('/me', requireAuth, authController.me);
router.get('/admin-check', requireAuth, requireRole('ADMIN'), (req, res) => {
    res.status(200).json({ success: true, message: 'Welcome, admin.' });
});

module.exports = router;