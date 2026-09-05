// Restricts a route to one or more roles.
// Usage: requireRole('ADMIN')  or  requireRole('ADMIN', 'AUTHOR')
function requireRole(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ success: false, message: 'Authentication required.' });
        }

        if (!allowedRoles.includes(req.user.role_name)) {
            return res.status(403).json({ success: false, message: 'You do not have permission to access this resource.' });
        }

        next();
    };
}

// Convenience: ensures the logged-in user matches a :userId route param,
// unless they're an ADMIN (admins can access any user's resource).
function requireSelfOrAdmin(paramName = 'userId') {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ success: false, message: 'Authentication required.' });
        }

        const requestedId = Number(req.params[paramName]);
        if (req.user.role_name === 'ADMIN' || req.user.user_id === requestedId) {
            return next();
        }

        return res.status(403).json({ success: false, message: 'You cannot access another user\'s resource.' });
    };
}

module.exports = { requireRole, requireSelfOrAdmin };