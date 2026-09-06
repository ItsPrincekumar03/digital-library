const bookRepository = require('../repositories/book.repository');
const chapterRepository = require('../repositories/chapter.repository');

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
    if (!isAdmin && !isOwner) throw forbidden("You cannot modify chapters of another user's book.");

    return { book, isAdmin };
}

async function createChapter(bookId, requestingUser, { chapterNumber, title, content }) {
    await assertBookOwnershipOrAdmin(bookId, requestingUser);

    const clash = await chapterRepository.findByBookAndNumber(bookId, chapterNumber);
    if (clash) throw conflict('A chapter with this number already exists for this book.');

    const chapterId = await chapterRepository.create({ bookId, chapterNumber, title, content });
    return chapterRepository.findById(chapterId);
}

async function getChaptersForBook(bookId) {
    const book = await bookRepository.findById(bookId);
    if (!book) throw notFound('Book not found.');
    return chapterRepository.findByBook(bookId);
}

async function getChapterById(chapterId) {
    const chapter = await chapterRepository.findById(chapterId);
    if (!chapter) throw notFound('Chapter not found.');
    return chapter;
}

async function updateChapter(chapterId, requestingUser, { chapterNumber, title, content }) {
    const chapter = await chapterRepository.findById(chapterId);
    if (!chapter) throw notFound('Chapter not found.');

    await assertBookOwnershipOrAdmin(chapter.book_id, requestingUser);

    if (chapterNumber !== chapter.chapter_number) {
        const clash = await chapterRepository.findByBookAndNumber(chapter.book_id, chapterNumber);
        if (clash) throw conflict('A chapter with this number already exists for this book.');
    }

    await chapterRepository.update(chapterId, { title, content, chapterNumber });
    return chapterRepository.findById(chapterId);
}

async function publishChapter(chapterId, requestingUser) {
    const chapter = await chapterRepository.findById(chapterId);
    if (!chapter) throw notFound('Chapter not found.');

    if (requestingUser.role_name !== 'ADMIN') {
        throw forbidden('Only an admin can publish a chapter.');
    }

    await chapterRepository.setStatus(chapterId, 'PUBLISHED');
    return chapterRepository.findById(chapterId);
}

async function archiveChapter(chapterId, requestingUser) {
    const chapter = await chapterRepository.findById(chapterId);
    if (!chapter) throw notFound('Chapter not found.');

    if (requestingUser.role_name !== 'ADMIN') {
        throw forbidden('Only an admin can archive a chapter.');
    }

    await chapterRepository.setStatus(chapterId, 'ARCHIVED');
    return chapterRepository.findById(chapterId);
}

async function reorderChapters(bookId, requestingUser, order) {
    await assertBookOwnershipOrAdmin(bookId, requestingUser);

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