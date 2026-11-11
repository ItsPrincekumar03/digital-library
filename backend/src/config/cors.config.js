'use strict';

// Shared CORS & Origin allowlist helper (used by app.js CORS middleware and
// csrf.middleware.js Origin/Referer validation).

function getAllowedOrigins() {
    const isProduction = process.env.NODE_ENV === 'production';
    const allowedOrigins = isProduction
        ? []
        : [
            'http://localhost:3000',
            'http://127.0.0.1:3000',
        ];

    if (process.env.CORS_ORIGIN) {
        const origins = process.env.CORS_ORIGIN.split(',');
        for (const raw of origins) {
            const configuredOrigin = raw.trim();
            if (configuredOrigin && !allowedOrigins.includes(configuredOrigin)) {
                allowedOrigins.push(configuredOrigin);
            }
        }
    }

    return allowedOrigins;
}

function isOriginAllowed(origin) {
    if (!origin || typeof origin !== 'string') {
        return false;
    }

    const isProduction = process.env.NODE_ENV === 'production';
    const allowedOrigins = getAllowedOrigins();

    if (allowedOrigins.includes(origin)) {
        return true;
    }

    // Development may use other localhost ports (e.g., ephemeral test ports).
    if (!isProduction) {
        try {
            const url = new URL(origin);
            if (
                (url.protocol === 'http:' || url.protocol === 'https:') &&
                (url.hostname === 'localhost' || url.hostname === '127.0.0.1')
            ) {
                return true;
            }
        } catch (_) {
            return false;
        }
    }

    return false;
}

module.exports = { getAllowedOrigins, isOriginAllowed };
