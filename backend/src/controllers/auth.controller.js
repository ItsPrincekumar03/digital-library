const jwt = require('jsonwebtoken');
const authService = require('../services/auth.service');
const tokenBlacklist = require('../utils/tokenBlacklist');
const { logAuthEvent, getClientIp } = require('../utils/authAudit');
const {
    CSRF_COOKIE_NAME,
    getCsrfCookieOptions,
    generateCsrfToken,
    isValidSignedCsrfToken,
} = require('../middleware/csrf.middleware');

const COOKIE_NAME = 'token';

function getAuthCookieOptions() {
    return {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000,
        path: '/',
    };
}

function issueCsrfToken(req, res, userId) {
    const existing = req.cookies ? req.cookies[CSRF_COOKIE_NAME] : null;
    const token = existing && isValidSignedCsrfToken(existing, userId)
        ? existing
        : generateCsrfToken(userId);

    res.cookie(CSRF_COOKIE_NAME, token, getCsrfCookieOptions());
    res.setHeader('X-CSRF-Token', token);
    return token;
}

async function register(req, res, next) {
    try {
        const { fullName, email, password } = req.body;
        const user = await authService.register({ fullName, email, password });

        await logAuthEvent('REGISTER_SUCCESS', {
            userId: user.user_id,
            ip: getClientIp(req),
            userAgent: req.headers['user-agent'] || null,
        });

        res.status(201).json({
            success: true,
            message: 'Registration successful.',
            data: { user },
        });
    } catch (err) {
        next(err);
    }
}

// The session token is delivered only as an HttpOnly cookie. It is not included
// in the JSON body, so JavaScript cannot read the JWT.
async function login(req, res, next) {
    try {
        const { email, password } = req.body;
        const { user, token } = await authService.login({ email, password });

        res.cookie(COOKIE_NAME, token, getAuthCookieOptions());
        const csrfToken = generateCsrfToken(user.user_id);
        res.cookie(CSRF_COOKIE_NAME, csrfToken, getCsrfCookieOptions());
        res.setHeader('X-CSRF-Token', csrfToken);

        // SEC-04: log successful login (no password, no JWT)
        await logAuthEvent('LOGIN_SUCCESS', {
            userId: user.user_id,
            ip: getClientIp(req),
            userAgent: req.headers['user-agent'] || null,
        });

        res.status(200).json({
            success: true,
            message: 'Login successful.',
            data: { user, csrfToken },
        });
    } catch (err) {
        // SEC-04: log failed login attempt (email only, no password)
        if (err.status === 401 || err.status === 403) {
            await logAuthEvent('LOGIN_FAILURE', {
                userId: null,
                email: req.body?.email || null,
                ip: getClientIp(req),
                userAgent: req.headers['user-agent'] || null,
                reason: err.message,
            }).catch(() => {});
        }
        next(err);
    }
}

// Logout revokes the token in the database (see tokenBlacklist.js), so the
// token is rejected even after a server restart. It is only reachable through
// requireAuth, so req.user and req.token are always present here.
async function logout(req, res, next) {
    try {
        const token = req.token || (req.cookies ? req.cookies[COOKIE_NAME] : null);

        if (token) {
            const decoded = jwt.decode(token);

            if (decoded && decoded.exp) {
                await tokenBlacklist.revoke(
                    token,
                    req.user ? req.user.user_id : null,
                    new Date(decoded.exp * 1000)
                );
            }

            await tokenBlacklist.purgeExpired();
        }

        // SEC-04: log logout event (no JWT logged)
        await logAuthEvent('LOGOUT', {
            userId: req.user ? req.user.user_id : null,
            ip: getClientIp(req),
            userAgent: req.headers['user-agent'] || null,
        });

        res.clearCookie(COOKIE_NAME, getAuthCookieOptions());
        res.clearCookie(CSRF_COOKIE_NAME, getCsrfCookieOptions());
        res.status(200).json({ success: true, message: 'Logged out successfully.' });
    } catch (err) {
        next(err);
    }
}

async function me(req, res) {
    const csrfToken = issueCsrfToken(req, res, req.user.user_id);
    res.status(200).json({ success: true, data: { user: req.user, csrfToken } });
}

async function csrfToken(req, res) {
    const token = issueCsrfToken(req, res, req.user.user_id);
    res.status(200).json({ success: true, data: { csrfToken: token } });
}

module.exports = { register, login, logout, me, csrfToken };
