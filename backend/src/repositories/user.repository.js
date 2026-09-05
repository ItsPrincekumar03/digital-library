const { pool } = require('../config/database');

// All raw SQL for the users table lives here.
// Controllers/services never write SQL directly.

async function findByEmail(email) {
    const [rows] = await pool.query(
        'SELECT * FROM users WHERE email = ? LIMIT 1',
        [email]
    );
    return rows[0] || null;
}

async function findById(userId) {
    const [rows] = await pool.query(
        `SELECT u.user_id, u.full_name, u.email, u.is_active, u.created_at, r.role_name
     FROM users u
     JOIN roles r ON u.role_id = r.role_id
     WHERE u.user_id = ? LIMIT 1`,
        [userId]
    );
    return rows[0] || null;
}

async function findRoleIdByName(roleName) {
    const [rows] = await pool.query(
        'SELECT role_id FROM roles WHERE role_name = ? LIMIT 1',
        [roleName]
    );
    return rows[0] ? rows[0].role_id : null;
}

async function createUser({ fullName, email, passwordHash, roleId }) {
    const [result] = await pool.query(
        `INSERT INTO users (role_id, full_name, email, password_hash, is_active)
     VALUES (?, ?, ?, ?, 1)`,
        [roleId, fullName, email, passwordHash]
    );
    return result.insertId;
}

module.exports = { findByEmail, findById, findRoleIdByName, createUser };