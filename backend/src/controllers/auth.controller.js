const authService = require('../services/auth.service');
const authRepository = require('../repositories/auth.repository');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Register
async function register(req, res, next) {
    try {
        const { fullName, email, password } = req.body;

        const user = await authService.register({
            fullName,
            email,
            password
        });

        res.status(201).json({
            success: true,
            message: 'Registration successful.',
            data: { user }
        });
    } catch (err) {
        next(err);
    }
}

// Login
async function login(req, res, next) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required.'
            });
        }

        const user = await authRepository.findByEmail(email);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials.'
            });
        }

        const isPasswordValid = await bcrypt.compare(
            password,
            user.password_hash
        );

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials.'
            });
        }

        const accessToken = jwt.sign(
            {
                userId: user.user_id,
                role: user.role_name
            },
            process.env.JWT_SECRET,
            {
                expiresIn: process.env.JWT_EXPIRES_IN || '1h'
            }
        );

        const refreshToken = jwt.sign(
            {
                userId: user.user_id
            },
            process.env.JWT_REFRESH_SECRET,
            {
                expiresIn: '7d'
            }
        );

        await authRepository.saveRefreshToken(
            user.user_id,
            refreshToken
        );

        res.status(200).json({
            success: true,
            message: 'Login successful.',
            data: {
                token: accessToken,
                refreshToken
            }
        });
    } catch (err) {
        next(err);
    }
}

// Refresh access token
async function refreshToken(req, res, next) {
    try {
        const { refreshToken: providedRefreshToken } = req.body;

        if (!providedRefreshToken) {
            return res.status(401).json({
                success: false,
                message: 'Refresh token is required.'
            });
        }

        const decoded = jwt.verify(
            providedRefreshToken,
            process.env.JWT_REFRESH_SECRET
        );

        const user = await authRepository.findById(decoded.userId);

        if (!user || user.refresh_token !== providedRefreshToken) {
            return res.status(401).json({
                success: false,
                message: 'Invalid refresh token.'
            });
        }

        const accessToken = jwt.sign(
            {
                userId: user.user_id,
                role: user.role_name
            },
            process.env.JWT_SECRET,
            {
                expiresIn: process.env.JWT_EXPIRES_IN || '1h'
            }
        );

        res.status(200).json({
            success: true,
            message: 'Token refreshed successfully.',
            data: {
                token: accessToken
            }
        });
    } catch (err) {
        if (
            err.name === 'TokenExpiredError' ||
            err.name === 'JsonWebTokenError'
        ) {
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired refresh token.'
            });
        }

        next(err);
    }
}

// Logout
async function logout(req, res, next) {
    try {
        const { refreshToken: providedRefreshToken } = req.body;

        if (!providedRefreshToken) {
            return res.status(401).json({
                success: false,
                message: 'Refresh token is required.'
            });
        }

        const decoded = jwt.verify(
            providedRefreshToken,
            process.env.JWT_REFRESH_SECRET
        );

        const user = await authRepository.findById(decoded.userId);

        if (!user || user.refresh_token !== providedRefreshToken) {
            return res.status(401).json({
                success: false,
                message: 'Invalid refresh token.'
            });
        }

        await authRepository.saveRefreshToken(
            user.user_id,
            null
        );

        res.status(200).json({
            success: true,
            message: 'Logged out successfully.'
        });
    } catch (err) {
        if (
            err.name === 'TokenExpiredError' ||
            err.name === 'JsonWebTokenError'
        ) {
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired refresh token.'
            });
        }

        next(err);
    }
}

// Get current user
async function me(req, res, next) {
    try {
        res.status(200).json({
            success: true,
            data: {
                user: req.user
            }
        });
    } catch (err) {
        next(err);
    }
}

module.exports = {
    register,
    login,
    refreshToken,
    logout,
    me
};