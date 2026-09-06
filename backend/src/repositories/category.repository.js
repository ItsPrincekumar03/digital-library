const { pool } = require('../config/database');

async function create({ name, description }) {
    const [result] = await pool.query(
        'INSERT INTO categories (name, description) VALUES (?, ?)',
        [name, description || null]
    );
    return result.insertId;
}

async function findAll({ includeArchived = false } = {}) {
    const sql = includeArchived
        ? 'SELECT * FROM categories ORDER BY name'
        : 'SELECT * FROM categories WHERE is_archived = 0 ORDER BY name';
    const [rows] = await pool.query(sql);
    return rows;
}

async function findById(categoryId) {
    const [rows] = await pool.query('SELECT * FROM categories WHERE category_id = ? LIMIT 1', [categoryId]);
    return rows[0] || null;
}

async function findByName(name) {
    const [rows] = await pool.query('SELECT * FROM categories WHERE name = ? LIMIT 1', [name]);
    return rows[0] || null;
}

async function findByNameExcluding(name, excludeId) {
    const [rows] = await pool.query(
        'SELECT category_id FROM categories WHERE name = ? AND category_id != ? LIMIT 1',
        [name, excludeId]
    );
    return rows[0] || null;
}

async function update(categoryId, { name, description }) {
    await pool.query('UPDATE categories SET name = ?, description = ? WHERE category_id = ?', [name, description || null, categoryId]);
}

async function archive(categoryId) {
    await pool.query('UPDATE categories SET is_archived = 1 WHERE category_id = ?', [categoryId]);
}

module.exports = { create, findAll, findById, findByName, findByNameExcluding, update, archive };