const { pool } = require('../config/database');

async function create({ name, bio }) {
    const [result] = await pool.query(
        'INSERT INTO authors (name, bio) VALUES (?, ?)',
        [name, bio || null]
    );
    return result.insertId;
}

async function findAll({ includeArchived = false } = {}) {
    const sql = includeArchived
        ? 'SELECT * FROM authors ORDER BY name'
        : 'SELECT * FROM authors WHERE is_archived = 0 ORDER BY name';
    const [rows] = await pool.query(sql);
    return rows;
}

async function findById(authorId) {
    const [rows] = await pool.query('SELECT * FROM authors WHERE author_id = ? LIMIT 1', [authorId]);
    return rows[0] || null;
}

async function update(authorId, { name, bio }) {
    await pool.query('UPDATE authors SET name = ?, bio = ? WHERE author_id = ?', [name, bio || null, authorId]);
}

async function archive(authorId) {
    await pool.query('UPDATE authors SET is_archived = 1 WHERE author_id = ?', [authorId]);
}

module.exports = { create, findAll, findById, update, archive };