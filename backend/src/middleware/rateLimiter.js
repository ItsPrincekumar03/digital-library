const rateLimit = require('express-rate-limit');

const isProd = process.env.NODE_ENV === 'production';

// Applied to login and registration endpoints.
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

// Applied to password-change endpoint.
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

// Module 27 (SEC-03) — Applied to file upload endpoints (private and public).
// Prevents automated bulk-upload abuse. Limits are relaxed in development so
// the test suite can upload without being throttled.
const uploadLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: isProd ? 20 : 500,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many upload attempts from this IP. Please try again later.',
    },
});

module.exports = { authLimiter, passwordLimiter, uploadLimiter };
