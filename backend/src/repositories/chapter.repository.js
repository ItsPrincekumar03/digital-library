const { pool } = require('../config/database');

async function create({ bookId, chapterNumber, title, content }) {
    const [result] = await pool.query(
        `INSERT INTO chapters (book_id, chapter_number, title, content, status)
     VALUES (?, ?, ?, ?, 'DRAFT')`,
        [bookId, chapterNumber, title, content || null]
    );
    return result.insertId;
}

async function findByBook(bookId) {
    const [rows] = await pool.query(
        'SELECT * FROM chapters WHERE book_id = ? ORDER BY chapter_number ASC',
        [bookId]
    );
    return rows;
}

async function findById(chapterId) {
    const [rows] = await pool.query('SELECT * FROM chapters WHERE chapter_id = ? LIMIT 1', [chapterId]);
    return rows[0] || null;
}

async function findByBookAndNumber(bookId, chapterNumber) {
    const [rows] = await pool.query(
        'SELECT * FROM chapters WHERE book_id = ? AND chapter_number = ? LIMIT 1',
        [bookId, chapterNumber]
    );
    return rows[0] || null;
}

async function update(chapterId, { title, content, chapterNumber }) {
    await pool.query(
        `UPDATE chapters SET title = ?, content = ?, chapter_number = ?, updated_at = CURRENT_TIMESTAMP
     WHERE chapter_id = ?`,
        [title, content || null, chapterNumber, chapterId]
    );
}

async function setStatus(chapterId, status) {
    await pool.query(
        'UPDATE chapters SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE chapter_id = ?',
        [status, chapterId]
    );
}

// Applies a full new ordering in one transaction.
// order: array of { chapterId, chapterNumber }
async function reorder(bookId, order) {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // Temporarily bump all numbers to avoid unique constraint collisions mid-update.
        await connection.query(
            'UPDATE chapters SET chapter_number = chapter_number + 100000 WHERE book_id = ?',
            [bookId]
        );

        for (const item of order) {
            await connection.query(
                'UPDATE chapters SET chapter_number = ?, updated_at = CURRENT_TIMESTAMP WHERE chapter_id = ? AND book_id = ?',
                [item.chapterNumber, item.chapterId, bookId]
            );
        }

        await connection.commit();
    } catch (err) {
        await connection.rollback();
        throw err;
    } finally {
        connection.release();
    }
}

module.exports = { create, findByBook, findById, findByBookAndNumber, update, setStatus, reorder };