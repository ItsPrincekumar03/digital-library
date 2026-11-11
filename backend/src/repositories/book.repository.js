const { pool } = require('../config/database');

// Every value the database ENUM still allows (kept for compatibility with old data).
const VALID_STATUSES = ['DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'PUBLISHED', 'ARCHIVED'];

// Module 8.5: the only statuses the API will WRITE for public books.
// PENDING_REVIEW / APPROVED / REJECTED are legacy values from the old
// submission workflow. They may still exist in old rows but are never set again.
const WRITABLE_STATUSES = ['DRAFT', 'PUBLISHED', 'ARCHIVED'];

async function create({ ownerUserId, title, description, coverPath, publicationDate }) {
    const [result] = await pool.query(
        `INSERT INTO books (owner_id, title, description, cover_path, publication_date, status)
     VALUES (?, ?, ?, ?, ?, 'DRAFT')`,
        [ownerUserId, title, description || null, coverPath || null, publicationDate || null]
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

async function setStatus(bookId, status) {
    await pool.query(
        'UPDATE books SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE book_id = ?',
        [status, bookId]
    );
}

async function updatePdfMetadata(bookId, { originalName, storedName, size, fileFormat }) {
    const [result] = await pool.query(
        `UPDATE books
         SET pdf_original_name = ?, pdf_stored_name = ?, pdf_size = ?,
             pdf_uploaded_at = CURRENT_TIMESTAMP,
             file_format = ?,
             updated_at = CURRENT_TIMESTAMP
         WHERE book_id = ?`,
        [originalName, storedName, size, fileFormat || null, bookId]
    );
    return result;
}

// Module 13.2 — points the book at its extracted-text JSON file (or NULL when
// extraction was unavailable). Reuses the legacy processed_content_path column.
async function updateProcessedPath(bookId, processedName) {
    const [result] = await pool.query(
        `UPDATE books
         SET processed_content_path = ?,
             updated_at = CURRENT_TIMESTAMP
         WHERE book_id = ?`,
        [processedName, bookId]
    );
    return result;
}

function escapeLikePattern(value) {
    return String(value).replace(/[~%_]/g, (ch) => '~' + ch);
}

function buildBookFilterWhere({ status, categoryId, search } = {}) {
    const conditions = [];
    const params = [];

    if (status) {
        conditions.push('b.status = ?');
        params.push(status);
    }

    if (Number.isInteger(categoryId) && categoryId > 0) {
        conditions.push(
            `EXISTS (
                SELECT 1
                  FROM book_categories bc
                 WHERE bc.book_id = b.book_id
                   AND bc.category_id = ?
            )`
        );
        params.push(categoryId);
    }

    if (typeof search === 'string' && search.trim()) {
        const pattern = `%${escapeLikePattern(search.trim())}%`;
        conditions.push(
            `(
                b.title LIKE ? ESCAPE '~'
                OR COALESCE(b.description, '') LIKE ? ESCAPE '~'
                OR EXISTS (
                    SELECT 1
                      FROM book_authors ba
                      INNER JOIN authors a ON a.author_id = ba.author_id
                     WHERE ba.book_id = b.book_id
                       AND a.name LIKE ? ESCAPE '~'
                )
            )`
        );
        params.push(pattern, pattern, pattern);
    }

    return {
        whereSql: conditions.length ? `WHERE ${conditions.join(' AND ')}` : '',
        params,
    };
}

// sortColumn / sortDirection are checked against a whitelist in the service layer.
async function findAllPaginated({ limit, offset, sortColumn, sortDirection, status, categoryId, search }) {
    const { whereSql, params } = buildBookFilterWhere({ status, categoryId, search });
    const [rows] = await pool.query(
        `SELECT b.* FROM books b ${whereSql} ORDER BY b.${sortColumn} ${sortDirection} LIMIT ? OFFSET ?`,
        [...params, limit, offset]
    );
    return rows;
}

async function countAll(filterOrStatus) {
    const filters = typeof filterOrStatus === 'string'
        ? { status: filterOrStatus }
        : (filterOrStatus || {});
    const { whereSql, params } = buildBookFilterWhere(filters);
    const [rows] = await pool.query(`SELECT COUNT(*) AS total FROM books b ${whereSql}`, params);
    return rows[0].total;
}

module.exports = {
    create, findAll, findById, updateFields, archive, setStatus, updatePdfMetadata,
    updateProcessedPath,
    VALID_STATUSES, WRITABLE_STATUSES, findAllPaginated, countAll,
};