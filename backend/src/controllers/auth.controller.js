const authService = require('../services/auth.service');
const tokenBlacklist = require('../utils/tokenBlacklist');

const COOKIE_NAME = 'token';
const COOKIE_OPTIONS = {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000,
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

async function logout(req, res) {
    const token = req.cookies ? req.cookies[COOKIE_NAME] : null;
    if (token) {
        tokenBlacklist.add(token);
    }
    res.clearCookie(COOKIE_NAME, COOKIE_OPTIONS);
    res.status(200).json({ success: true, message: 'Logged out successfully.' });
}

async function me(req, res) {
    res.status(200).json({ success: true, data: { user: req.user } });
}

module.exports = { register, login, logout, me };