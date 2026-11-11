'use strict';

// Module 27 SEC-01 — Cross-Site Request Forgery (CSRF) Protection.
//
// Defense-in-depth for cookie-authenticated state-changing endpoints:
//   1. Origin / Referer validation against the CORS allowlist on every
//      state-changing request (blocks untrusted cross-origin simple forms and
//      fetch calls before route handlers or Multer execute).
//   2. User-bound HMAC double-submit CSRF token validation for cookie-based
//      sessions (`csrf_token` cookie + `X-CSRF-Token` header, compared via
//      crypto.timingSafeEqual and bound to `userId` with HMAC-SHA256).
//
// Exemptions:
//   - Safe/idempotent HTTP methods (GET, HEAD, OPTIONS).
//   - Explicit `Authorization: Bearer <jwt>` requests (browsers do not attach
//     custom Authorization headers automatically on cross-site requests).
//   - Bootstrap unauthenticated auth endpoints (/api/auth/login, /api/auth/register)
//     for the double-submit token check (Origin/Referer validation still applies).

const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt.config');
const { isOriginAllowed } = require('../config/cors.config');

const CSRF_COOKIE_NAME = 'csrf_token';
const CSRF_HEADER_NAME = 'x-csrf-token';
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const TOKEN_SKIP_PATHS = new Set(['/api/auth/login', '/api/auth/register']);

function getCsrfCookieOptions() {
    const isProduction = process.env.NODE_ENV === 'production';
    return {
        httpOnly: false, // Readable by same-site JS; JSON body/header also returns token
        sameSite: 'lax',
        secure: isProduction,
        maxAge: 24 * 60 * 60 * 1000,
        path: '/',
    };
}

function signCsrfNonce(userId, nonce) {
    const secret = jwtConfig.secret;
    if (!secret) {
        throw new Error('JWT_SECRET must be configured to sign CSRF tokens.');
    }
    return crypto
        .createHmac('sha256', secret)
        .update(`csrf:${String(userId)}:${String(nonce)}`)
        .digest('hex');
}

function generateCsrfToken(userId) {
    const nonce = crypto.randomBytes(16).toString('hex');
    const sig = signCsrfNonce(userId, nonce);
    return `${nonce}.${sig}`;
}

function timingSafeStringEqual(a, b) {
    if (typeof a !== 'string' || typeof b !== 'string') {
        return false;
    }
    const bufA = Buffer.from(a, 'utf8');
    const bufB = Buffer.from(b, 'utf8');
    if (bufA.length === 0 || bufA.length !== bufB.length) {
        return false;
    }
    return crypto.timingSafeEqual(bufA, bufB);
}

function isValidSignedCsrfToken(token, userId) {
    if (typeof token !== 'string') {
        return false;
    }
    const parts = token.split('.');
    if (parts.length !== 2) {
        return false;
    }
    const [nonce, providedSig] = parts;
    if (!/^[0-9a-f]{32}$/i.test(nonce) || !/^[0-9a-f]{64}$/i.test(providedSig)) {
        return false;
    }
    try {
        const expectedSig = signCsrfNonce(userId, nonce);
        return timingSafeStringEqual(providedSig, expectedSig);
    } catch (_) {
        return false;
    }
}

function extractRefererOrigin(refererHeader) {
    if (!refererHeader || typeof refererHeader !== 'string') {
        return null;
    }
    try {
        return new URL(refererHeader).origin;
    } catch (_) {
        return 'invalid';
    }
}

function hasBearerAuthorization(req) {
    const authHeader = req.headers.authorization;
    return typeof authHeader === 'string' && /^Bearer\s+\S+/i.test(authHeader.trim());
}

function csrfProtection(req, res, next) {
    if (SAFE_METHODS.has(req.method)) {
        return next();
    }

    // 1. Always reject untrusted cross-origin / referer state-changing requests.
    const originHeader = req.headers.origin;
    if (originHeader !== undefined) {
        if (!isOriginAllowed(originHeader)) {
            return res.status(403).json({
                success: false,
                code: 'CSRF_ORIGIN_FORBIDDEN',
                message: 'Untrusted cross-origin request rejected.',
            });
        }
    } else if (req.headers.referer) {
        const refererOrigin = extractRefererOrigin(req.headers.referer);
        if (!isOriginAllowed(refererOrigin)) {
            return res.status(403).json({
                success: false,
                code: 'CSRF_ORIGIN_FORBIDDEN',
                message: 'Untrusted cross-origin request rejected.',
            });
        }
    }

    // 2. Requests authenticating via explicit Bearer header are not vulnerable
    //    to automatic browser cookie attachment.
    if (hasBearerAuthorization(req)) {
        return next();
    }

    // 3. Login / registration establish a session and have no prior cookie
    //    session requirement.
    const requestPath = (req.originalUrl || req.url || '').split('?')[0];
    if (TOKEN_SKIP_PATHS.has(requestPath)) {
        return next();
    }

    // 4. Require double-submit CSRF token on cookie-authenticated mutations.
    const sessionCookie = req.cookies ? req.cookies.token : null;
    if (!sessionCookie) {
        // Unauthenticated requests are rejected by requireAuth (401).
        return next();
    }

    const cookieToken = req.cookies ? req.cookies[CSRF_COOKIE_NAME] : null;
    const headerToken = req.headers[CSRF_HEADER_NAME];

    if (!cookieToken || !headerToken) {
        return res.status(403).json({
            success: false,
            code: 'CSRF_TOKEN_MISSING',
            message: 'CSRF token is required.',
        });
    }

    if (!timingSafeStringEqual(String(cookieToken), String(headerToken))) {
        return res.status(403).json({
            success: false,
            code: 'CSRF_TOKEN_INVALID',
            message: 'Invalid CSRF token.',
        });
    }

    // Verify HMAC binding to the JWT userId when the session token is valid.
    try {
        const decoded = jwt.verify(sessionCookie, jwtConfig.secret);
        if (!isValidSignedCsrfToken(String(headerToken), decoded.userId)) {
            return res.status(403).json({
                success: false,
                code: 'CSRF_TOKEN_INVALID',
                message: 'Invalid CSRF token.',
            });
        }
    } catch (_) {
        // Expired or invalid JWT will be rejected with 401 by requireAuth.
        return next();
    }

    return next();
}

module.exports = {
    CSRF_COOKIE_NAME,
    CSRF_HEADER_NAME,
    getCsrfCookieOptions,
    generateCsrfToken,
    isValidSignedCsrfToken,
    csrfProtection,
};
