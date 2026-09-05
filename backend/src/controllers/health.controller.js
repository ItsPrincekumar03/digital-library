const { testConnection } = require('../config/database');

// GET /api/health
async function getHealth(req, res) {
    res.status(200).json({ success: true, message: 'Server is running.' });
}

// GET /api/health/db
async function getDbHealth(req, res, next) {
    try {
        const result = await testConnection();
        if (result.success) {
            return res.status(200).json(result);
        }
        // Connection failed but request itself didn't throw — return 503
        return res.status(503).json(result);
    } catch (err) {
        next(err); // let the central error handler deal with unexpected errors
    }
}

module.exports = { getHealth, getDbHealth };