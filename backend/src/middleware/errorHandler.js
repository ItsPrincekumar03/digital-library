const logger = require('../utils/logger');

function errorHandler(err, req, res, next) {
    const status = err.status || 500;

    if (status >= 500) {
        logger.error(
            `Unhandled error on ${req.method} ${req.originalUrl}`,
            err
        );
    } else {
        logger.info(
            `Handled error (${status}) on ${req.method} ${req.originalUrl}: ${err.message}`
        );
    }

    const body = {
        success: false,
        message:
            status >= 500 && !err.expose
                ? 'An unexpected server error occurred.'
                : err.message,
    };

    if (err.code) {
        body.code = err.code;
    } else if (status >= 500) {
        body.code = 'SERVER_ERROR';
    }

    res.status(status).json(body);
}

module.exports = errorHandler;