const rateLimit = require('express-rate-limit');

const isProd = process.env.NODE_ENV === 'production';

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: isProd ? 10 : 1000,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many attempts from this IP. Please try again later.',
    },
});

const passwordLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: isProd ? 5 : 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many password attempts from this IP. Please try again later.',
    },
});

module.exports = { authLimiter, passwordLimiter };