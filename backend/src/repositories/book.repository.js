const { pool } = require('../config/database');

const VALID_STATUSES = ['DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'PUBLISHED', 'ARCHIVED'];

async function create({ ownerUserId, title, description, coverPath, publicationDate }) {
    const [result] = await pool.query(
        `INSERT INTO books (owner_id, title, description, cover_path, publication_date, status)
     VALUES (?, ?, ?, ?, ?, 'DRAFT')`,
        [ownerUserId, title, description || null, coverPath || null, publicationDate || null]
    );
    return result.insertId;
}

async function findAll() {
    const [rows] = await pool.query('SELECT * FROM books ORDER BY created_at DESC');
    return rows;
}

async function findById(bookId) {
    const [rows] = await pool.query('SELECT * FROM books WHERE book_id = ? LIMIT 1', [bookId]);
    return rows[0] || null;
}

async function updateFields(bookId, fields) {
    const keys = Object.keys(fields);
    if (keys.length === 0) return;
    const setClause = keys.map((k) => `${k} = ?`).join(', ');
    const values = keys.map((k) => fields[k]);
    await pool.query(
        `UPDATE books SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE book_id = ?`,
        [...values, bookId]
    );
}

async function archive(bookId) {
    await pool.query("UPDATE books SET status = 'ARCHIVED', updated_at = CURRENT_TIMESTAMP WHERE book_id = ?", [bookId]);
}

async function findAllPaginated({ limit, offset, sortColumn, sortDirection }) {
    const [rows] = await pool.query(
        `SELECT * FROM books ORDER BY ${sortColumn} ${sortDirection} LIMIT ? OFFSET ?`,
        [limit, offset]
    );
    return rows;
}

async function countAll() {
    const [rows] = await pool.query('SELECT COUNT(*) AS total FROM books');
    return rows[0].total;
}

module.exports = { create, findAll, findById, updateFields, archive, VALID_STATUSES, findAllPaginated, countAll };