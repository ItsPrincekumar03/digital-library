const bookRepository = require('../repositories/book.repository');
const {
    parsePagination,
    parseSort,
    buildPaginationMeta
} = require('../utils/pagination');

function notFound() {
    const err = new Error('Book not found.');
    err.status = 404;
    return err;
}

function forbidden(message) {
    const err = new Error(
        message || 'You do not have permission to modify this book.'
    );
    err.status = 403;
    return err;
}

const USER_ALLOWED_STATUSES = ['DRAFT', 'PENDING_REVIEW'];

const BOOK_SORT_COLUMNS = [
    'created_at',
    'title',
    'status',
    'publication_date'
];

async function createBook(
    ownerUserId,
    { title, description, coverPath, publicationDate }
) {
    const bookId = await bookRepository.create({
        ownerUserId,
        title,
        description,
        coverPath,
        publicationDate
    });

    return bookRepository.findById(bookId);
}

async function getAllBooks() {
    return bookRepository.findAll();
}

async function getAllBooksPaginated(query) {
    const { page, limit, offset } = parsePagination(query);

    const { column, direction } = parseSort(
        query,
        BOOK_SORT_COLUMNS,
        'created_at'
    );

    const [books, totalItems] = await Promise.all([
        bookRepository.findAllPaginated({
            limit,
            offset,
            sortColumn: column,
            sortDirection: direction
        }),
        bookRepository.countAll()
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

async function getBookById(bookId) {
    const book = await bookRepository.findById(bookId);

    if (!book) {
        throw notFound();
    }

    return book;
}

// requestingUser: { user_id, role_name }
async function updateBook(
    bookId,
    requestingUser,
    { title, description, coverPath, publicationDate, status }
) {
    const book = await bookRepository.findById(bookId);

    if (!book) {
        throw notFound();
    }

    const isAdmin = requestingUser.role_name === 'ADMIN';
    const isOwner = book.owner_id === requestingUser.user_id;

    if (!isAdmin && !isOwner) {
        throw forbidden("You cannot modify another user's book.");
    }

    const fields = {
        title,
        description: description ?? null,
        cover_path: coverPath ?? null,
        publication_date: publicationDate ?? null
    };

    if (status !== undefined) {
        if (!isAdmin) {
            if (!USER_ALLOWED_STATUSES.includes(status)) {
                throw forbidden(
                    'Only an admin can approve, reject, publish, or archive a book.'
                );
            }
        }

        fields.status = status;
    }

    await bookRepository.updateFields(bookId, fields);

    return bookRepository.findById(bookId);
}

async function archiveBook(bookId, requestingUser) {
    const book = await bookRepository.findById(bookId);

    if (!book) {
        throw notFound();
    }

    if (requestingUser.role_name !== 'ADMIN') {
        throw forbidden('Only an admin can archive a book.');
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
    archiveBook
};