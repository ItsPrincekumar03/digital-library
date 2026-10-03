const bookRepository = require('../repositories/book.repository');
const authorRepository = require('../repositories/author.repository');
const categoryRepository = require('../repositories/category.repository');
const relationsRepository = require('../repositories/bookRelations.repository');
const { isAdmin, isBookPubliclyReadable } = require('../utils/bookVisibility');

// Module 8.5: author/category links on a book are public-library content
// management, so only ADMIN may add or remove them. Reading them follows the
// same visibility rule as the book itself.

function notFound(message) {
    const err = new Error(message);
    err.status = 404;
    return err;
}
function conflict(message) {
    const err = new Error(message);
    err.status = 409;
    return err;
}
function forbidden(message) {
    const err = new Error(message);
    err.status = 403;
    return err;
}

// Admin-only. (Routes already use requireRole('ADMIN'); this is defense in depth.)
async function assertAdminAndBook(bookId, requestingUser) {
    if (!isAdmin(requestingUser)) throw forbidden('Only an admin can manage public book relationships.');

    const book = await bookRepository.findById(bookId);
    if (!book) throw notFound('Book not found.');

    return book;
}

// Normal users may only read relationships of PUBLISHED books.
async function assertBookReadable(bookId, requestingUser) {
    const book = await bookRepository.findById(bookId);
    if (!book) throw notFound('Book not found.');
    if (!isAdmin(requestingUser) && !isBookPubliclyReadable(book)) throw notFound('Book not found.');
    return book;
}

// --- Authors ---
async function addAuthorToBook(bookId, authorId, requestingUser) {
    await assertAdminAndBook(bookId, requestingUser);

    const author = await authorRepository.findById(authorId);
    if (!author) throw notFound('Author not found.');

    const exists = await relationsRepository.linkExists(bookId, authorId);
    if (exists) throw conflict('This author is already linked to the book.');

    await relationsRepository.addAuthor(bookId, authorId);
    return relationsRepository.getAuthorsForBook(bookId);
}

async function removeAuthorFromBook(bookId, authorId, requestingUser) {
    await assertAdminAndBook(bookId, requestingUser);
    const removed = await relationsRepository.removeAuthor(bookId, authorId);
    if (!removed) throw notFound('Author is not linked to this book.');
    return relationsRepository.getAuthorsForBook(bookId);
}

async function getAuthorsOfBook(bookId, requestingUser) {
    await assertBookReadable(bookId, requestingUser);
    return relationsRepository.getAuthorsForBook(bookId);
}

// --- Categories ---
async function addCategoryToBook(bookId, categoryId, requestingUser) {
    await assertAdminAndBook(bookId, requestingUser);

    const category = await categoryRepository.findById(categoryId);
    if (!category) throw notFound('Category not found.');

    const exists = await relationsRepository.categoryLinkExists(bookId, categoryId);
    if (exists) throw conflict('This category is already linked to the book.');

    await relationsRepository.addCategory(bookId, categoryId);
    return relationsRepository.getCategoriesForBook(bookId);
}

async function removeCategoryFromBook(bookId, categoryId, requestingUser) {
    await assertAdminAndBook(bookId, requestingUser);
    const removed = await relationsRepository.removeCategory(bookId, categoryId);
    if (!removed) throw notFound('Category is not linked to this book.');
    return relationsRepository.getCategoriesForBook(bookId);
}

async function getCategoriesOfBook(bookId, requestingUser) {
    await assertBookReadable(bookId, requestingUser);
    return relationsRepository.getCategoriesForBook(bookId);
}

module.exports = {
    addAuthorToBook, removeAuthorFromBook, getAuthorsOfBook,
    addCategoryToBook, removeCategoryFromBook, getCategoriesOfBook,
};