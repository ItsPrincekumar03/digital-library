const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt.config');
const tokenBlacklist = require('../utils/tokenBlacklist');
const userRepository = require('../repositories/user.repository');

// Verifies the JWT from the cookie and attaches req.user.
// Any route using this middleware requires the user to be logged in.
async function requireAuth(req, res, next) {
    try {
        const token = req.cookies ? req.cookies.token : null;

        if (!token) {
            return res.status(401).json({ success: false, message: 'Authentication required.' });
        }

        if (tokenBlacklist.isBlacklisted(token)) {
            return res.status(401).json({ success: false, message: 'Session has been logged out.' });
        }

        const decoded = jwt.verify(token, jwtConfig.secret);
        const user = await userRepository.findById(decoded.userId);

        if (!user || !user.is_active) {
            return res.status(401).json({ success: false, message: 'Account is not available.' });
        }

        req.user = user; // { user_id, full_name, email, is_active, created_at, role_name }
        req.token = token;
        next();
    } catch (err) {
        return res.status(401).json({ success: false, message: 'Invalid or expired session.' });
    }
}

module.exports = requireAuth;