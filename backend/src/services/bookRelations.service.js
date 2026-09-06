const bookRepository = require('../repositories/book.repository');
const authorRepository = require('../repositories/author.repository');
const categoryRepository = require('../repositories/category.repository');
const relationsRepository = require('../repositories/bookRelations.repository');

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

async function assertBookOwnershipOrAdmin(bookId, requestingUser) {
    const book = await bookRepository.findById(bookId);
    if (!book) throw notFound('Book not found.');

    const isAdmin = requestingUser.role_name === 'ADMIN';
    const isOwner = book.owner_id === requestingUser.user_id;
    if (!isAdmin && !isOwner) throw forbidden("You cannot modify another user's book.");

    return book;
}

// --- Authors ---
async function addAuthorToBook(bookId, authorId, requestingUser) {
    await assertBookOwnershipOrAdmin(bookId, requestingUser);

    const author = await authorRepository.findById(authorId);
    if (!author) throw notFound('Author not found.');

    const exists = await relationsRepository.linkExists(bookId, authorId);
    if (exists) throw conflict('This author is already linked to the book.');

    await relationsRepository.addAuthor(bookId, authorId);
    return relationsRepository.getAuthorsForBook(bookId);
}

async function removeAuthorFromBook(bookId, authorId, requestingUser) {
    await assertBookOwnershipOrAdmin(bookId, requestingUser);
    const removed = await relationsRepository.removeAuthor(bookId, authorId);
    if (!removed) throw notFound('Author is not linked to this book.');
    return relationsRepository.getAuthorsForBook(bookId);
}

async function getAuthorsOfBook(bookId) {
    const book = await bookRepository.findById(bookId);
    if (!book) throw notFound('Book not found.');
    return relationsRepository.getAuthorsForBook(bookId);
}

// --- Categories ---
async function addCategoryToBook(bookId, categoryId, requestingUser) {
    await assertBookOwnershipOrAdmin(bookId, requestingUser);

    const category = await categoryRepository.findById(categoryId);
    if (!category) throw notFound('Category not found.');

    const exists = await relationsRepository.categoryLinkExists(bookId, categoryId);
    if (exists) throw conflict('This category is already linked to the book.');

    await relationsRepository.addCategory(bookId, categoryId);
    return relationsRepository.getCategoriesForBook(bookId);
}

async function removeCategoryFromBook(bookId, categoryId, requestingUser) {
    await assertBookOwnershipOrAdmin(bookId, requestingUser);
    const removed = await relationsRepository.removeCategory(bookId, categoryId);
    if (!removed) throw notFound('Category is not linked to this book.');
    return relationsRepository.getCategoriesForBook(bookId);
}

async function getCategoriesOfBook(bookId) {
    const book = await bookRepository.findById(bookId);
    if (!book) throw notFound('Book not found.');
    return relationsRepository.getCategoriesForBook(bookId);
}

module.exports = {
    addAuthorToBook, removeAuthorFromBook, getAuthorsOfBook,
    addCategoryToBook, removeCategoryFromBook, getCategoriesOfBook,
};