const logger = require('../utils/logger');

// Centralized error handler.
// Any route/controller can call next(err) and it lands here.
function errorHandler(err, req, res, next) {
    logger.error(`Unhandled error on ${req.method} ${req.originalUrl}`, err);

    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal Server Error',
    });
}

module.exports = errorHandler;