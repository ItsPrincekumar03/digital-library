'use strict';

// Module 27 SEC-04 — Authentication audit logging.
//
// Writes auth events to:
//   1. Structured console log (always — no migration required).
//   2. auth_events table (requires migration 021 / migrate.js; gracefully skips if table missing).
//
// NEVER logs: passwords, JWT tokens, cookies, DB credentials, or env secrets.

const { pool } = require('../config/database');
const logger = require('./logger');

function getClientIp(req) {
    if (!req) return null;
    if (process.env.NODE_ENV === 'production' && req.headers && req.headers['x-forwarded-for']) {
        return String(req.headers['x-forwarded-for']).split(',')[0].trim();
    }
    return req.socket?.remoteAddress || null;
}

/**
 * Log an authentication or sensitive account event.
 *
 * @param {'REGISTER_SUCCESS'|'LOGIN_SUCCESS'|'LOGIN_FAILURE'|'LOGOUT'|'PASSWORD_CHANGED'|'PASSWORD_CHANGE_FAILED'} eventType
 * @param {object} options
 * @param {number|null} options.userId   - null for failed logins with unknown user
 * @param {string|null} options.email    - logged only on failure for investigation (no password)
 * @param {string|null} options.ip       - IP address from request
 * @param {string|null} options.userAgent
 * @param {string|null} options.reason   - failure reason (never expose password details)
 */
async function logAuthEvent(eventType, { userId = null, email = null, ip = null, userAgent = null, reason = null } = {}) {
    const logEntry = {
        type: 'AUTH_EVENT',
        event: eventType,
        userId: userId || null,
        ...(eventType === 'LOGIN_FAILURE' && email ? { email: String(email) } : {}),
        ip: ip || null,
        ...(reason ? { reason: String(reason) } : {}),
        ts: new Date().toISOString(),
    };

    if (eventType === 'LOGIN_FAILURE' || eventType === 'PASSWORD_CHANGE_FAILED') {
        logger.error(`[AUTH] ${JSON.stringify(logEntry)}`);
    } else {
        logger.info(`[AUTH] ${JSON.stringify(logEntry)}`);
    }

    try {
        await pool.query(
            `INSERT INTO auth_events (event_type, user_id, ip_address, user_agent)
             VALUES (?, ?, ?, ?)`,
            [
                eventType,
                userId || null,
                ip ? String(ip).slice(0, 45) : null,
                userAgent ? String(userAgent).slice(0, 500) : null,
            ]
        );
    } catch (err) {
        if (err.code === 'ER_NO_SUCH_TABLE') {
            logger.info('[AUTH] auth_events table not yet created — apply migration 021 to enable persistent auth logging.');
        } else {
            logger.error('[AUTH] Failed to write auth_event to database', err);
        }
    }
}

module.exports = { logAuthEvent, getClientIp };
