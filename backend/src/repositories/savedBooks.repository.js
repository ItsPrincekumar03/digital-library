const { pool } = require('../config/database');

async function findByUserAndBook(userId, bookId) {
    const [rows] = await pool.query(
        `SELECT saved_id, user_id, book_id, saved_at
           FROM private_saved_books
          WHERE user_id = ? AND book_id = ?
          LIMIT 1`,
        [userId, bookId]
    );
    return rows[0] || null;
}

async function saveBook(userId, bookId) {
    const [result] = await pool.query(
        `INSERT IGNORE INTO private_saved_books (user_id, book_id)
         VALUES (?, ?)`,
        [userId, bookId]
    );
    const saved = await findByUserAndBook(userId, bookId);
    return {
        saved,
        alreadySaved: result.affectedRows === 0,
    };
}

async function removeBook(userId, bookId) {
    const [result] = await pool.query(
        `DELETE FROM private_saved_books
          WHERE user_id = ? AND book_id = ?`,
        [userId, bookId]
    );
    return result.affectedRows > 0;
}

async function listPublishedSavedBooksByUser(userId) {
    const [rows] = await pool.query(
        `SELECT
            psb.saved_id,
            psb.user_id,
            psb.saved_at,
            b.book_id,
            b.title,
            b.description,
            b.cover_image,
            b.cover_path,
            b.publication_date,
            b.status,
            b.pdf_original_name,
            b.pdf_stored_name,
            b.pdf_size,
            b.file_format,
            b.processed_content_path,
            b.created_at,
            b.updated_at
         FROM private_saved_books psb
         INNER JOIN books b ON b.book_id = psb.book_id
         WHERE psb.user_id = ?
           AND b.status = 'PUBLISHED'
         ORDER BY psb.saved_at DESC, psb.saved_id DESC`,
        [userId]
    );
    return rows;
}

async function listSavedBookIdsByUser(userId) {
    const [rows] = await pool.query(
        `SELECT psb.book_id
           FROM private_saved_books psb
           INNER JOIN books b ON b.book_id = psb.book_id
          WHERE psb.user_id = ?
            AND b.status = 'PUBLISHED'`,
        [userId]
    );
    return rows.map((row) => row.book_id);
}

module.exports = {
    findByUserAndBook,
    saveBook,
    removeBook,
    listPublishedSavedBooksByUser,
    listSavedBookIdsByUser,
};
