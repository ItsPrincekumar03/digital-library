const express = require('express');
const router = express.Router();

const {
    login,
    refreshToken,
    logout
} = require('../controllers/auth.controller');

router.post('/login', login);
router.post('/refresh-token', refreshToken);
router.post('/logout', logout);

module.exports = router;