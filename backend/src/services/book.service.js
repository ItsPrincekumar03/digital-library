const bookRepository = require('../repositories/book.repository');
const bookRelationsRepository = require('../repositories/bookRelations.repository');
const { resolvePublicPdfPath } = require('../utils/fileStorage');
const { parsePagination, parseSort, buildPaginationMeta } = require('../utils/pagination');
const { PUBLIC_BOOK_STATUS, isAdmin, isBookPubliclyReadable } = require('../utils/bookVisibility');
const path = require('path');

function notFound() {
    const err = new Error('Book not found.');
    err.status = 404;
    return err;
}

function forbidden(message) {
    const err = new Error(message || 'Only an admin can manage public library books.');
    err.status = 403;
    return err;
}

function assertAdmin(requestingUser) {
    if (!isAdmin(requestingUser)) throw forbidden();
}

const BOOK_SORT_COLUMNS = ['created_at', 'title', 'status', 'publication_date'];

function statusFilterFor(requestingUser) {
    return isAdmin(requestingUser) ? undefined : PUBLIC_BOOK_STATUS;
}

async function createBook(requestingUser, { title, description, coverPath, publicationDate }) {
    assertAdmin(requestingUser);
    const bookId = await bookRepository.create({ ownerUserId: requestingUser.user_id, title, description, coverPath, publicationDate });
    return bookRepository.findById(bookId);
}

async function importPdfBook(requestingUser, { title, description, authorId, categoryId, pdfPath, pdfOriginalName, pdfSize }) {
    assertAdmin(requestingUser);
    const bookId = await bookRepository.create({
        ownerUserId: requestingUser.user_id,
        title, description,
        pdfPath, pdfOriginalName, pdfSize
    });

    if (authorId) {
        await bookRelationsRepository.addAuthorToBook(bookId, authorId);
    }
    if (categoryId) {
        await bookRelationsRepository.addCategoryToBook(bookId, categoryId);
    }
    return bookRepository.findById(bookId);
}

async function getAllBooks(requestingUser) {
    return bookRepository.findAll(statusFilterFor(requestingUser));
}

async function getAllBooksPaginated(requestingUser, query) {
    const { page, limit, offset } = parsePagination(query);
    const { column, direction } = parseSort(query, BOOK_SORT_COLUMNS, 'created_at');
    const status = statusFilterFor(requestingUser);

    const [books, totalItems] = await Promise.all([
        bookRepository.findAllPaginated({ limit, offset, sortColumn: column, sortDirection: direction, status }),
        bookRepository.countAll(status)
    ]);

    return { books, meta: buildPaginationMeta({ page, limit, totalItems }) };
}

async function getBookById(bookId, requestingUser) {
    const book = await bookRepository.findById(bookId);
    if (!book) throw notFound();
    if (!isAdmin(requestingUser) && !isBookPubliclyReadable(book)) throw notFound();
    return book;
}

async function getPublicPdfStream(bookId, requestingUser) {
    const book = await getBookById(bookId, requestingUser); // reuses logic to check if they can read it
    if (!book.pdf_path) {
        const err = new Error('This book does not have an attached PDF file.');
        err.status = 404;
        throw err;
    }

    return {
        filePath: resolvePublicPdfPath(book.pdf_path),
        mimeType: 'application/pdf',
        safeFileName: (book.pdf_original_name || 'book.pdf').replace(/"/g, '')
    };
}

async function updateBook(bookId, requestingUser, { title, description, coverPath, publicationDate, status }) {
    assertAdmin(requestingUser);
    const book = await bookRepository.findById(bookId);
    if (!book) throw notFound();
    
    const fields = { title, description: description ?? null, cover_path: coverPath ?? null, publication_date: publicationDate ?? null };
    if (status !== undefined) fields.status = status;
    
    await bookRepository.updateFields(bookId, fields);
    return bookRepository.findById(bookId);
}

async function publishBook(bookId, requestingUser) {
    assertAdmin(requestingUser);
    const book = await bookRepository.findById(bookId);
    if (!book) throw notFound();
    await bookRepository.setStatus(bookId, PUBLIC_BOOK_STATUS);
    return bookRepository.findById(bookId);
}

async function archiveBook(bookId, requestingUser) {
    assertAdmin(requestingUser);
    const book = await bookRepository.findById(bookId);
    if (!book) throw notFound();
    await bookRepository.archive(bookId);
    return bookRepository.findById(bookId);
}

module.exports = {
    createBook, importPdfBook, getAllBooks, getAllBooksPaginated, getBookById, getPublicPdfStream, updateBook, publishBook, archiveBook
};
