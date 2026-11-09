const jwt = require('jsonwebtoken');
const authService = require('../services/auth.service');
const tokenBlacklist = require('../utils/tokenBlacklist');

const COOKIE_NAME = 'token';
const COOKIE_OPTIONS = {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000,
    path: '/',
};

async function register(req, res, next) {
    try {
        const { fullName, email, password } = req.body;
        const user = await authService.register({ fullName, email, password });

        res.status(201).json({
            success: true,
            message: 'Registration successful.',
            data: { user },
        });
    } catch (err) {
        next(err);
    }
}

// The token is delivered only as an HttpOnly cookie. It is not included in the
// JSON body, so JavaScript cannot read it.
async function login(req, res, next) {
    try {
        const { email, password } = req.body;
        const { user, token } = await authService.login({ email, password });

        res.cookie(COOKIE_NAME, token, COOKIE_OPTIONS);

        res.status(200).json({
            success: true,
            message: 'Login successful.',
            data: { user },
        });
    } catch (err) {
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

        res.clearCookie(COOKIE_NAME, COOKIE_OPTIONS);
        res.status(200).json({ success: true, message: 'Logged out successfully.' });
    } catch (err) {
        next(err);
    }
}

async function me(req, res) {
    res.status(200).json({ success: true, data: { user: req.user } });
}

module.exports = { register, login, logout, me };