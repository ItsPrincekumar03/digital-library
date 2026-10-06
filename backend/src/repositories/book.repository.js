const { pool } = require('../config/database');

// Every value the database ENUM still allows (kept for compatibility with old data).
const VALID_STATUSES = ['DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'PUBLISHED', 'ARCHIVED'];

// Module 8.5: the only statuses the API will WRITE for public books.
// PENDING_REVIEW / APPROVED / REJECTED are legacy values from the old
// submission workflow. They may still exist in old rows but are never set again.
const WRITABLE_STATUSES = ['DRAFT', 'PUBLISHED', 'ARCHIVED'];

async function create({ ownerUserId, title, description, coverPath, publicationDate, pdfPath, pdfOriginalName, pdfSize }) {
    const [result] = await pool.query(
        \INSERT INTO books (owner_id, title, description, cover_path, publication_date, status, pdf_path, pdf_original_name, pdf_size)
     VALUES (?, ?, ?, ?, ?, 'DRAFT', ?, ?, ?)\,
        [ownerUserId, title, description || null, coverPath || null, publicationDate || null, pdfPath || null, pdfOriginalName || null, pdfSize || null]
    );
    return result.insertId;
}

// status (optional): when given, only books with that status are returned.
async function findAll(status) {
    if (status) {
        const [rows] = await pool.query(
            'SELECT * FROM books WHERE status = ? ORDER BY created_at DESC',
            [status]
        );
        return rows;
    }
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
    const setClause = keys.map((k) => \\ = ?\).join(', ');
    const values = keys.map((k) => fields[k]);
    await pool.query(
        \UPDATE books SET \, updated_at = CURRENT_TIMESTAMP WHERE book_id = ?\,
        [...values, bookId]
    );
}

async function archive(bookId) {
    await pool.query("UPDATE books SET status = 'ARCHIVED', updated_at = CURRENT_TIMESTAMP WHERE book_id = ?", [bookId]);
}

async function setStatus(bookId, status) {
    await pool.query(
        'UPDATE books SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE book_id = ?',
        [status, bookId]
    );
}

// sortColumn / sortDirection are checked against a whitelist in the service layer.
async function findAllPaginated({ limit, offset, sortColumn, sortDirection, status }) {
    if (status) {
        const [rows] = await pool.query(
            \SELECT * FROM books WHERE status = ? ORDER BY \ \ LIMIT ? OFFSET ?\,
            [status, limit, offset]
        );
        return rows;
    }
    const [rows] = await pool.query(
        \SELECT * FROM books ORDER BY \ \ LIMIT ? OFFSET ?\,
        [limit, offset]
    );
    return rows;
}

async function countAll(status) {
    if (status) {
        const [rows] = await pool.query('SELECT COUNT(*) AS total FROM books WHERE status = ?', [status]);
        return rows[0].total;
    }
    const [rows] = await pool.query('SELECT COUNT(*) AS total FROM books');
    return rows[0].total;
}

module.exports = {
    create, findAll, findById, updateFields, archive, setStatus,
    VALID_STATUSES, WRITABLE_STATUSES, findAllPaginated, countAll,
};
