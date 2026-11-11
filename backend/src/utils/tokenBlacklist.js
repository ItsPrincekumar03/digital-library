// Persistent token revocation backed by the revoked_tokens table (migration 020).
// Only a SHA-256 hash of each token is stored, so a database leak does not reveal
// usable tokens. A logged-out token stays rejected across server restarts until
// its natural expiry time.

const crypto = require('crypto');
const { pool } = require('../config/database');
const logger = require('./logger');

// Emergency in-memory fallback used ONLY if revoked_tokens table is missing
// (e.g., an un-migrated local database), so login/auth never silently breaks.
const fallbackRevoked = new Map();
let warnedMissingTable = false;

function warnMissingTableOnce() {
    if (!warnedMissingTable) {
        warnedMissingTable = true;
        logger.error(
            '[AUTH] revoked_tokens table is missing; using temporary in-memory revocation fallback. Apply database/migrations/020_create_revoked_tokens.sql.'
        );
    }
}

function hashToken(token) {
    return crypto.createHash('sha256').update(String(token)).digest('hex');
}

// Records a revoked token. INSERT IGNORE makes repeated logouts harmless.
async function revoke(token, userId, expiresAt) {
    const tokenHash = hashToken(token);
    try {
        await pool.query(
            'INSERT IGNORE INTO revoked_tokens (token_hash, user_id, expires_at) VALUES (?, ?, ?)',
            [tokenHash, userId, expiresAt]
        );
    } catch (err) {
        if (err && err.code === 'ER_NO_SUCH_TABLE') {
            warnMissingTableOnce();
            fallbackRevoked.set(tokenHash, new Date(expiresAt).getTime());
            return;
        }
        throw err;
    }
}

// True only if the token was revoked and has not yet expired.
async function isRevoked(token) {
    const tokenHash = hashToken(token);
    try {
        const [rows] = await pool.query(
            'SELECT 1 FROM revoked_tokens WHERE token_hash = ? AND expires_at > NOW() LIMIT 1',
            [tokenHash]
        );
        return rows.length > 0;
    } catch (err) {
        if (err && err.code === 'ER_NO_SUCH_TABLE') {
            warnMissingTableOnce();
            const exp = fallbackRevoked.get(tokenHash);
            return Boolean(exp && exp > Date.now());
        }
        throw err;
    }
}

// Removes rows whose tokens have already expired. Expired tokens are rejected by
// jwt.verify anyway, so the rows are no longer needed.
async function purgeExpired() {
    try {
        await pool.query('DELETE FROM revoked_tokens WHERE expires_at <= NOW()');
    } catch (err) {
        if (err && err.code === 'ER_NO_SUCH_TABLE') {
            const now = Date.now();
            for (const [hash, exp] of fallbackRevoked.entries()) {
                if (exp <= now) fallbackRevoked.delete(hash);
            }
            return;
        }
        throw err;
    }
}

module.exports = { revoke, isRevoked, purgeExpired };
