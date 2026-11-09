// Persistent token revocation backed by the revoked_tokens table (migration 020).
// Only a SHA-256 hash of each token is stored, so a database leak does not reveal
// usable tokens. A logged-out token stays rejected across server restarts until
// its natural expiry time.

const crypto = require('crypto');
const { pool } = require('../config/database');

function hashToken(token) {
    return crypto.createHash('sha256').update(String(token)).digest('hex');
}

// Records a revoked token. INSERT IGNORE makes repeated logouts harmless.
async function revoke(token, userId, expiresAt) {
    await pool.query(
        'INSERT IGNORE INTO revoked_tokens (token_hash, user_id, expires_at) VALUES (?, ?, ?)',
        [hashToken(token), userId, expiresAt]
    );
}

// True only if the token was revoked and has not yet expired.
async function isRevoked(token) {
    const [rows] = await pool.query(
        'SELECT 1 FROM revoked_tokens WHERE token_hash = ? AND expires_at > NOW() LIMIT 1',
        [hashToken(token)]
    );
    return rows.length > 0;
}

// Removes rows whose tokens have already expired. Expired tokens are rejected by
// jwt.verify anyway, so the rows are no longer needed.
async function purgeExpired() {
    await pool.query('DELETE FROM revoked_tokens WHERE expires_at <= NOW()');
}

module.exports = { revoke, isRevoked, purgeExpired };