const { pool } = require('../config/database');

async function findByEmail(email) {
    const [rows] = await pool.query(
        `SELECT
            u.user_id,
            u.email,
            u.password_hash,
            r.role_name
         FROM users u
         JOIN roles r ON u.role_id = r.role_id
         WHERE u.email = ?
         LIMIT 1`,
        [email]
    );

    return rows[0] || null;
}

async function findById(id) {
    const [rows] = await pool.query(
        `SELECT
            u.user_id,
            u.email,
            u.password_hash,
            r.role_name
         FROM users u
         JOIN roles r ON u.role_id = r.role_id
         WHERE u.user_id = ?
         LIMIT 1`,
        [id]
    );

    return rows[0] || null;
}

async function saveRefreshToken(userId, refreshToken) {
    await pool.query(
        `UPDATE users
         SET refresh_token = ?
         WHERE user_id = ?`,
        [refreshToken, userId]
    );
}

module.exports = {
    findByEmail,
    findById,
    saveRefreshToken
};