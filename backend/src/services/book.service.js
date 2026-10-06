const path = require('path');
const fs = require('fs/promises');
const bookRepository = require('../repositories/book.repository');
const { BOOK_SORT_COLUMNS, PUBLIC_BOOK_STATUS } = require('../config/constants');
const { notFound, forbidden, unauthorized } = require('../utils/errors');
const { parsePagination, parseSort, buildPaginationMeta } = require('../utils/pagination');
const { getPublicUploadDirectory, getPublicProcessedDirectory, getPublicImagesDirectory } = require('../utils/fileStorage');
const { extractPdf } = require('../utils/pdfExtractor');

function assertAdmin(user) {
    if (!user) throw unauthorized();
    if (user.role !== 'ADMIN') throw forbidden();
}

function statusFilterFor(user) {
    if (user?.role === 'ADMIN') return null;
    return PUBLIC_BOOK_STATUS;
}

async function createBook(requestingUser, data) {
    assertAdmin(requestingUser);
    const bookId = await bookRepository.create({
        ownerUserId: requestingUser.user_id,
        ...data
    });
    return bookRepository.findById(bookId);
}

async function importPdfBook(requestingUser, { title, description, authorId, categoryId, pdfPath, pdfOriginalName, pdfSize }) {
    assertAdmin(requestingUser);
    const bookId = await bookRepository.create({
        ownerUserId: requestingUser.user_id,
        title, description, authorId, categoryId,
        pdfPath, pdfOriginalName, pdfSize
    });

    // Run PDF Extraction
    try {
        const fullPdfPath = path.join(getPublicUploadDirectory(), pdfPath);
        const filePrefix = `book_${bookId}`;
        const outputDir = getPublicImagesDirectory();
        
        const blocks = await extractPdf(fullPdfPath, outputDir, filePrefix);
        
        const jsonPath = `${filePrefix}_processed.json`;
        const fullJsonPath = path.join(getPublicProcessedDirectory(), jsonPath);
        
        await fs.writeFile(fullJsonPath, JSON.stringify(blocks), 'utf-8');
        await bookRepository.updateFields(bookId, { processed_content_path: jsonPath });
    } catch (e) {
        console.error("Failed to extract PDF content for book", bookId, e);
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

    if (book.status !== PUBLIC_BOOK_STATUS && requestingUser?.role !== 'ADMIN') {
        if (!requestingUser) throw unauthorized();
        throw forbidden();
    }
    return book;
}

async function getPublicPdfStream(bookId, requestingUser) {
    const book = await getBookById(bookId, requestingUser);
    if (!book.pdf_path) throw notFound('Book does not have a PDF');

    const safeFileName = path.basename(book.pdf_path);
    const filePath = path.join(getPublicUploadDirectory(), safeFileName);

    try {
        await fs.access(filePath);
    } catch {
        throw notFound('PDF file not found on server');
    }

    return { filePath, mimeType: 'application/pdf', safeFileName: book.pdf_original_name || safeFileName };
}

async function getPublicProcessedContent(bookId, requestingUser) {
    const book = await getBookById(bookId, requestingUser);
    if (!book.processed_content_path) throw notFound('Book does not have processed content');

    const safeFileName = path.basename(book.processed_content_path);
    const filePath = path.join(getPublicProcessedDirectory(), safeFileName);

    try {
        const content = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(content);
    } catch {
        throw notFound('Processed content not found on server');
    }
}

async function updateBook(bookId, requestingUser, updates) {
    assertAdmin(requestingUser);
    const book = await bookRepository.findById(bookId);
    if (!book) throw notFound();
    await bookRepository.updateFields(bookId, updates);
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
    createBook, importPdfBook, getAllBooks, getAllBooksPaginated, getBookById, 
    getPublicPdfStream, getPublicProcessedContent, updateBook, publishBook, archiveBook
};
