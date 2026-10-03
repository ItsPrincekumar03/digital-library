const bookRepository = require('../repositories/book.repository');
const {
    parsePagination,
    parseSort,
    buildPaginationMeta
} = require('../utils/pagination');
const {
    PUBLIC_BOOK_STATUS,
    isAdmin,
    isBookPubliclyReadable
} = require('../utils/bookVisibility');

// Module 8.5 — PUBLIC LIBRARY RULES
//   * Public books are managed by ADMIN only (create / edit / publish / archive).
//   * Normal users can only READ books whose status is PUBLISHED.
//   * Lifecycle used by the API: DRAFT -> PUBLISHED -> ARCHIVED.
//   * Old statuses (PENDING_REVIEW, APPROVED, REJECTED) stay in the DB ENUM for
//     compatibility but are never written and never visible to normal users.
//   * Private user PDFs (Module 12) will use their own table (user_pdf_books),
//     NOT this books table.

function notFound() {
    const err = new Error('Book not found.');
    err.status = 404;
    return err;
}

function forbidden(message) {
    const err = new Error(
        message || 'Only an admin can manage public library books.'
    );
    err.status = 403;
    return err;
}

// Defense in depth: routes already use requireRole('ADMIN'),
// but the service refuses non-admins too.
function assertAdmin(requestingUser) {
    if (!isAdmin(requestingUser)) {
        throw forbidden();
    }
}

const BOOK_SORT_COLUMNS = [
    'created_at',
    'title',
    'status',
    'publication_date'
];

// Admin sees every status. Everyone else only sees PUBLISHED.
function statusFilterFor(requestingUser) {
    return isAdmin(requestingUser) ? undefined : PUBLIC_BOOK_STATUS;
}

// Admin-only. New public books always start as DRAFT.
// owner_id records which admin created the book.
async function createBook(
    requestingUser,
    { title, description, coverPath, publicationDate }
) {
    assertAdmin(requestingUser);

    const bookId = await bookRepository.create({
        ownerUserId: requestingUser.user_id,
        title,
        description,
        coverPath,
        publicationDate
    });

    return bookRepository.findById(bookId);
}

async function getAllBooks(requestingUser) {
    return bookRepository.findAll(statusFilterFor(requestingUser));
}

async function getAllBooksPaginated(requestingUser, query) {
    const { page, limit, offset } = parsePagination(query);

    const { column, direction } = parseSort(
        query,
        BOOK_SORT_COLUMNS,
        'created_at'
    );

    const status = statusFilterFor(requestingUser);

    const [books, totalItems] = await Promise.all([
        bookRepository.findAllPaginated({
            limit,
            offset,
            sortColumn: column,
            sortDirection: direction,
            status
        }),
        bookRepository.countAll(status)
    ]);

    return {
        books,
        meta: buildPaginationMeta({
            page,
            limit,
            totalItems
        })
    };
}

// Hidden books (draft / archived / legacy) look like "not found" to normal users.
async function getBookById(bookId, requestingUser) {
    const book = await bookRepository.findById(bookId);

    if (!book) {
        throw notFound();
    }

    if (!isAdmin(requestingUser) && !isBookPubliclyReadable(book)) {
        throw notFound();
    }

    return book;
}

async function updateBook(
    bookId,
    requestingUser,
    { title, description, coverPath, publicationDate, status }
) {
    assertAdmin(requestingUser);

    const book = await bookRepository.findById(bookId);

    if (!book) {
        throw notFound();
    }

    const fields = {
        title,
        description: description ?? null,
        cover_path: coverPath ?? null,
        publication_date: publicationDate ?? null
    };

    // The validator only allows DRAFT / PUBLISHED / ARCHIVED here.
    if (status !== undefined) {
        fields.status = status;
    }

    await bookRepository.updateFields(bookId, fields);

    return bookRepository.findById(bookId);
}

async function publishBook(bookId, requestingUser) {
    assertAdmin(requestingUser);

    const book = await bookRepository.findById(bookId);

    if (!book) {
        throw notFound();
    }

    await bookRepository.setStatus(bookId, PUBLIC_BOOK_STATUS);

    return bookRepository.findById(bookId);
}

async function archiveBook(bookId, requestingUser) {
    assertAdmin(requestingUser);

    const book = await bookRepository.findById(bookId);

    if (!book) {
        throw notFound();
    }

    await bookRepository.archive(bookId);

    return bookRepository.findById(bookId);
}

module.exports = {
    createBook,
    getAllBooks,
    getAllBooksPaginated,
    getBookById,
    updateBook,
    publishBook,
    archiveBook
};