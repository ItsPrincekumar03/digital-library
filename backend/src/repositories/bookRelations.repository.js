const { pool } = require('../config/database');

// --- Authors ---
async function linkExists(bookId, authorId) {
    const [rows] = await pool.query(
        'SELECT 1 FROM book_authors WHERE book_id = ? AND author_id = ? LIMIT 1',
        [bookId, authorId]
    );
    return rows.length > 0;
}

async function addAuthor(bookId, authorId) {
    await pool.query('INSERT INTO book_authors (book_id, author_id) VALUES (?, ?)', [bookId, authorId]);
}

async function removeAuthor(bookId, authorId) {
    const [result] = await pool.query(
        'DELETE FROM book_authors WHERE book_id = ? AND author_id = ?',
        [bookId, authorId]
    );
    return result.affectedRows > 0;
}

async function getAuthorsForBook(bookId) {
    const [rows] = await pool.query(
        `SELECT a.* FROM authors a
     JOIN book_authors ba ON ba.author_id = a.author_id
     WHERE ba.book_id = ?`,
        [bookId]
    );
    return rows;
}

// --- Categories ---
async function categoryLinkExists(bookId, categoryId) {
    const [rows] = await pool.query(
        'SELECT 1 FROM book_categories WHERE book_id = ? AND category_id = ? LIMIT 1',
        [bookId, categoryId]
    );
    return rows.length > 0;
}

async function addCategory(bookId, categoryId) {
    await pool.query('INSERT INTO book_categories (book_id, category_id) VALUES (?, ?)', [bookId, categoryId]);
}

async function removeCategory(bookId, categoryId) {
    const [result] = await pool.query(
        'DELETE FROM book_categories WHERE book_id = ? AND category_id = ?',
        [bookId, categoryId]
    );
    return result.affectedRows > 0;
}

async function getCategoriesForBook(bookId) {
    const [rows] = await pool.query(
        `SELECT c.* FROM categories c
     JOIN book_categories bc ON bc.category_id = c.category_id
     WHERE bc.book_id = ?`,
        [bookId]
    );
    return rows;
}

async function attachRelationsToBooks(books) {
    if (!Array.isArray(books) || books.length === 0) {
        return books;
    }

    const bookIds = books.map((b) => b.book_id).filter(Boolean);
    if (bookIds.length === 0) {
        return books;
    }

    const [authorRows] = await pool.query(
        `SELECT ba.book_id, a.author_id, a.name
           FROM book_authors ba
           INNER JOIN authors a ON a.author_id = ba.author_id
          WHERE ba.book_id IN (?)
          ORDER BY a.name ASC`,
        [bookIds]
    );

    const [categoryRows] = await pool.query(
        `SELECT bc.book_id, c.category_id, c.name
           FROM book_categories bc
           INNER JOIN categories c ON c.category_id = bc.category_id
          WHERE bc.book_id IN (?)
          ORDER BY c.name ASC`,
        [bookIds]
    );

    const authorsByBook = new Map();
    for (const row of authorRows) {
        if (!authorsByBook.has(row.book_id)) authorsByBook.set(row.book_id, []);
        authorsByBook.get(row.book_id).push({ author_id: row.author_id, name: row.name });
    }

    const categoriesByBook = new Map();
    for (const row of categoryRows) {
        if (!categoriesByBook.has(row.book_id)) categoriesByBook.set(row.book_id, []);
        categoriesByBook.get(row.book_id).push({ category_id: row.category_id, name: row.name });
    }

    return books.map((book) => ({
        ...book,
        authors: authorsByBook.get(book.book_id) || [],
        categories: categoriesByBook.get(book.book_id) || [],
    }));
}

module.exports = {
    linkExists, addAuthor, removeAuthor, getAuthorsForBook,
    categoryLinkExists, addCategory, removeCategory, getCategoriesForBook,
    attachRelationsToBooks,
};
