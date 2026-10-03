const bookRepository = require('../repositories/book.repository');
const chapterRepository = require('../repositories/chapter.repository');
const {
    isAdmin,
    isBookPubliclyReadable,
    isChapterPubliclyReadable,
} = require('../utils/bookVisibility');

// Module 8.5: chapters belong to PUBLIC library books, so they are ADMIN-managed.
// Normal users can only read PUBLISHED chapters of PUBLISHED books.

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
    if (!isAdmin(requestingUser)) throw forbidden('Only an admin can manage chapters of public books.');

    const book = await bookRepository.findById(bookId);
    if (!book) throw notFound('Book not found.');

    return book;
}

async function createChapter(bookId, requestingUser, { chapterNumber, title, content }) {
    await assertAdminAndBook(bookId, requestingUser);

    const clash = await chapterRepository.findByBookAndNumber(bookId, chapterNumber);
    if (clash) throw conflict('A chapter with this number already exists for this book.');

    const chapterId = await chapterRepository.create({ bookId, chapterNumber, title, content });
    return chapterRepository.findById(chapterId);
}

async function getChaptersForBook(bookId, requestingUser) {
    const book = await bookRepository.findById(bookId);
    if (!book) throw notFound('Book not found.');

    const chapters = await chapterRepository.findByBook(bookId);
    if (isAdmin(requestingUser)) return chapters;

    // Normal user: the book must be public, and only published chapters are returned.
    if (!isBookPubliclyReadable(book)) throw notFound('Book not found.');
    return chapters.filter(isChapterPubliclyReadable);
}

async function getChapterById(chapterId, requestingUser) {
    const chapter = await chapterRepository.findById(chapterId);
    if (!chapter) throw notFound('Chapter not found.');

    if (isAdmin(requestingUser)) return chapter;

    const book = await bookRepository.findById(chapter.book_id);
    if (!isBookPubliclyReadable(book) || !isChapterPubliclyReadable(chapter)) {
        throw notFound('Chapter not found.');
    }
    return chapter;
}

async function updateChapter(chapterId, requestingUser, { chapterNumber, title, content }) {
    const chapter = await chapterRepository.findById(chapterId);
    if (!chapter) throw notFound('Chapter not found.');

    await assertAdminAndBook(chapter.book_id, requestingUser);

    if (chapterNumber !== chapter.chapter_number) {
        const clash = await chapterRepository.findByBookAndNumber(chapter.book_id, chapterNumber);
        if (clash) throw conflict('A chapter with this number already exists for this book.');
    }

    await chapterRepository.update(chapterId, { title, content, chapterNumber });
    return chapterRepository.findById(chapterId);
}

async function publishChapter(chapterId, requestingUser) {
    if (!isAdmin(requestingUser)) {
        throw forbidden('Only an admin can publish a chapter.');
    }

    const chapter = await chapterRepository.findById(chapterId);
    if (!chapter) throw notFound('Chapter not found.');

    await chapterRepository.setStatus(chapterId, 'PUBLISHED');
    return chapterRepository.findById(chapterId);
}

async function archiveChapter(chapterId, requestingUser) {
    if (!isAdmin(requestingUser)) {
        throw forbidden('Only an admin can archive a chapter.');
    }

    const chapter = await chapterRepository.findById(chapterId);
    if (!chapter) throw notFound('Chapter not found.');

    await chapterRepository.setStatus(chapterId, 'ARCHIVED');
    return chapterRepository.findById(chapterId);
}

async function reorderChapters(bookId, requestingUser, order) {
    await assertAdminAndBook(bookId, requestingUser);

    const existingChapters = await chapterRepository.findByBook(bookId);
    const existingIds = new Set(existingChapters.map((c) => c.chapter_id));

    for (const item of order) {
        if (!existingIds.has(Number(item.chapterId))) {
            throw notFound(`Chapter ${item.chapterId} does not belong to this book.`);
        }
    }

    await chapterRepository.reorder(bookId, order);
    return chapterRepository.findByBook(bookId);
}

module.exports = {
    createChapter, getChaptersForBook, getChapterById, updateChapter,
    publishChapter, archiveChapter, reorderChapters,
};